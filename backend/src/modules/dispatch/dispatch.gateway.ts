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
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string;
      role?: string;
      serviceCategory?: string;
      lat?: number;
      lng?: number;
      address?: string;
    },
  ) {
    if (!data?.userId) {
      return { success: false, message: 'userId is required for registration' };
    }

    const category = (data.serviceCategory || 'CAB').toUpperCase();
    const role = (data.role || 'DRIVER').toUpperCase();

    // Join user-specific private room
    client.join(`user_${data.userId}`);

    // Join category dispatch room
    client.join(`service_${category}`);

    // Join role room
    if (role === 'DRIVER') {
      client.join('drivers');
    } else if (role === 'TECHNICIAN') {
      client.join('technicians');
    }

    this.dispatchService.registerClient(client.id, {
      ...data,
      serviceCategory: category,
      role,
    });

    return {
      success: true,
      socketId: client.id,
      rooms: [`user_${data.userId}`, `service_${category}`],
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
  handleToggleOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isOnline: boolean },
  ) {
    this.dispatchService.setProviderOnlineStatus(client.id, data.isOnline);
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
      baseFare: Number(booking.baseFare),
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      otp: booking.otp,
      expiresInSeconds: 45,
      createdAt: booking.createdAt,
    };

    // 1. Find candidate sockets within 20km radius
    const targetSocketIds =
      await this.dispatchService.findEligibleProvidersWithinRadius(
        categoryUpper,
        pickupLat ?? (booking.pickupLat ? Number(booking.pickupLat) : null),
        pickupLng ?? (booking.pickupLng ? Number(booking.pickupLng) : null),
        20, // 20 km operating radius
      );

    if (targetSocketIds.length > 0) {
      this.logger.log(
        `Dispatching booking ${booking.bookingNumber} to ${targetSocketIds.length} candidate sockets within 20km`,
      );
      for (const socketId of targetSocketIds) {
        this.server.to(socketId).emit('new_booking_request', payload);
      }
    } else {
      // If no sockets matched within exact radius, broadcast to general category room
      this.logger.log(
        `Broadcasting booking ${booking.bookingNumber} to room service_${categoryUpper}`,
      );
      this.server
        .to(`service_${categoryUpper}`)
        .emit('new_booking_request', payload);
    }
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
  ) {
    const categoryUpper = serviceType.toUpperCase();

    // 1. Tell all other drivers/technicians that this booking is taken -> IMMEDIATELY CLOSE POPUP
    this.server.to(`service_${categoryUpper}`).emit('booking_taken', {
      bookingId,
      status: 'TAKEN',
      takenBy: acceptedDriver.driverName,
      message: 'This ride has already been accepted by another driver.',
    });

    // 2. Also notify the general drivers room if applicable
    if (categoryUpper === 'CAB') {
      this.server.to('drivers').emit('booking_taken', {
        bookingId,
        status: 'TAKEN',
        takenBy: acceptedDriver.driverName,
      });
    }

    // 3. Notify the passenger in their private user room
    if (passengerUserId) {
      this.server.to(`user_${passengerUserId}`).emit('booking_assigned', {
        bookingId,
        status: 'ACCEPTED',
        driver: acceptedDriver,
      });
    }

    this.logger.log(
      `Broadcasted booking_taken for booking ${bookingId} (accepted by ${acceptedDriver.driverName})`,
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
}
