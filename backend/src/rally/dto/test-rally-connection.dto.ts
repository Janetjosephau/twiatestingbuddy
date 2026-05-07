import { IsString, IsOptional, Length } from 'class-validator';

export class TestRallyConnectionDto {
  @IsString()
  @Length(1, 200)
  instanceUrl: string;

  @IsString()
  @Length(1, 500)
  apiKey: string;

  @IsOptional()
  @IsString()
  workspaceName?: string;

  @IsOptional()
  @IsString()
  projectName?: string;
}
