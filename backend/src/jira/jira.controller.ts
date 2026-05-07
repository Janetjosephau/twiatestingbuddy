import { Controller, Post, Body, Get, Param, Delete, Put } from '@nestjs/common';
import { JiraService } from './jira.service';
import { TestJiraConnectionDto } from './dto/test-jira-connection.dto';
import { FetchJiraRequirementsDto } from './dto/fetch-jira-requirements.dto';
import { CreateJiraConfigDto } from './dto/create-jira-config.dto';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Post('test-connection')
  async testConnection(@Body() testJiraConnectionDto: TestJiraConnectionDto) {
    return this.jiraService.testConnection(testJiraConnectionDto);
  }

  @Post('requirements')
  async fetchRequirements(@Body() fetchJiraRequirementsDto: FetchJiraRequirementsDto) {
    return this.jiraService.fetchRequirements(fetchJiraRequirementsDto);
  }

  @Get('projects')
  async getProjects(@Body() credentials: TestJiraConnectionDto) {
    return this.jiraService.getProjects(credentials);
  }
  @Post('configs')
  async createConfig(@Body() createJiraConfigDto: CreateJiraConfigDto) {
    return this.jiraService.createConfig(createJiraConfigDto);
  }

  @Get('configs')
  async getAllConfigs() {
    return this.jiraService.getAllConfigs();
  }

  @Get('configs/:id')
  async getConfig(@Param('id') id: string) {
    return this.jiraService.getConfig(id);
  }

  @Put('configs/:id')
  async updateConfig(
    @Param('id') id: string,
    @Body() updateJiraConfigDto: Partial<CreateJiraConfigDto>,
  ) {
    return this.jiraService.updateConfig(id, updateJiraConfigDto);
  }

  @Delete('configs/:id')
  async deleteConfig(@Param('id') id: string) {
    return this.jiraService.deleteConfig(id);
  }
}