import { IsEnum, IsString, IsOptional, IsNumber, IsUrl, Min, Max } from 'class-validator';

export class TestConnectionDto {
  @IsEnum(['ollama', 'groq', 'gemini', 'openai'])
  provider: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiUrl?: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;
}