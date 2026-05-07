import { IsString, IsUrl, Length, IsOptional } from 'class-validator';

export class FetchJiraRequirementsDto {
  @IsUrl()
  instanceUrl: string;

  @IsString()
  @Length(1, 255)
  email: string;

  @IsString()
  @Length(1, 255)
  apiToken: string;

  @IsString()
  @Length(1, 50)
  projectKey: string;

  @IsOptional()
  @IsString()
  issueType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  jql?: string;
}