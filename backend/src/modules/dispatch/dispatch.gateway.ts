import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DispatchService } from './dispatch.service.js';
import { Booking } from '../bookings/entities/booking.entity.js';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class DispatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DispatchGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly dispatchService: DispatchService) {}

  afterInit(server: Server) {
    this.logger.log('Dispatch Real-Time WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.dispatchService.unregisterClient(client.id);
  }

  /**
   * Client registers their identity, role, and operational category (CAB, TECHNICIAN, PARKING)
   */
  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string;
      role?: string;
      serviceCategory?: string;
      lat?: number;
      lng?: number;
      address?: string;
      isOnline?: boolean;
    },
  ) {
    if (!data?.userId) {
      return { success: false, message: 'userId is required for registration' };
    }

    const category = (data.serviceCategory || 'CAB').toUpperCase();
    const role = (data.role || 'DRIVER').toUpperCase();

    // Join user-specific private room
    client.join(`user_${data.userId}`);

    const registered = await this.dispatchService.registerClient(client.id, {
      ...data,
      serviceCategory: category,
      role,
    });

    // ONLY join category room and role dispatch room if provider is ACTUALLY ONLINE
    if (registered.isOnline) {
      client.join(`service_${category}`);
      if (role === 'DRIVER') {
        client.join('drivers');
      } else if (role === 'TECHNICIAN') {
        client.join('technicians');
      }
    }

    return {
      success: true,
      socketId: client.id,
      isOnline: registered.isOnline,
      rooms: [
        `user_${data.userId}`,
        ...(registered.isOnline ? [`service_${category}`] : []),
      ],
    };
  }

  /**
   * Live GPS update sent from device
   */
  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string;
      lat: number;
      lng: number;
      address?: string;
    },
  ) {
    if (!data?.userId || data?.lat === undefined || data?.lng === undefined) {
      return { success: false, message: 'Invalid coordinates' };
    }

    await this.dispatchService.updateLocation(
      client.id,
      data.userId,
      data.lat,
      data.lng,
      data.address,
    );

    return { success: true };
  }

  /**
   * Duty switch toggle (Online / Offline)
   */
  @SubscribeMessage('toggle_online')
  async handleToggleOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isOnline: boolean },
  ) {
    const updated = await this.dispatchService.setProviderOnlineStatus(client.id, data.isOnline);
    const category = (updated?.serviceCategory || 'CAB').toUpperCase();
    const role = (updated?.role || 'DRIVER').toUpperCase();

    if (data.isOnline) {
      client.join(`service_${category}`);
      if (role === 'DRIVER') client.join('drivers');
      if (role === 'TECHNICIAN') client.join('technicians');
    } else {
      client.leave(`service_${category}`);
      if (role === 'DRIVER') client.leave('drivers');
      if (role === 'TECHNICIAN') client.leave('technicians');
    }

    return { success: true, isOnline: data.isOnline };
  }

  /**
   * Broadcast a new booking request to eligible drivers/technicians within 20km radius
   */
  async broadcastNewBookingRequest(
    booking: Booking,
    pickupLat?: number | null,
    pickupLng?: number | null,
  ) {
    const serviceType = booking.serviceType || 'CAB';
    const categoryUpper = serviceType.toString().toUpperCase();

    const payload = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceType: booking.serviceType,
      cabCategory: booking.cabCategory || 'Sedan',
      cabName: booking.cabName || 'Sedan',
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation || '',
      pickupLat: pickupLat ?? (booking.pickupLat ? Number(booking.pickupLat) : null),
      pickupLng: pickupLng ?? (booking.pickupLng ? Number(booking.pickupLng) : null),
      dropLat: booking.dropLat ? Number(booking.dropLat) : null,
      dropLng: booking.dropLng ? Number(booking.dropLng) : null,
      scheduledDateTime: booking.scheduledDateTime,
      tripType: booking.tripType,
      distanceKm:
        booking.metadata?.fareBreakdown?.totalBillableKm ||
        booking.metadata?.distanceKm ||
        12.0,
      fare: Number(booking.totalAmount),
      totalAmount: Number(booking.totalAmount),
      baseFare: Number(booking.baseFare),
      platformFee: Number(booking.platformFee ?? 49),
      taxAmount: Number(booking.metadata?.fareBreakdown?.taxAmount ?? 0),
      advanceAmount: Number(booking.advanceAmount ?? 0),
      remainingAmount: Number(booking.remainingAmount ?? 0),
      adminCommissionRate: Number(booking.adminCommissionRate ?? 20),
      discountAmount: Number(booking.discountAmount ?? 0),
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      otp: booking.otp,
      expiresInSeconds: 45,
      createdAt: booking.createdAt,
    };

    // 1. Find candidate sockets within 20km radius (strictly online)
    const targetSocketIds =
      await this.dispatchService.findEligibleProvidersWithinRadius(
        categoryUpper,
        pickupLat ?? (booking.pickupLat ? Number(booking.pickupLat) : null),
        pickupLng ?? (booking.pickupLng ? Number(booking.pickupLng) : null),
        20, // 20 km operating radius
      );

    if (targetSocketIds.length > 0) {
      this.logger.log(
        `Dispatching booking ${booking.bookingNumber} to ${targetSocketIds.length} candidate online sockets within 20km`,
      );
      for (const socketId of targetSocketIds) {
        this.server.to(socketId).emit('new_booking_request', payload);
      }
    } else {
      // NEVER broadcast to offline clients or open broadcast rooms
      this.logger.warn(
        `No online ${categoryUpper} providers available within 20km radius for booking ${booking.bookingNumber}. Offline providers will not be notified.`,
      );
    }
  }

  /**
   * Client joins a specific booking room to receive updates (e.g., passenger waiting for assignment)
   */
  @SubscribeMessage('join_booking')
  handleJoinBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    if (data?.bookingId) {
      const cleanId = data.bookingId.trim();
      const room = `booking_${cleanId}`;
      client.join(room);
      if (cleanId.startsWith('#')) {
        client.join(`booking_${cleanId.replace(/^#/, '')}`);
      } else {
        client.join(`booking_#${cleanId}`);
      }
      this.logger.log(`Socket ${client.id} joined rooms for booking ${cleanId}`);
      return { success: true, room };
    }
    return { success: false, message: 'bookingId is required' };
  }

  /**
   * Broadcast that a booking was accepted.
   * - Emits 'booking_taken' to other drivers to IMMEDIATELY remove their popup.
   * - Emits 'booking_assigned' to the passenger.
   */
  broadcastBookingAccepted(
    bookingId: string,
    acceptedDriver: {
      driverId: string;
      driverName: string;
      driverPhone?: string;
      cabPlateNumber?: string;
      cabName?: string;
      driverRating?: number;
    },
    serviceType = 'CAB',
    passengerUserId?: string,
    bookingNumber?: string,
  ) {
    const categoryUpper = serviceType.toUpperCase();

    // 1. Tell all other drivers/technicians that this booking is taken -> IMMEDIATELY CLOSE POPUP
    this.server.to(`service_${categoryUpper}`).emit('booking_taken', {
      bookingId,
      bookingNumber,
      status: 'TAKEN',
      takenBy: acceptedDriver.driverName,
      message: 'This ride has already been accepted by another driver.',
    });

    // 2. Also notify the general drivers room if applicable
    if (categoryUpper === 'CAB') {
      this.server.to('drivers').emit('booking_taken', {
        bookingId,
        bookingNumber,
        status: 'TAKEN',
        takenBy: acceptedDriver.driverName,
      });
    }

    // 3. Prepare full payload with both nested driver object and flattened fields
    const payload = {
      bookingId,
      bookingNumber: bookingNumber || '',
      status: 'ACCEPTED',
      driver: acceptedDriver,
      driverId: acceptedDriver.driverId,
      driverName: acceptedDriver.driverName,
      driverPhone: acceptedDriver.driverPhone || '',
      cabPlateNumber: acceptedDriver.cabPlateNumber || '',
      cabName: acceptedDriver.cabName || 'Cab',
      driverRating: acceptedDriver.driverRating ?? 4.9,
    };

    // Emit to specific booking room (passenger joined on assignment card)
    this.server.to(`booking_${bookingId}`).emit('booking_assigned', payload);
    if (bookingNumber) {
      const cleanNum = bookingNumber.trim();
      this.server.to(`booking_${cleanNum}`).emit('booking_assigned', payload);
      this.server.to(`booking_${cleanNum.replace(/^#/, '')}`).emit('booking_assigned', payload);
    }

    // Emit to user room (passenger private room)
    if (passengerUserId) {
      this.server.to(`user_${passengerUserId}`).emit('booking_assigned', payload);
    }

    // Also emit globally to ensure any active subscriber receives it
    this.server.emit('booking_assigned', payload);

    this.logger.log(
      `Broadcasted booking_assigned & booking_taken for booking ${bookingId} / ${bookingNumber} (accepted by ${acceptedDriver.driverName})`,
    );
  }

  /**
   * Broadcast cancellation
   */
  broadcastBookingCancelled(bookingId: string, serviceType = 'CAB') {
    const categoryUpper = serviceType.toUpperCase();
    this.server.to(`service_${categoryUpper}`).emit('booking_cancelled', {
      bookingId,
      status: 'CANCELLED',
    });
  }

  /**
   * Broadcast booking status update (e.g. ARRIVED, ACTIVE, COMPLETED)
   */
  broadcastBookingStatusUpdated(
    bookingId: string,
    status: string,
    bookingNumber?: string,
    extra?: Record<string, any>,
  ) {
    const payload = {
      bookingId,
      bookingNumber: bookingNumber || '',
      status,
      ...extra,
    };
    this.server.to(`booking_${bookingId}`).emit('booking_status_updated', payload);
    if (bookingNumber) {
      const cleanNum = bookingNumber.trim();
      this.server.to(`booking_${cleanNum}`).emit('booking_status_updated', payload);
      this.server
        .to(`booking_${cleanNum.replace(/^#/, '')}`)
        .emit('booking_status_updated', payload);
    }
    this.server.emit('booking_status_updated', payload);
  }
}
