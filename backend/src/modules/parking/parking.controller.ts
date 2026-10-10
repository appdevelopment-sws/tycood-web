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
import { CalculateParkingQuoteDto } from './dto/calculate-parking-quote.dto';
import { HoldParkingSlotDto } from './dto/hold-parking-slot.dto';
import { ConfirmParkingPaymentDto } from './dto/confirm-parking-payment.dto';
import { VerifyParkingEntryDto } from './dto/verify-parking-entry.dto';
import { CheckoutParkingDto } from './dto/checkout-parking.dto';
import { WalkinParkingCheckinDto } from './dto/walkin-parking-checkin.dto';
import { UpdateParkingSettingsDto } from './dto/update-parking-settings.dto';
import { QueryParkingBookingsDto } from './dto/query-parking-bookings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface';

@ApiTags('Parking Service & Bookings')
@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // -------------------------------------------------------------
  // PUBLIC & OPERATOR FACILITY ENDPOINTS
  // -------------------------------------------------------------

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

  // -------------------------------------------------------------
  // USER PARKING BOOKING WORKFLOW
  // -------------------------------------------------------------

  @Post('bookings/calculate-quote')
  @ApiOperation({ summary: 'Calculate real-time pricing and required advance amount' })
  @ApiResponse({ status: 200, description: 'Price and advance breakdown' })
  async calculateQuote(@Body() dto: CalculateParkingQuoteDto) {
    return this.parkingService.calculateQuote(dto);
  }

  @Post('bookings/hold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Temporarily hold parking capacity for payment (10 mins hold)' })
  @ApiResponse({ status: 201, description: 'Reservation hold created' })
  async holdSlot(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: HoldParkingSlotDto,
  ) {
    return this.parkingService.holdSlot(user.userId, dto);
  }

  @Post('bookings/:id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm advance payment and activate booking (Generates PIN & QR)' })
  @ApiParam({ name: 'id', description: 'Parking Booking UUID' })
  @ApiResponse({ status: 200, description: 'Confirmed booking pass' })
  async confirmPayment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ConfirmParkingPaymentDto,
  ) {
    return this.parkingService.confirmPayment(id, user.userId, dto);
  }

  @Post('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking and process refund per policy' })
  @ApiParam({ name: 'id', description: 'Parking Booking UUID' })
  @ApiResponse({ status: 200, description: 'Cancelled booking record with refund status' })
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: { reason?: string },
  ) {
    return this.parkingService.cancelBooking(id, user.userId, dto?.reason);
  }

  @Get('bookings/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user parking bookings' })
  @ApiResponse({ status: 200, description: 'List of user parking bookings' })
  async getUserBookings(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryParkingBookingsDto,
  ) {
    return this.parkingService.getUserBookings(user.userId, query);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of specific parking booking pass' })
  @ApiParam({ name: 'id', description: 'Parking Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking pass details' })
  async getBookingById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.parkingService.getBookingById(id, user);
  }

  // -------------------------------------------------------------
  // OPERATOR GATE OPERATIONS
  // -------------------------------------------------------------

  @Get('locations/:id/bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings for operator facility' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'List of facility bookings' })
  async getLocationBookings(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Query() query: QueryParkingBookingsDto,
  ) {
    return this.parkingService.getLocationBookings(id, user, query);
  }

  @Get('locations/:id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time facility bay occupancy and daily revenue' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'Live facility statistics' })
  async getLocationStats(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.parkingService.getLocationStats(id, user);
  }

  @Post('locations/:id/verify-entry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify QR pass or Gate PIN and check in vehicle' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle checked in' })
  async verifyAndCheckIn(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: VerifyParkingEntryDto,
  ) {
    return this.parkingService.verifyAndCheckIn(id, user, dto);
  }

  @Post('locations/:id/bookings/:bookingId/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record vehicle departure, compute overtime, and complete booking' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiParam({ name: 'bookingId', description: 'Parking Booking UUID' })
  @ApiResponse({ status: 200, description: 'Completed booking with final receipt' })
  async checkOut(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CheckoutParkingDto,
  ) {
    return this.parkingService.checkOut(id, bookingId, user, dto);
  }

  @Post('locations/:id/walkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record drive-up walk-in vehicle check-in' })
  @ApiParam({ name: 'id', description: 'Parking Location UUID' })
  @ApiResponse({ status: 201, description: 'Walk-in check-in ticket issued' })
  async walkInCheckIn(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: WalkinParkingCheckinDto,
  ) {
    return this.parkingService.walkInCheckIn(id, user, dto);
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: SETTINGS & AUDIT ENDPOINTS
  // -------------------------------------------------------------

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current parking commission & advance policy settings (Admin)' })
  @ApiResponse({ status: 200, description: 'Parking platform configuration' })
  async getParkingSettings() {
    return this.parkingService.getParkingSettings();
  }

  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update parking commission & advance payment configuration (Admin)' })
  @ApiResponse({ status: 200, description: 'Updated parking platform configuration' })
  async updateParkingSettings(
    @CurrentUser() admin: CurrentUserDto,
    @Body() dto: UpdateParkingSettingsDto,
  ) {
    return this.parkingService.updateParkingSettings(dto, admin.userId);
  }

  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Global parking bookings list and financial ledger (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated bookings and financial metrics' })
  async getAdminBookings(@Query() query: QueryParkingBookingsDto) {
    return this.parkingService.getAdminBookings(query);
  }

  @Get('operators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all registered parking operators (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated parking operators list' })
  async findAllOperators(@Query() query: any) {
    return this.parkingService.findAllOperators(query);
  }

  @Patch('operators/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify parking operator and assign role (Admin only)' })
  @ApiParam({ name: 'id', description: 'Parking Operator UUID' })
  @ApiResponse({ status: 200, description: 'Verified parking operator record' })
  async verifyOperator(
    @Param('id') id: string,
    @Body() dto: { notes?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.parkingService.verifyOperator(id, admin.userId, dto?.notes);
  }

  @Patch('operators/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BusinessRole.ADMIN, BusinessRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject parking operator (Admin only)' })
  @ApiParam({ name: 'id', description: 'Parking Operator UUID' })
  @ApiResponse({ status: 200, description: 'Rejected parking operator record' })
  async rejectOperator(
    @Param('id') id: string,
    @Body() dto: { rejectionReason?: string },
    @CurrentUser() admin: CurrentUserDto,
  ) {
    return this.parkingService.rejectOperator(id, admin.userId, dto?.rejectionReason);
  }
}
