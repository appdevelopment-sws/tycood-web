import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { CreateTruckTypeDto, UpdateTruckTypeDto } from './dto/truck-type.dto';
import { CreateLoadDto, UpdateLoadDto, CreateLoadBidDto } from './dto/load.dto';
import { QueryTruckTypesDto, QueryLoadsDto } from './dto/query-logistics.dto';
import {
  ApplyLogisticsProviderDto,
  ReviewLogisticsProviderDto,
  QueryLogisticsProvidersDto,
} from './dto/logistics-provider.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { BidStatus } from './enums/logistics.enums';

@ApiTags('Freight Logistics & Load Board')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  // =========================================================================
  // TRUCK TYPES (Admin Management & Driver App Filters)
  // =========================================================================

  @Get('truck-types')
  @ApiOperation({ summary: 'List and filter available truck and vehicle types' })
  @ApiResponse({ status: 200, description: 'Paginated list of truck types' })
  async getTruckTypes(@Query() query: QueryTruckTypesDto) {
    return this.logisticsService.getTruckTypes(query);
  }

  @Get('truck-types/:id')
  @ApiOperation({ summary: 'Get truck type details by ID' })
  @ApiParam({ name: 'id', description: 'Truck type UUID' })
  async getTruckTypeById(@Param('id') id: string) {
    return this.logisticsService.getTruckTypeById(id);
  }

  @Post('truck-types')
  @ApiOperation({ summary: 'Create a new truck/vehicle type (Admin)' })
  @ApiResponse({ status: 201, description: 'Truck type created successfully' })
  async createTruckType(@Body() dto: CreateTruckTypeDto) {
    return this.logisticsService.createTruckType(dto);
  }

  @Patch('truck-types/:id')
  @ApiOperation({ summary: 'Update truck/vehicle type (Admin)' })
  @ApiParam({ name: 'id', description: 'Truck type UUID' })
  async updateTruckType(
    @Param('id') id: string,
    @Body() dto: UpdateTruckTypeDto,
  ) {
    return this.logisticsService.updateTruckType(id, dto);
  }

  @Delete('truck-types/:id')
  @ApiOperation({ summary: 'Delete a truck type (Admin)' })
  @ApiParam({ name: 'id', description: 'Truck type UUID' })
  async deleteTruckType(@Param('id') id: string) {
    return this.logisticsService.deleteTruckType(id);
  }

  // =========================================================================
  // CARGO LOADS (Load Board Marketplace)
  // =========================================================================

  @Get('loads')
  @ApiOperation({ summary: 'Query active cargo loads with route & truck filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of cargo loads' })
  async getLoads(@Query() query: QueryLoadsDto) {
    return this.logisticsService.getLoads(query);
  }

  @Get('loads/:id')
  @ApiOperation({ summary: 'Get cargo load details by ID' })
  @ApiParam({ name: 'id', description: 'Load UUID' })
  async getLoadById(@Param('id') id: string) {
    return this.logisticsService.getLoadById(id);
  }

  @Post('loads')
  @ApiOperation({ summary: 'Post a new cargo freight load (Admin / Shipper)' })
  @ApiResponse({ status: 201, description: 'Cargo load posted successfully' })
  async createLoad(@Body() dto: CreateLoadDto) {
    return this.logisticsService.createLoad(dto);
  }

  @Patch('loads/:id')
  @ApiOperation({ summary: 'Update load details or status (Admin / Shipper)' })
  @ApiParam({ name: 'id', description: 'Load UUID' })
  async updateLoad(@Param('id') id: string, @Body() dto: UpdateLoadDto) {
    return this.logisticsService.updateLoad(id, dto);
  }

  @Delete('loads/:id')
  @ApiOperation({ summary: 'Delete a cargo load (Admin)' })
  @ApiParam({ name: 'id', description: 'Load UUID' })
  async deleteLoad(@Param('id') id: string) {
    return this.logisticsService.deleteLoad(id);
  }

  // =========================================================================
  // DRIVER BIDDING
  // =========================================================================

  @Post('loads/:id/bid')
  @ApiOperation({ summary: 'Driver places a negotiable counter-bid on a load' })
  @ApiParam({ name: 'id', description: 'Load UUID' })
  @ApiResponse({ status: 201, description: 'Bid placed successfully' })
  async placeBid(
    @Param('id') id: string,
    @Body() dto: CreateLoadBidDto,
    @CurrentUser() user?: CurrentUserDto,
  ) {
    return this.logisticsService.placeBid(id, dto, user?.userId);
  }

  @Get('loads/:id/bids')
  @ApiOperation({ summary: 'Get all counter-bids placed on a specific freight load' })
  @ApiParam({ name: 'id', description: 'Load UUID' })
  @ApiResponse({ status: 200, description: 'List of driver counter-bids' })
  async getLoadBids(@Param('id') id: string) {
    return this.logisticsService.getLoadBids(id);
  }

  @Get('bids/my')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all counter-bids placed by current user/driver' })
  @ApiResponse({ status: 200, description: 'List of bids submitted by user' })
  async getMyBids(
    @CurrentUser() user?: CurrentUserDto,
    @Query('userId') queryUserId?: string,
    @Query('phone') queryPhone?: string,
  ) {
    const effectiveUserId = user?.userId || queryUserId;
    return this.logisticsService.getMyBids(effectiveUserId, queryPhone);
  }

  @Patch('bids/:id/status')
  @ApiOperation({ summary: 'Accept or reject a counter-bid on a load' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Updated bid record' })
  async updateBidStatus(
    @Param('id') id: string,
    @Body() dto: { status: BidStatus },
  ) {
    return this.logisticsService.updateBidStatus(id, dto.status);
  }

  @Get('metrics')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get live logistics operational metrics' })
  @ApiResponse({ status: 200, description: 'Operational counters' })
  async getMetrics(
    @CurrentUser() user?: CurrentUserDto,
    @Query('userId') queryUserId?: string,
    @Query('phone') queryPhone?: string,
  ) {
    const effectiveUserId = user?.userId || queryUserId;
    return this.logisticsService.getLogisticsMetrics(effectiveUserId, queryPhone);
  }

  // =========================================================================
  // LOGISTICS PROVIDER ONBOARDING & ADMIN VERIFICATION
  // =========================================================================

  @Post('providers/apply')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Submit application to become a verified Logistics Load Provider' })
  @ApiResponse({ status: 201, description: 'Logistics provider application submitted for review' })
  async applyProvider(
    @Body() dto: ApplyLogisticsProviderDto,
    @CurrentUser() user?: CurrentUserDto,
    @Query('userId') queryUserId?: string,
  ) {
    const effectiveUserId = user?.userId || queryUserId || dto.userId;
    return this.logisticsService.applyProvider(effectiveUserId, dto);
  }

  @Get('providers/my')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get current user submitted logistics provider verification status' })
  @ApiResponse({ status: 200, description: 'Current logistics provider profile or status' })
  async getMyProvider(
    @CurrentUser() user?: CurrentUserDto,
    @Query('userId') queryUserId?: string,
    @Query('phone') queryPhone?: string,
  ) {
    const effectiveUserId = user?.userId || queryUserId;
    return this.logisticsService.getMyProvider(effectiveUserId, queryPhone);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List all logistics provider applicants and active partners (Admin)' })
  @ApiResponse({ status: 200, description: 'List of logistics provider records' })
  async getProviders(@Query() query: QueryLogisticsProvidersDto) {
    return this.logisticsService.getProviders(query);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get logistics provider details by ID' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiResponse({ status: 200, description: 'Logistics provider record' })
  async getProviderById(@Param('id') id: string) {
    return this.logisticsService.getProviderById(id);
  }

  @Patch('providers/:id/verify')
  @ApiOperation({ summary: 'Verify and approve logistics load provider (Admin only)' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiResponse({ status: 200, description: 'Verified logistics provider record' })
  async verifyProvider(
    @Param('id') id: string,
    @Body() dto: { notes?: string },
    @CurrentUser() admin?: CurrentUserDto,
  ) {
    return this.logisticsService.verifyProvider(id, admin?.userId, dto?.notes);
  }

  @Patch('providers/:id/reject')
  @ApiOperation({ summary: 'Reject logistics provider application (Admin only)' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  @ApiResponse({ status: 200, description: 'Rejected logistics provider record' })
  async rejectProvider(
    @Param('id') id: string,
    @Body() dto: { rejectionReason?: string },
    @CurrentUser() admin?: CurrentUserDto,
  ) {
    return this.logisticsService.rejectProvider(id, admin?.userId, dto?.rejectionReason);
  }
}
