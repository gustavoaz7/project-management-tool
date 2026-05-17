import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { CreateIssueCommentDto } from "./dto/create-issue-comment.dto";
import { ListIssuesQueryDto } from "./dto/list-issues-query.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";
import { IssuesService } from "./issues.service";

@Controller("projects/:projectId/issues")
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  listIssues(@Param("projectId") projectId: string, @Query() query: ListIssuesQueryDto) {
    return this.issuesService.listIssues(projectId, query);
  }

  @Get(":issueId")
  getIssue(@Param("projectId") projectId: string, @Param("issueId") issueId: string) {
    return this.issuesService.getIssue(projectId, issueId);
  }

  @Get(":issueId/comments")
  listComments(@Param("projectId") projectId: string, @Param("issueId") issueId: string) {
    return this.issuesService.listComments(projectId, issueId);
  }

  @Get(":issueId/activity")
  listActivity(@Param("projectId") projectId: string, @Param("issueId") issueId: string) {
    return this.issuesService.listActivity(projectId, issueId);
  }

  @Post()
  createIssue(@Param("projectId") projectId: string, @Body() body: CreateIssueDto) {
    return this.issuesService.createIssue(projectId, body);
  }

  @Post(":issueId/comments")
  addComment(
    @Param("projectId") projectId: string,
    @Param("issueId") issueId: string,
    @Body() body: CreateIssueCommentDto
  ) {
    return this.issuesService.addComment(projectId, issueId, body);
  }

  @Patch(":issueId")
  updateIssue(
    @Param("projectId") projectId: string,
    @Param("issueId") issueId: string,
    @Body() body: UpdateIssueDto
  ) {
    return this.issuesService.updateIssue(projectId, issueId, body);
  }
}
