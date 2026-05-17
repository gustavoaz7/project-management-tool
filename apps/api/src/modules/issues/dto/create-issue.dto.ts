import { IssuePriority } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateIssueDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;
}
