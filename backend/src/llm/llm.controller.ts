import { Controller, Post, Body, Get, Param, Delete, Put } from '@nestjs/common';
import { LlmService } from './llm.service';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('test-connection')
  async testConnection(@Body() testConnectionDto: TestConnectionDto) {
    return this.llmService.testConnection(testConnectionDto);
  }

  @Post('configs')
  async createConfig(@Body() createLlmConfigDto: CreateLlmConfigDto) {
    return this.llmService.createConfig(createLlmConfigDto);
  }

  @Get('configs')
  async getAllConfigs() {
    return this.llmService.getAllConfigs();
  }

  @Get('configs/:id')
  async getConfig(@Param('id') id: string) {
    return this.llmService.getConfig(id);
  }

  @Put('configs/:id')
  async updateConfig(
    @Param('id') id: string,
    @Body() updateLlmConfigDto: UpdateLlmConfigDto,
  ) {
    return this.llmService.updateConfig(id, updateLlmConfigDto);
  }

  @Delete('configs/:id')
  async deleteConfig(@Param('id') id: string) {
    return this.llmService.deleteConfig(id);
  }
}