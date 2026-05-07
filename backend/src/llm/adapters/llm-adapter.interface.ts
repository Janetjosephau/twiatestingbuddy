export interface LLMAdapter {
  testConnection(config: any): Promise<{ success: boolean; error?: string; models?: string[] }>;
  generateText(prompt: string, config: any): Promise<{ success: boolean; text?: string; error?: string }>;
}

export interface LLMConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}