import { IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  testPlanId: string;

  @IsString()
  caseId: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  preconditions: string[];

  @IsArray()
  steps: Array<{
    action: string;
    expectedResult: string;
  }>;

  @IsArray()
  @IsString({ each: true })
  postconditions: string[];

  @IsEnum(['Low', 'Medium', 'High'])
  priority: string;

  @IsOptional()
  @IsEnum(['New', 'In review', 'Approved', 'Retired'])
  status?: string;

  @IsOptional()
  @IsEnum(['Manual', 'Automate'])
  method?: string;

  @IsOptional()
  @IsEnum(['Functional', 'Performance'])
  type?: string;

  @IsOptional()
  @IsString()
  workProduct?: string;

  @IsOptional()
  @IsString()
  testFolder?: string;

  @IsOptional()
  @IsString()
  testData?: string;
}