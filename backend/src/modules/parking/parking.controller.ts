import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ParkingService } from './parking.service';
import { CreateParkingLocationDto } from './dto/create-parking-location.dto';
import { UpdateParkingLocationDto } from './dto/update-parking-location.dto';
import { UpdateParkingInventoryDto } from './dto/update-parking-inventory.dto';
import { QueryParkingLocationsDto } from './dto/query-parking-locations.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Parking Operator & Locations')
@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Post('locations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new parking facility (Approved Operator only)' })
  @ApiResponse({ status: 201, description: 'Parking facility created' })
  async createLocation(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateParkingLocationDto,
  ) {
    return this.parkingService.createLocation(user.userId, dto);
  }

  @Get('me/locations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all parking facilities owned by current operator' })
  @ApiResponse({ status: 200, description: 'List of owned facilities' })
  async getMyLocations(@CurrentUser() user: CurrentUserDto) {
    return this.parkingService.getMyLocations(user.userId);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Public search for active parking locations' })
  @ApiResponse({ status: 200, description: 'Paginated parking facilities list' })
  async findAll(@Query() query: QueryParkingLocationsDto) {
    return this.parkingService.findAll(query);
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get details for a specific parking facility' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'Parking facility details' })
  async findLocationById(@Param('id') id: string) {
    return this.parkingService.findLocationById(id);
  }

  @Patch('locations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update parking facility details and rates (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'Updated facility record' })
  async updateLocation(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateParkingLocationDto,
  ) {
    return this.parkingService.updateLocation(id, user, dto);
  }

  @Patch('locations/:id/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update live available spaces/inventory (Owner Operator or Admin)' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'Updated inventory record' })
  async updateInventory(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateParkingInventoryDto,
  ) {
    return this.parkingService.updateInventory(id, user, dto);
  }
}
