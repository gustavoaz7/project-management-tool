import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export enum CreateIssuePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export class CreateIssueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsEnum(CreateIssuePriority)
  priority?: CreateIssuePriority;
}
