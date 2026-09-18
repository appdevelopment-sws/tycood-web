import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Vehicle } from '../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Vehicle, DriverProfile]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
