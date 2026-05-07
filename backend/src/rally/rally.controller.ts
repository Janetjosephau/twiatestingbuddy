import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { RallyService } from './rally.service';
import { TestRallyConnectionDto } from './dto/test-rally-connection.dto';
import { CreateRallyConfigDto } from './dto/create-rally-config.dto';
import { UploadToRallyDto } from './dto/upload-to-rally.dto';

@Controller('rally')
export class RallyController {
  constructor(private readonly rallyService: RallyService) {}

  @Post('test-connection')
  async testConnection(@Body() dto: TestRallyConnectionDto) {
    return this.rallyService.testConnection(dto);
  }

  @Post('upload')
  async uploadTestCases(@Body() dto: UploadToRallyDto) {
    return this.rallyService.uploadTestCases(dto);
  }

  @Post('fetch-requirements')
  async fetchRequirements(@Body() data: { query: string, rallyConfigId?: string }) {
    return this.rallyService.fetchRequirements(data);
  }

  @Post('configs')
  async createConfig(@Body() dto: CreateRallyConfigDto) {
    return this.rallyService.createConfig(dto);
  }

  @Get('configs')
  async getAllConfigs() {
    return this.rallyService.getAllConfigs();
  }

  @Delete('configs/:id')
  async deleteConfig(@Param('id') id: string) {
    return this.rallyService.deleteConfig(id);
  }
}
