import {
  Controller,
  Get,
  Post,
  Patch,
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
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { QueryBookingsDto } from './dto/query-bookings.dto.js';
import { AvailableCabsQueryDto } from './dto/available-cabs-query.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface.js';
import { BusinessRole } from '../../common/enums/business-role.enum.js';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('cabs/available')
  @ApiOperation({
    summary: 'Search available cabs & fare estimates',
    description:
      'Returns a list of available cabs and categories based on trip parameters and active fleet catalog.',
  })
  @ApiResponse({ status: 200, description: 'Available cabs fetched successfully' })
  async getAvailableCabs(@Query() query: AvailableCabsQueryDto) {
    return this.bookingsService.getAvailableCabs(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new ride or service booking',
    description:
      'Creates a confirmed booking for the authenticated user inside an atomic database transaction.',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Validation or parameter error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBooking(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all bookings (Admin/Fleet view or authenticated user)',
    description:
      'Returns a paginated list of bookings with optional serviceType, status, and search filters.',
  })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getAllBookings(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryBookingsDto,
  ) {
    const isAdmin = user.roles?.some(
      (r) =>
        r === 'ADMIN' ||
        r === 'SUPER_ADMIN' ||
        r === BusinessRole.ADMIN ||
        r === BusinessRole.SUPER_ADMIN,
    );
    if (isAdmin) {
      return this.bookingsService.getAllBookings(query);
    }
    return this.bookingsService.getMyBookings(user.userId, query);
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List bookings for authenticated user',
    description:
      'Returns a paginated list of bookings with optional serviceType, status, and search filters.',
  })
  @ApiResponse({ status: 200, description: 'User bookings retrieved successfully' })
  async getMyBookings(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.getMyBookings(user.userId, query);
  }

  @Get('pending-dispatches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending unassigned booking requests within operating radius',
    description:
      'Returns pending requests matching service category and within 20km radius',
  })
  @ApiResponse({ status: 200, description: 'List of unassigned pending bookings' })
  async getPendingDispatches(
    @Query('serviceType') serviceType?: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radiusKm') radiusKm?: number,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.getPendingDispatches({
      serviceType,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radiusKm: radiusKm !== undefined ? Number(radiusKm) : undefined,
      search,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get booking details by ID or bookingNumber',
    description:
      'Fetches the complete booking details including vehicle, driver, and journey info.',
  })
  @ApiParam({ name: 'id', description: 'UUID or bookingNumber (e.g. #CAB-84920)' })
  @ApiResponse({ status: 200, description: 'Booking details found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingById(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
  ) {
    const isAdmin = user.roles?.some(
      (r) =>
        r === 'ADMIN' ||
        r === 'SUPER_ADMIN' ||
        r === BusinessRole.ADMIN ||
        r === BusinessRole.SUPER_ADMIN,
    );
    return this.bookingsService.getBookingById(id, user.userId, isAdmin);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel an active or upcoming booking',
    description:
      'Cancels the ride booking with a recorded cancellation reason inside an ACID transaction.',
  })
  @ApiParam({ name: 'id', description: 'Booking UUID or booking number' })
  @ApiResponse({ status: 200, description: 'Booking successfully cancelled' })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  async cancelBooking(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const isAdmin = user.roles?.some(
      (r) =>
        r === 'ADMIN' ||
        r === 'SUPER_ADMIN' ||
        r === BusinessRole.ADMIN ||
        r === BusinessRole.SUPER_ADMIN,
    );
    return this.bookingsService.cancelBooking(id, user.userId, dto.reason, isAdmin);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update ride status (Active / Completed / Cancelled)',
    description:
      'Updates booking lifecycle status with OTP validation for start/finish.',
  })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Driver accepts a booking request',
    description:
      'Atomically claims an unassigned booking, sets status to ACTIVE, and broadcasts booking_taken via WebSocket to dismiss all other popups immediately.',
  })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking successfully accepted and assigned' })
  @ApiResponse({ status: 409, description: 'Booking already taken by another driver' })
  async acceptBooking(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.bookingsService.acceptBooking(id, user.userId);
  }
}
