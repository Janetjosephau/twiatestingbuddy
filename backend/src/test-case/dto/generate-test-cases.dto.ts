import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateTestCasesDto {
  @IsString()
  @IsNotEmpty()
  testPlanId: string;

  @IsString()
  @IsNotEmpty()
  llmConfigId: string;

  @IsOptional()
  @IsString()
  additionalInstructions?: string;

  @IsOptional()
  @IsString()
  requirementBody?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;
}
