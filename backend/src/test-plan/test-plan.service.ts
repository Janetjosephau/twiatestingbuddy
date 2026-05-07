import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { GenerateTestPlanDto } from './dto/generate-test-plan.dto';
import { parseRobustJson } from '../utils/json-parser';

@Injectable()
export class TestPlanService {
  constructor(
     private readonly prisma: PrismaService,
     private readonly llmService: LlmService,
  ) {}

  private getMockTestPlans() {
    return [
      {
        id: 'tp-1',
        name: 'Authentication Module Test Plan',
        description: 'Comprehensive test plan for user authentication features',
        jiraIssueId: 'AUTH-123',
        generatedBy: 'llm-1',
        jiraConfigId: 'jira-1',
        content: JSON.stringify({
          name: 'Authentication Module Test Plan',
          description: 'Comprehensive test plan for user authentication features',
          objectives: ['Verify user login functionality', 'Test password reset flow', 'Validate session management'],
          scope: {
            inScope: ['Login page', 'Password reset', 'Session timeout'],
            outOfScope: ['Third-party authentication', 'Admin features']
          },
          strategy: 'Combination of manual and automated testing',
          resources: ['Test environment', 'Test data', 'Automation framework'],
          timeline: '2 weeks',
          exitCriteria: ['All critical tests pass', 'No open high-priority defects']
        }),
        exportFormat: 'json',
        status: 'draft',
        generatedAt: new Date(),
        testCases: []
      },
      {
        id: 'tp-2',
        name: 'User Dashboard Test Plan',
        description: 'Test plan for user dashboard functionality',
        jiraIssueId: 'DASH-456',
        generatedBy: 'llm-1',
        jiraConfigId: 'jira-1',
        content: JSON.stringify({
          name: 'User Dashboard Test Plan',
          description: 'Test plan for user dashboard functionality',
          objectives: ['Verify dashboard loads correctly', 'Test data visualization', 'Validate user interactions'],
          scope: {
            inScope: ['Dashboard widgets', 'Data charts', 'User settings'],
            outOfScope: ['Admin dashboard', 'System monitoring']
          },
          strategy: 'UI automation testing with manual verification',
          resources: ['UI test framework', 'Mock data', 'Cross-browser testing'],
          timeline: '3 weeks',
          exitCriteria: ['All UI elements functional', 'Performance benchmarks met']
        }),
        exportFormat: 'json',
        status: 'draft',
        generatedAt: new Date(),
        testCases: []
      }
    ];
  }

  async generateTestPlan(dto: GenerateTestPlanDto) {
    const { jiraIssueId, llmConfigId, context } = dto;

    const prompt = `
      You are an expert QA Manager. Generate a comprehensive test plan based on the following requirement:
      
      CONTEXT:
      ${context || 'No specific requirement details provided. Generate a general test plan.'}

      Return ONLY a JSON object with this structure:
      {
        "objectives": ["string"],
        "scope": { "inScope": ["string"], "outOfScope": ["string"] },
        "strategy": "string",
        "resources": ["string"],
        "timeline": "string",
        "exitCriteria": ["string"]
      }
      
      CRITICAL: Return ONLY valid JSON starting with { and ending with }. Do NOT include conversational text.
    `;

    try {
      const resultText = await this.llmService.generateText(prompt, llmConfigId);
      const planData = parseRobustJson(resultText);

      const testPlan = await this.prisma.testPlan.create({
        data: {
          name: `Test Plan for ${jiraIssueId}`,
          description: typeof planData.scope === 'string' ? planData.scope : (planData.scope?.inScope?.[0] || 'Generated test plan'),
          jiraIssueId,
          generatedBy: llmConfigId,
          content: JSON.stringify(planData),
          status: 'draft'
        },
      });

      return {
        success: true,
        testPlan,
        data: planData
      };
    } catch (error: any) {
      console.error('Test Plan Generation Error:', error);
      throw new BadRequestException(`Failed to generate test plan: ${error.message}`);
    }
  }

  async getAllTestPlans() {
    return this.prisma.testPlan.findMany({
      include: {
        llmConfig: true,
        testCases: true,
      },
    });
  }

  async getTestPlan(id: string) {
    const testPlan = await this.prisma.testPlan.findUnique({
      where: { id },
      include: {
        llmConfig: true,
        testCases: true,
      },
    });

    if (!testPlan) {
      throw new NotFoundException('Test plan not found');
    }

    return testPlan;
  }

  async deleteTestPlan(id: string) {
    // First delete associated test cases to avoid constraint errors
    await this.prisma.testCase.deleteMany({
      where: { testPlanId: id },
    });

    return this.prisma.testPlan.delete({
      where: { id },
    });
  }

  private buildTestPlanPrompt(requirement: any, additionalRequirements?: string[]): string {
    return `Generate a comprehensive test plan for the following Jira requirement:

Title: ${requirement.title}
Description: ${requirement.description}
Issue Type: ${requirement.issueType}
Priority: ${requirement.priority}
Status: ${requirement.status}

${additionalRequirements ? `Additional Requirements:\n${additionalRequirements.join('\n')}` : ''}

Please generate a test plan with the following structure:
1. Objectives
2. Scope (In Scope / Out of Scope)
3. Test Strategy
4. Resources Required
5. Timeline
6. Exit Criteria

Format the response as a JSON object with these exact keys: objectives (array), scope (object with inScope and outOfScope arrays), strategy (string), resources (array), timeline (string), exitCriteria (array).`;
  }
}