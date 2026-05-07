import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPlans, 
      totalCases, 
      llmConfigs, 
      rallyConfigs, 
      generatedToday,
      recentPlans,
      recentCases
    ] = await Promise.all([
      this.prisma.testPlan.count(),
      this.prisma.testCase.count(),
      this.prisma.lLMConfig.count(),
      this.prisma.rallyConfig.count(),
      this.prisma.testCase.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.testPlan.findMany({
        take: 5,
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.testCase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const activity = [
      ...recentPlans.map(p => ({
        type: 'test_plan_generated',
        title: `Plan generated: ${p.name}`,
        timestamp: p.generatedAt,
        status: 'success' as const,
        id: `plan-${p.id}`
      })),
      ...recentCases.map(c => ({
        type: 'test_case_generated',
        title: `Case generated: ${c.title}`,
        timestamp: c.createdAt,
        status: 'success' as const,
        id: `case-${c.id}`
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

    return {
      metrics: {
        totalTestPlans: totalPlans,
        totalTestCases: totalCases,
        activeLLMs: llmConfigs,
        activeRally: rallyConfigs,
        generatedToday: generatedToday,
        coverage: {
          manual: 100,
          automated: 0,
          coverage_percentage: 100,
        },
      },
      activity
    };
  }
}
