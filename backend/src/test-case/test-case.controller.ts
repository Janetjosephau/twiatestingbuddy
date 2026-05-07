import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { TestCaseService } from './test-case.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';

@Controller('test-cases')
export class TestCaseController {
  constructor(private readonly testCaseService: TestCaseService) {}

  @Post('generate')
  async generateTestCases(@Body() generateTestCasesDto: GenerateTestCasesDto) {
    return this.testCaseService.generateTestCases(generateTestCasesDto);
  }

  @Post()
  async createTestCase(@Body() createTestCaseDto: CreateTestCaseDto) {
    return this.testCaseService.createTestCase(createTestCaseDto);
  }

  @Get()
  async getAllTestCases() {
    return this.testCaseService.getAllTestCases();
  }

  @Get(':id')
  async getTestCase(@Param('id') id: string) {
    return this.testCaseService.getTestCase(id);
  }

  @Put(':id')
  async updateTestCase(
    @Param('id') id: string,
    @Body() updateTestCaseDto: UpdateTestCaseDto,
  ) {
    return this.testCaseService.updateTestCase(id, updateTestCaseDto);
  }

  @Delete(':id')
  async deleteTestCase(@Param('id') id: string) {
    return this.testCaseService.deleteTestCase(id);
  }
}