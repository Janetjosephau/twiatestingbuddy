import { Module } from '@nestjs/common';
import { TestCaseController } from './test-case.controller';
import { TestCaseService } from './test-case.service';
import { LlmModule } from '../llm/llm.module';

import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [LlmModule, DatabaseModule],
  controllers: [TestCaseController],
  providers: [TestCaseService],
  exports: [TestCaseService],
})
export class TestCaseModule {}