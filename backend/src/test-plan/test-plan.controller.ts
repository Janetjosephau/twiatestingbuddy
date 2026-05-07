import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { TestPlanService } from './test-plan.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';

@Controller('test-plans')
export class TestPlanController {
  constructor(private readonly testPlanService: TestPlanService) {}

  @Post('generate')
  async generateTestPlan(@Body() generateTestPlanDto: GenerateTestPlanDto) {
    return this.testPlanService.generateTestPlan(generateTestPlanDto);
  }

  @Get()
  async getAllTestPlans() {
    return this.testPlanService.getAllTestPlans();
  }

  @Get(':id')
  async getTestPlan(@Param('id') id: string) {
    return this.testPlanService.getTestPlan(id);
  }

  @Delete(':id')
  async deleteTestPlan(@Param('id') id: string) {
    return this.testPlanService.deleteTestPlan(id);
  }
}