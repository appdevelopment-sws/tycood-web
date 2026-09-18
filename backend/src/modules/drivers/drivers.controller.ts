import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { QueryDriversDto } from './dto/query-drivers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Drivers & Fleet Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

  @Post('vehicles')
  @ApiOperation({ summary: 'Register a new vehicle in the fleet' })
  @ApiResponse({ status: 201, description: 'Vehicle registered' })
  async createVehicle(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.driversService.createVehicle(user.userId, dto);
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
}
