import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchGateway } from './dispatch.gateway.js';
import { DispatchService } from './dispatch.service.js';
import { User } from '../users/entities/user.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity.js';
import { Booking } from '../bookings/entities/booking.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DriverProfile,
      TechnicianProfile,
      Booking,
    ]),
  ],
  providers: [DispatchGateway, DispatchService],
  exports: [DispatchGateway, DispatchService],
})
export class DispatchModule {}
