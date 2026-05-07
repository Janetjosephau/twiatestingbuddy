import { IsString, IsEmail, IsOptional, Length } from 'class-validator';

export class CreateJiraConfigDto {
  @IsString()
  @Length(1, 200)
  instanceUrl: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 500)
  apiToken: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  projectKey?: string;
}
