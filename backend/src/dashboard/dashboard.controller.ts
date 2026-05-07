import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('metrics')
  async getMetrics() {
    return (await this.dashboardService.getOverview()).metrics;
  }

  @Get('activity')
  async getActivity() {
    return (await this.dashboardService.getOverview()).activity;
  }
}