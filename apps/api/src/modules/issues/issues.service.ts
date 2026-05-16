import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/db/prisma.service";
import { CreateIssueCommentDto } from "./dto/create-issue-comment.dto";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { ListIssuesQueryDto } from "./dto/list-issues-query.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";

type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
type ActivityEventType = "ISSUE_CREATED" | "ISSUE_UPDATED" | "COMMENT_ADDED";
type PrismaTransactionClient = {
  issue: PrismaService["issue"];
  issueComment: PrismaService["issueComment"];
  activityEvent: PrismaService["activityEvent"];
};

const allowedStatusTransitions: Record<IssueStatus, IssueStatus[]> = {
  BACKLOG: ["TODO", "IN_PROGRESS"],
  TODO: ["BACKLOG", "IN_PROGRESS"],
  IN_PROGRESS: ["TODO", "DONE"],
  DONE: ["TODO", "IN_PROGRESS"]
};

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getIssueOrThrow(projectId: string, issueId: string) {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    });

    if (!issue) {
      throw new NotFoundException(`Issue ${issueId} was not found in project ${projectId}.`);
    }

    return issue;
  }

  private async appendActivityEvent(
    prisma: PrismaTransactionClient,
    issueId: string,
    type: ActivityEventType,
    summary: string,
    actorName: string | null
  ) {
    await prisma.activityEvent.create({
      data: {
        issueId,
        type,
        actorName,
        summary
      }
    });
  }

  private async runInTransaction<T>(callback: (prisma: PrismaTransactionClient) => Promise<T>) {
    if (typeof this.prisma.$transaction === "function") {
      return this.prisma.$transaction((tx: unknown) => callback(tx as PrismaTransactionClient));
    }

    return callback(this.prisma as unknown as PrismaTransactionClient);
  }

  async listIssues(projectId: string, query: ListIssuesQueryDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    return this.prisma.issue.findMany({
      where: {
        projectId,
        ...(query.status ? { status: query.status as IssueStatus } : {}),
        ...(query.priority ? { priority: query.priority as IssuePriority } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
  }

  async getIssue(projectId: string, issueId: string) {
    return this.getIssueOrThrow(projectId, issueId);
  }

  async listComments(projectId: string, issueId: string) {
    await this.getIssueOrThrow(projectId, issueId);

    return this.prisma.issueComment.findMany({
      where: { issueId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  async listActivity(projectId: string, issueId: string) {
    await this.getIssueOrThrow(projectId, issueId);

    return this.prisma.activityEvent.findMany({
      where: { issueId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  async createIssue(projectId: string, dto: CreateIssueDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    return this.runInTransaction(async (prisma) => {
      const issue = await prisma.issue.create({
        data: {
          projectId,
          title: dto.title,
          description: dto.description || null,
          priority: (dto.priority as IssuePriority | undefined) ?? "MEDIUM"
        }
      });

      await this.appendActivityEvent(prisma, issue.id, "ISSUE_CREATED", "Issue created.", null);

      return issue;
    });
  }

  async updateIssue(projectId: string, issueId: string, dto: UpdateIssueDto) {
    const issue = await this.getIssueOrThrow(projectId, issueId);

    if (dto.status && dto.status !== issue.status) {
      const currentStatus = issue.status as IssueStatus;
      const allowedTransitions = allowedStatusTransitions[currentStatus];

      if (!allowedTransitions.includes(dto.status as IssueStatus)) {
        throw new BadRequestException(
          `Issue ${issueId} cannot transition from ${currentStatus} to ${dto.status}.`
        );
      }
    }

    const data: {
      title?: string;
      description?: string | null;
      priority?: IssuePriority;
      status?: IssueStatus;
    } = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description || null;
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority as IssuePriority;
    }

    if (dto.status !== undefined) {
      data.status = dto.status as IssueStatus;
    }

    return this.runInTransaction(async (prisma) => {
      const updatedIssue = await prisma.issue.update({
        where: {
          id: issueId
        },
        data
      });

      await this.appendActivityEvent(prisma, issueId, "ISSUE_UPDATED", "Issue updated.", null);

      return updatedIssue;
    });
  }

  async addComment(projectId: string, issueId: string, dto: CreateIssueCommentDto) {
    await this.getIssueOrThrow(projectId, issueId);

    return this.runInTransaction(async (prisma) => {
      const comment = await prisma.issueComment.create({
        data: {
          issueId,
          authorName: dto.authorName,
          body: dto.body
        }
      });

      await this.appendActivityEvent(
        prisma,
        issueId,
        "COMMENT_ADDED",
        `Comment added by ${dto.authorName}.`,
        dto.authorName
      );

      return comment;
    });
  }
}
