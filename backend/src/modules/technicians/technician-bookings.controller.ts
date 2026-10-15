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
import { TechnicianBookingsService } from './technician-bookings.service.js';
import { CreateTechnicianBookingDto } from './dto/create-technician-booking.dto.js';
import { SubmitQuotationDto } from './dto/submit-quotation.dto.js';
import { AcceptQuotationDto } from './dto/accept-quotation.dto.js';
import { VerifyTechnicianOtpDto } from './dto/verify-technician-otp.dto.js';
import { QueryTechnicianBookingsDto } from './dto/query-technician-bookings.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface.js';
import { TechnicianBookingStatus } from '../../common/enums/technician-status.enum.js';

@ApiTags('Technician Bookings & Quotation Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('technicians/bookings')
export class TechnicianBookingsController {
  constructor(private readonly bookingsService: TechnicianBookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a technician booking (Flow A: Known Service, Flow B: Custom Inspection)',
  })
  @ApiResponse({ status: 201, description: 'Technician booking created' })
  async createBooking(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateTechnicianBookingDto,
  ) {
    return this.bookingsService.createBooking(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter technician bookings (Admin / Provider / User)' })
  @ApiResponse({ status: 200, description: 'Paginated bookings list' })
  async findAll(@Query() query: QueryTechnicianBookingsDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current customer bookings history' })
  @ApiResponse({ status: 200, description: 'Customer bookings' })
  async getMyBookings(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryTechnicianBookingsDto,
  ) {
    query.userId = user.userId;
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technician booking details by ID' })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking entity details' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Technician accepts incoming roadside request/inspection' })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  async acceptRequest(
    @Param('id') id: string,
    @CurrentUser() techUser: CurrentUserDto,
  ) {
    return this.bookingsService.acceptRequest(id, techUser.userId);
  }

  @Post(':id/quote')
  @ApiOperation({
    summary: 'Technician submits quotation amount for inspection / custom breakdown job',
  })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Quotation submitted' })
  async submitQuotation(
    @Param('id') id: string,
    @CurrentUser() techUser: CurrentUserDto,
    @Body() dto: SubmitQuotationDto,
  ) {
    return this.bookingsService.submitQuotation(id, techUser.userId, dto);
  }

  @Post(':id/accept-quote')
  @ApiOperation({
    summary: 'Customer accepts quotation and pays admin commission prepaid advance',
  })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Quote accepted and advance paid' })
  async acceptQuote(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: AcceptQuotationDto,
  ) {
    return this.bookingsService.acceptQuotationAndPayAdvance(id, user.userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update job progression status (EN_ROUTE, ARRIVED, etc.)' })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Job status updated' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() techUser: CurrentUserDto,
    @Body('status') status: TechnicianBookingStatus,
  ) {
    return this.bookingsService.updateJobStatus(id, techUser.userId, status);
  }

  @Post(':id/verify-start-otp')
  @ApiOperation({ summary: 'Technician verifies customer start OTP to begin service work' })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Work in progress' })
  async verifyStartOtp(
    @Param('id') id: string,
    @CurrentUser() techUser: CurrentUserDto,
    @Body() dto: VerifyTechnicianOtpDto,
  ) {
    return this.bookingsService.verifyStartOtp(id, techUser.userId, dto.otp);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Technician verifies customer completion OTP & confirms remaining cash/balance collected',
  })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Job completed successfully' })
  async completeJob(
    @Param('id') id: string,
    @CurrentUser() techUser: CurrentUserDto,
    @Body() dto: VerifyTechnicianOtpDto,
  ) {
    return this.bookingsService.completeJob(id, techUser.userId, dto.otp);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel technician booking' })
  @ApiParam({ name: 'id', description: 'Technician Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body('reason') reason: string,
  ) {
    return this.bookingsService.cancelBooking(id, user.userId, reason || 'Cancelled by user', 'USER');
  }
}
