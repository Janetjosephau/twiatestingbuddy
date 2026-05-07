import { IsString, IsOptional, Length } from 'class-validator';

export class TestJiraConnectionDto {
  @IsString()
  @Length(1, 200)
  instanceUrl: string;

  @IsString()
  @Length(1, 255)
  email: string;

  @IsString()
  @Length(1, 255)
  apiToken: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  projectKey?: string;
}