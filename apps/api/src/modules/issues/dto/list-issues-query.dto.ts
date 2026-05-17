import { IssuePriority, IssueStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListIssuesQueryDto {
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;
}
