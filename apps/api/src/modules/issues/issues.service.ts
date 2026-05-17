import { Injectable, NotFoundException } from "@nestjs/common";
import type { IssuePriority } from "@prisma/client";
import { PrismaService } from "../../platform/db/prisma.service";
import { CreateIssueDto } from "./dto/create-issue.dto";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async createIssue(projectId: string, dto: CreateIssueDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    const issue = await this.prisma.issue.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description || null,
        priority: (dto.priority as IssuePriority | undefined) ?? "MEDIUM"
      }
    });

    return issue;
  }
}
