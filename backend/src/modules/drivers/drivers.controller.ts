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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehiclesDto } from './dto/query-vehicles.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { QueryDriversDto } from './dto/query-drivers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Drivers & Fleet Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile and assigned vehicles' })
  @ApiResponse({ status: 200, description: 'Driver profile entity' })
  async getMyProfile(@CurrentUser() user: CurrentUserDto) {
    return this.driversService.findByUserId(user.userId);
  }

  @Patch('me/availability')
  @ApiOperation({
    summary: 'Update driver availability status (Requires VERIFIED status and active vehicle)',
  })
  @ApiResponse({ status: 200, description: 'Availability state updated' })
  async updateAvailability(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateDriverAvailabilityDto,
  ) {
    return this.driversService.updateAvailability(user.userId, dto.availabilityStatus);
  }

  // --- Vehicle & Fleet Management Routes ---

  @Get('vehicles')
  @ApiOperation({ summary: 'List and filter all fleet vehicles / cab types' })
  @ApiResponse({ status: 200, description: 'Paginated vehicles list' })
  async findAllVehicles(@Query() query: QueryVehiclesDto) {
    return this.driversService.findAllVehicles(query);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle / cab type details by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  async findVehicleById(@Param('id') id: string) {
    return this.driversService.findVehicleById(id);
  }

  @Post('vehicles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new vehicle in the fleet with pricing & card specs' })
  @ApiResponse({ status: 201, description: 'Vehicle registered' })
  async createVehicle(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.driversService.createVehicle(user?.userId || null, dto);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update vehicle specifications, pricing, and card badges' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.driversService.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Delete a fleet vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  async deleteVehicle(@Param('id') id: string) {
    return this.driversService.deleteVehicle(id);
  }

  @Post('me/vehicles/assign')
  @ApiOperation({ summary: 'Assign a registered vehicle to current driver' })
  @ApiResponse({ status: 201, description: 'Driver vehicle link created' })
  async assignVehicle(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: AssignVehicleDto,
  ) {
    const profile = await this.driversService.findByUserId(user.userId);
    return this.driversService.assignVehicle(profile.id, dto);
  }

  @Get('me/vehicles')
  @ApiOperation({ summary: 'List all vehicles assigned to current driver' })
  @ApiResponse({ status: 200, description: 'List of assigned vehicles' })
  async getMyVehicles(@CurrentUser() user: CurrentUserDto) {
    const profile = await this.driversService.findByUserId(user.userId);
    return this.driversService.getMyVehicles(profile.id);
  }

  @Get()
  @ApiOperation({ summary: 'List and search drivers (Admin / Dispatcher)' })
  @ApiResponse({ status: 200, description: 'Paginated drivers list' })
  async findAll(@Query() query: QueryDriversDto) {
    return this.driversService.findAll(query);
  }

  @Patch(':id/verify')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify driver profile and assign DRIVER role (Admin only)' })
  @ApiParam({ name: 'id', description: 'Driver Profile UUID' })
  @ApiResponse({ status: 200, description: 'Verified driver record' })
  async verifyDriver(
    @Param('id') id: string,
    @Body() dto: { notes?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.driversService.verifyDriver(id, admin.userId, dto?.notes);
  }

  @Patch(':id/reject')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject driver profile (Admin only)' })
  @ApiParam({ name: 'id', description: 'Driver Profile UUID' })
  @ApiResponse({ status: 200, description: 'Rejected driver record' })
  async rejectDriver(
    @Param('id') id: string,
    @Body() dto: { rejectionReason?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.driversService.rejectDriver(id, admin.userId, dto?.rejectionReason);
  }
}
