import { IsEnum, IsString, IsOptional, IsNumber, IsUrl, Min, Max, Length } from 'class-validator';

export class CreateLlmConfigDto {
  @IsEnum(['ollama', 'groq', 'gemini', 'openai'])
  provider: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiUrl?: string;

  @IsString()
  @Length(1, 100)
  model: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32768)
  maxTokens?: number;
}