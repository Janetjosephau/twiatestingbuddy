import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { LlmAdapterFactory } from './adapters/llm-adapter.factory';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LlmController],
  providers: [LlmService, LlmAdapterFactory, OllamaAdapter],
  exports: [LlmService],
})
export class LlmModule {}