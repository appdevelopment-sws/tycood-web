import {
  Controller,
  Get,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TechniciansService } from './technicians.service.js';
import { TechnicianProviderServicesService } from './technician-provider-services.service.js';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto.js';
import { UpdateTechnicianAvailabilityDto } from './dto/update-technician-availability.dto.js';
import { QueryTechniciansDto } from './dto/query-technicians.dto.js';
import { ConfigureProviderServicesDto } from './dto/configure-provider-services.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { BusinessRole } from '../../common/enums/business-role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface.js';

@ApiTags('Technicians Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(
    private readonly techService: TechniciansService,
    private readonly providerServicesService: TechnicianProviderServicesService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current technician profile' })
  @ApiResponse({ status: 200, description: 'Technician profile entity' })
  async getMyProfile(@CurrentUser() user: CurrentUserDto) {
    return this.techService.findByUserId(user.userId);
  }

  @Get('me/services')
  @ApiOperation({ summary: 'Get services and custom prices offered by logged-in technician' })
  @ApiResponse({ status: 200, description: 'List of provider services with custom rates' })
  async getMyServices(@CurrentUser() user: CurrentUserDto) {
    return this.providerServicesService.getMyServices(user.userId);
  }

  @Put('me/services')
  @ApiOperation({
    summary: 'Configure services and set custom prices for logged-in technician',
  })
  @ApiResponse({ status: 200, description: 'Configured provider services' })
  async configureMyServices(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ConfigureProviderServicesDto,
  ) {
    return this.providerServicesService.configureMyServices(user.userId, dto);
  }

  @Get('services/:serviceCatalogItemId/providers')
  @ApiOperation({ summary: 'Find available mechanics offering a specific service with custom rates' })
  @ApiParam({ name: 'serviceCatalogItemId', description: 'Catalog Service Item UUID' })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of available matching providers' })
  async findProvidersForService(
    @Param('serviceCatalogItemId') serviceCatalogItemId: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    return this.providerServicesService.findAvailableProvidersForService(
      serviceCatalogItemId,
      latNum,
      lngNum,
    );
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current technician profile details' })
  @ApiResponse({ status: 200, description: 'Updated technician profile' })
  async updateMyProfile(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateTechnicianProfileDto,
  ) {
    return this.techService.updateProfile(user.userId, dto);
  }

  @Patch('me/availability')
  @ApiOperation({ summary: 'Update technician availability status (Requires VERIFIED status)' })
  @ApiResponse({ status: 200, description: 'Availability state updated' })
  async updateAvailability(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateTechnicianAvailabilityDto,
  ) {
    return this.techService.updateAvailability(user.userId, dto.availabilityStatus);
  }

  @Get()
  @ApiOperation({ summary: 'List and search technicians' })
  @ApiResponse({ status: 200, description: 'Paginated technicians list' })
  async findAll(@Query() query: QueryTechniciansDto) {
    return this.techService.findAll(query);
  }

  @Patch(':id/verify')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify technician profile and assign TECHNICIAN role (Admin only)' })
  @ApiParam({ name: 'id', description: 'Technician Profile UUID' })
  @ApiResponse({ status: 200, description: 'Verified technician record' })
  async verifyTechnician(
    @Param('id') id: string,
    @Body() dto: { notes?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.techService.verifyTechnician(id, admin.userId, dto?.notes);
  }

  @Patch(':id/reject')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject technician profile (Admin only)' })
  @ApiParam({ name: 'id', description: 'Technician Profile UUID' })
  @ApiResponse({ status: 200, description: 'Rejected technician record' })
  async rejectTechnician(
    @Param('id') id: string,
    @Body() dto: { rejectionReason?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.techService.rejectTechnician(id, admin.userId, dto?.rejectionReason);
  }
}
