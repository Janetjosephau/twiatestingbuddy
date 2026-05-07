import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../database/prisma.service';
import { TestJiraConnectionDto } from './dto/test-jira-connection.dto';
import { FetchJiraRequirementsDto } from './dto/fetch-jira-requirements.dto';
import { CreateJiraConfigDto } from './dto/create-jira-config.dto';

@Injectable()
export class JiraService {
  constructor(private readonly prisma: PrismaService) {}

  private createAuthHeader(email: string, apiToken: string): string {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  async testConnection(testJiraConnectionDto: TestJiraConnectionDto) {
    const { instanceUrl, email, apiToken, projectKey } = testJiraConnectionDto;

    try {
      const baseUrl = instanceUrl.replace(/\/$/, '');
      const authHeader = this.createAuthHeader(email, apiToken);
      const headers = {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Try searching for one issue to verify project access and credentials
      const searchUrl = `${baseUrl}/rest/api/3/search?jql=project="${projectKey}"&maxResults=1`;
      const response = await axios.get(searchUrl, { headers });

      return {
        success: true,
        status: 'connected',
        message: `Successfully connected to JIRA project "${projectKey}"!`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.errorMessages?.[0] || error.message;
      return {
        success: false,
        status: 'failed',
        message: `JIRA Connection Failed: ${errorMsg}. Please check your credentials and Project Key.`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createConfig(createJiraConfigDto: CreateJiraConfigDto) {
    try {
      const config = await this.prisma.jiraConfig.create({
        data: {
          instanceUrl: createJiraConfigDto.instanceUrl,
          email: createJiraConfigDto.email,
          apiToken: createJiraConfigDto.apiToken,
          projectKey: createJiraConfigDto.projectKey,
          testStatus: 'untested',
        },
      });

      return {
        ...config,
        message: 'JIRA Connection details saved successfully!'
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to save JIRA configuration: ${error.message}`);
    }
  }

  async getAllConfigs() {
    const configs = await this.prisma.jiraConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return configs.map(config => ({
      ...config,
      apiToken: this.maskApiToken(config.apiToken),
    }));
  }

  async getConfig(id: string) {
    const config = await this.prisma.jiraConfig.findUnique({
      where: { id },
    });
    if (!config) throw new NotFoundException('Jira configuration not found');
    return { ...config, apiToken: this.maskApiToken(config.apiToken) };
  }

  async updateConfig(id: string, updateJiraConfigDto: Partial<CreateJiraConfigDto>) {
    try {
      const updatedConfig = await this.prisma.jiraConfig.update({
        where: { id },
        data: updateJiraConfigDto,
      });
      return {
        ...updatedConfig,
        message: 'JIRA Connection details updated successfully!'
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to update JIRA configuration: ${error.message}`);
    }
  }

  async deleteConfig(id: string) {
    try {
      await this.prisma.jiraConfig.delete({
        where: { id },
      });
      return { message: 'JIRA configuration deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete this configuration because it is currently used by your saved Test Plans/Cases.');
      }
      throw new NotFoundException('Jira configuration not found or could not be deleted');
    }
  }

  private maskApiToken(token: string): string {
    if (!token || token.length <= 8) return '********';
    return token.substring(0, 4) + '****' + token.substring(token.length - 4);
  }

  // ------------------------------------------------------------
  // Additional endpoints used by the frontend
  // ------------------------------------------------------------

  /**
   * Fetch Jira requirements (issues) based on the provided DTO.
   * Returns a list of simplified issue objects.
   */
  async fetchRequirements(dto: FetchJiraRequirementsDto) {
    const { instanceUrl, email, apiToken, projectKey, issueType, status, jql } = dto;
    const baseUrl = instanceUrl.replace(/\/$/, '');
    const authHeader = this.createAuthHeader(email, apiToken);
    const headers = { Authorization: authHeader, Accept: 'application/json' };

    // Build JQL query with optional filters
    let query = `project=\"${projectKey}\"`;
    if (issueType) query += ` AND issuetype=\"${issueType}\"`;
    if (status) query += ` AND status=\"${status}\"`;
    if (jql) query += ` AND (${jql})`;

    const url = `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(query)}&maxResults=50`;
    try {
      const response = await axios.get(url, { headers });
      const issues = response.data?.issues?.map((issue: any) => ({
        key: issue.key,
        title: issue.fields.summary,
        description: issue.fields.description || '',
        issueType: issue.fields.issuetype?.name,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
      })) || [];
      return { success: true, requirements: issues };
    } catch (error: any) {
      const errMsg = error.response?.data?.errorMessages?.[0] || error.message;
      return { success: false, message: `Failed to fetch requirements: ${errMsg}` };
    }
  }

  /**
   * Retrieve a list of projects accessible with the given credentials.
   */
  async getProjects(dto: TestJiraConnectionDto) {
    const { instanceUrl, email, apiToken } = dto;
    const baseUrl = instanceUrl.replace(/\/$/, '');
    const authHeader = this.createAuthHeader(email, apiToken);
    const headers = { Authorization: authHeader, Accept: 'application/json' };
    const url = `${baseUrl}/rest/api/3/project/search?maxResults=100`;
    try {
      const response = await axios.get(url, { headers });
      const projects = response.data?.values?.map((p: any) => ({ id: p.id, key: p.key, name: p.name })) || [];
      return { success: true, projects };
    } catch (error: any) {
      const errMsg = error.response?.data?.errorMessages?.[0] || error.message;
      return { success: false, message: `Failed to fetch projects: ${errMsg}` };
    }
  }
}

// Production Build Verification: v1.0.2
