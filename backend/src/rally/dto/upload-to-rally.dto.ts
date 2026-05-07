import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadToRallyDto {
  @IsString()
  @IsNotEmpty()
  rallyConfigId: string;

  @IsArray()
  @IsNotEmpty()
  testCases: any[];

  @IsOptional()
  @IsString()
  storyKey?: string;
}
