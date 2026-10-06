import {
  Controller,
  Get,
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
import { TechniciansService } from './technicians.service';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto';
import { UpdateTechnicianAvailabilityDto } from './dto/update-technician-availability.dto';
import { QueryTechniciansDto } from './dto/query-technicians.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Technicians Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techService: TechniciansService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current technician profile' })
  @ApiResponse({ status: 200, description: 'Technician profile entity' })
  async getMyProfile(@CurrentUser() user: CurrentUserDto) {
    return this.techService.findByUserId(user.userId);
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
