import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class GenerateTestPlanDto {
  @IsString()
  jiraIssueId: string;

  @IsOptional()
  @IsString()
  jiraRequirement?: string; // JSON string of the Jira requirement

  @IsOptional()
  @IsString()
  llmConfigId?: string;

  @IsOptional()
  @IsString()
  jiraConfigId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalRequirements?: string[];

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsEnum(['pdf', 'json'])
  exportFormat?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;
}