import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity.js';
import { Vehicle } from '../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity.js';
import { ParkingOperator } from '../parking/entities/parking-operator.entity.js';
import { User } from '../users/entities/user.entity.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Vehicle,
      DriverProfile,
      TechnicianProfile,
      ParkingOperator,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
