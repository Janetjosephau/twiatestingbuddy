import { Injectable } from '@nestjs/common';
import { LLMAdapter } from './llm-adapter.interface';
import { OllamaAdapter } from './ollama.adapter';

@Injectable()
export class LlmAdapterFactory {
  constructor(private readonly ollamaAdapter: OllamaAdapter) {}

  getAdapter(provider: string): LLMAdapter {
    if (provider === 'ollama') {
      return this.ollamaAdapter;
    }
    throw new Error(`Unsupported LLM provider: ${provider}. Only Ollama is supported.`);
  }
}