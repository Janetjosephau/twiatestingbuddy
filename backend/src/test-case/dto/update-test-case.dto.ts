import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

export class UpdateTestCaseDto {
  @IsOptional()
  @IsString()
  testPlanId?: string;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preconditions?: string[];

  @IsOptional()
  @IsArray()
  steps?: Array<{
    action: string;
    expectedResult: string;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postconditions?: string[];

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsEnum(['draft', 'selected', 'synced_to_rally'])
  status?: string;

  @IsOptional()
  @IsString()
  testData?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  automationTags?: string[];
}
