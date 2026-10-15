import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { DashboardOverviewResponse } from './dto/dashboard-overview.dto.js';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get executive dashboard overview metrics & charts',
    description:
      'Aggregates multi-service operational metrics, revenue analytics, fleet capacity, partner status, and recent bookings dynamically from the database.',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    enum: ['today', '7d', '30d'],
    description: 'Time window for trend analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard aggregated overview fetched successfully',
  })
  async getOverview(
    @Query('timeRange') timeRange?: 'today' | '7d' | '30d',
  ): Promise<DashboardOverviewResponse> {
    return this.dashboardService.getOverview(timeRange || '7d');
  }
}
