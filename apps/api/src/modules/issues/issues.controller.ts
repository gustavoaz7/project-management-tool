import { Body, Controller, Param, Post } from "@nestjs/common";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { IssuesService } from "./issues.service";

@Controller("projects/:projectId/issues")
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  createIssue(@Param("projectId") projectId: string, @Body() body: CreateIssueDto) {
    return this.issuesService.createIssue(projectId, body);
  }
}
