import {
  Controller,
  Post,
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
import { ApplicationsService } from './applications.service';
import { ApplyTechnicianDto } from './dto/apply-technician.dto';
import { ApplyDriverDto } from './dto/apply-driver.dto';
import { ApplyParkingDto } from './dto/apply-parking.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Professional Applications Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly appService: ApplicationsService) {}

  @Post('technician')
  @ApiOperation({ summary: 'Submit application to become an Automotive Technician' })
  @ApiResponse({ status: 201, description: 'Technician application submitted for review' })
  async applyTechnician(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ApplyTechnicianDto,
  ) {
    return this.appService.applyTechnician(user.userId, dto);
  }

  @Post('driver')
  @ApiOperation({ summary: 'Submit application to become a Professional Driver' })
  @ApiResponse({ status: 201, description: 'Driver application submitted for review' })
  async applyDriver(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ApplyDriverDto,
  ) {
    return this.appService.applyDriver(user.userId, dto);
  }

  @Post('parking')
  @ApiOperation({ summary: 'Submit application to become a Parking Operator' })
  @ApiResponse({ status: 201, description: 'Parking Operator application submitted for review' })
  async applyParking(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ApplyParkingDto,
  ) {
    return this.appService.applyParking(user.userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user submitted professional applications' })
  @ApiResponse({ status: 200, description: 'List of submitted applications' })
  async getMyApplications(@CurrentUser() user: CurrentUserDto) {
    return this.appService.findByUserId(user.userId);
  }

  @Get()
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all partner applications with pagination and filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated applications list' })
  async findAll(@Query() query: QueryApplicationsDto) {
    return this.appService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details by ID' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Application record' })
  async findById(@Param('id') id: string) {
    return this.appService.findById(id);
  }

  @Patch(':id/review')
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Review and approve/reject partner application (Admin only)' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Reviewed application record' })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.appService.review(id, dto, admin.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel pending application (Applicant only)' })
  @ApiParam({ name: 'id', description: 'Application UUID' })
  @ApiResponse({ status: 200, description: 'Cancelled application record' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.appService.cancel(id, user.userId);
  }
}
