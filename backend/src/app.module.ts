import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { JiraModule } from './jira/jira.module';
import { RallyModule } from './rally/rally.module';
import { TestPlanModule } from './test-plan/test-plan.module';
import { TestCaseModule } from './test-case/test-case.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    LlmModule,
    JiraModule,
    RallyModule,
    TestPlanModule,
    TestCaseModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}