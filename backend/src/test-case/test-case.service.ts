import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmService } from '../llm/llm.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { GenerateTestCasesDto } from './dto/generate-test-cases.dto';
import { parseRobustJson } from '../utils/json-parser';

@Injectable()
export class TestCaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) { }

  async generateTestCases(dto: GenerateTestCasesDto) {
    const { testPlanId, llmConfigId, additionalInstructions, requirementBody } = dto;

    const antiHallucinationRule = `ROLE: You are a QA assistant operating under strict verification rules.

## SCOPE OF KNOWLEDGE
You may ONLY use information explicitly provided in:
- Userstory from Rally in description field, Attachment, Notes, screenshots, Requirements.
- API documentation
- Logs
- Test data
- User input

## STRICT RULES (MANDATORY)
1. DO NOT invent features, APIs, error codes, UI elements, or behavior.
2. DO NOT assume default or "typical" system behavior.
3. If information is missing or unclear, respond with: "Insufficient information to determine."
4. Every assertion must be traceable to provided input.
5. If a detail is inferred, label it explicitly as: "Inference (low confidence)".
6. No redundant test case; each test must validate a unique condition.
7. Ensure critical path coverage with positive and negative test cases.
8. Use realistic data and include boundary values.
9. Include edge and error test cases.

## PROCESS YOU MUST FOLLOW
**Step 1:** Extract verifiable facts from the input.
**Step 2:** List unknown or missing information.
**Step 3:** Generate output ONLY from Step 1 facts.
**Step 4:** Perform a self‑check for hallucinations or contradictions.`;

    const prompt = `
      You are an expert QA Automation Engineer. ${antiHallucinationRule}
      
      CRITICAL INSTRUCTION: You MUST read the REQUIREMENT block below very carefully. Do NOT generate generic test cases. Every single test case you generate MUST directly map to a specific sentence or Acceptance Criteria mentioned in the REQUIREMENT. If the requirement is short, generate fewer test cases. Do NOT invent scenarios that are not explicitly or implicitly demanded by the requirement.
      
      REQUIREMENT TO TEST:
      ${requirementBody || 'No requirement details provided.'}

      USER INSTRUCTIONS:
      ${additionalInstructions || 'Generate standard functional test cases.'}

      Return ONLY a JSON array of objects. Each object MUST have this structure:
      {
        "caseId": "TC-001",
        "title": "Short descriptive title explicitly referencing the requirement",
        "preconditions": ["List of strings"],
        "steps": [
          { "action": "Step action", "expectedResult": "Expected result matching the requirement" }
        ],
        "postconditions": ["List of strings"],
        "priority": "High",
        "testData": "JSON string or description of data required"
      }
      
      CRITICAL: Return ONLY valid JSON starting with [ and ending with ]. Do NOT include any markdown formatting, backticks, or intro/outro text.
    `;

    try {
      const resultText = await this.llmService.generateText(prompt, llmConfigId);

      const generatedCases = parseRobustJson(resultText);

      const savedCases = [];

      for (const tc of generatedCases) {
        const saved = await this.prisma.testCase.create({
          data: {
            testPlanId: testPlanId !== 'manual-gen' ? testPlanId : (await this.getOrCreateDefaultPlan()).id,
            caseId: tc.caseId,
            title: tc.title,
            preconditions: JSON.stringify(tc.preconditions || []),
            steps: JSON.stringify(tc.steps || []),
            postconditions: JSON.stringify(tc.postconditions || []),
            priority: tc.priority || 'Medium',
            testData: tc.testData ? JSON.stringify(tc.testData) : null,
            status: 'New',
          }
        });

        savedCases.push({
          ...saved,
          preconditions: JSON.parse(saved.preconditions),
          steps: JSON.parse(saved.steps),
          postconditions: JSON.parse(saved.postconditions),
          testData: saved.testData ? JSON.parse(saved.testData) : null,
        });
      }

      return {
        success: true,
        message: `Generated and saved ${savedCases.length} test cases.`,
        testCases: savedCases,
      };
    } catch (error: any) {
      console.error('Generation Error:', error);
      throw new BadRequestException(`Failed to generate test cases: ${error.message}`);
    }
  }

  private async getOrCreateDefaultPlan() {
    let plan = await this.prisma.testPlan.findFirst({
      where: { name: 'Ad-hoc Generated Plan' }
    });

    if (!plan) {
      // Need an LLM config for relation
      const llm = await this.prisma.lLMConfig.findFirst();
      if (!llm) throw new BadRequestException('No LLM configuration found. Please create one first.');

      plan = await this.prisma.testPlan.create({
        data: {
          name: 'Ad-hoc Generated Plan',
          description: 'Automatically created for decoupled test case generation',
          jiraIssueId: 'GEN-1',
          generatedBy: llm.id,
          content: '{}',
          status: 'draft'
        }
      });
    }
    return plan;
  }

  async createTestCase(createTestCaseDto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        ...createTestCaseDto,
        preconditions: JSON.stringify(createTestCaseDto.preconditions || []),
        steps: JSON.stringify(createTestCaseDto.steps || []),
        postconditions: JSON.stringify(createTestCaseDto.postconditions || []),
        testData: createTestCaseDto.testData ? JSON.stringify(createTestCaseDto.testData) : null,
      },
    });
  }

  async getAllTestCases() {
    const cases = await this.prisma.testCase.findMany({
      include: { testPlan: true },
    });
    return cases.map(tc => ({
      ...tc,
      preconditions: JSON.parse(tc.preconditions),
      steps: JSON.parse(tc.steps),
      postconditions: JSON.parse(tc.postconditions),
      testData: tc.testData ? JSON.parse(tc.testData) : null,
    }));
  }

  async getTestCase(id: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
      include: { testPlan: true },
    });
    if (!testCase) throw new NotFoundException('Test case not found');
    return {
      ...testCase,
      preconditions: JSON.parse(testCase.preconditions),
      steps: JSON.parse(testCase.steps),
      postconditions: JSON.parse(testCase.postconditions),
      testData: testCase.testData ? JSON.parse(testCase.testData) : null,
    };
  }

  async updateTestCase(id: string, updateTestCaseDto: UpdateTestCaseDto) {
    const data: any = { ...updateTestCaseDto };
    if (updateTestCaseDto.preconditions) data.preconditions = JSON.stringify(updateTestCaseDto.preconditions);
    if (updateTestCaseDto.steps) data.steps = JSON.stringify(updateTestCaseDto.steps);
    if (updateTestCaseDto.postconditions) data.postconditions = JSON.stringify(updateTestCaseDto.postconditions);
    if (updateTestCaseDto.testData) data.testData = JSON.stringify(updateTestCaseDto.testData);

    return this.prisma.testCase.update({
      where: { id },
      data
    });
  }

  async deleteTestCase(id: string) {
    await this.prisma.testCase.delete({ where: { id } });
    return { message: 'Test case deleted successfully' };
  }
}
