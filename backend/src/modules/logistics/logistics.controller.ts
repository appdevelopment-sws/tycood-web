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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

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
}
