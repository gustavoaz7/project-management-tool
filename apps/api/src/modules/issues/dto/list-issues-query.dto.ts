import { IsEnum, IsOptional } from "class-validator";
import { CreateIssuePriority } from "./create-issue.dto";
import { UpdateIssueStatus } from "./update-issue.dto";

export class ListIssuesQueryDto {
  @IsOptional()
  @IsEnum(UpdateIssueStatus)
  status?: UpdateIssueStatus;

  @IsOptional()
  @IsEnum(CreateIssuePriority)
  priority?: CreateIssuePriority;
}
