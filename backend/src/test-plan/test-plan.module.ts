import { Module } from '@nestjs/common';
import { TestPlanController } from './test-plan.controller';
import { TestPlanService } from './test-plan.service';

import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [DatabaseModule, LlmModule],
  controllers: [TestPlanController],
  providers: [TestPlanService],
  exports: [TestPlanService],
})
export class TestPlanModule {}