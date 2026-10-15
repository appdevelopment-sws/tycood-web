import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { Vehicle } from '../modules/drivers/entities/vehicle.entity';
import { DriverProfile } from '../modules/drivers/entities/driver-profile.entity';
import { DriverVehicle } from '../modules/drivers/entities/driver-vehicle.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { Tax } from '../modules/taxes/entities/tax.entity.js';
import { SystemSetting } from '../modules/settings/entities/system-setting.entity.js';
import { ParkingOperator } from '../modules/parking/entities/parking-operator.entity';
import { ParkingLocation } from '../modules/parking/entities/parking-location.entity';
import { ParkingBooking } from '../modules/parking/entities/parking-booking.entity';
import { Review } from '../modules/reviews/entities/review.entity.js';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { TechnicianProfile } from '../modules/technicians/entities/technician-profile.entity.js';
import { TechnicianCategory } from '../modules/technicians/entities/technician-category.entity.js';
import { TechnicianServiceCatalogItem } from '../modules/technicians/entities/technician-service-catalog-item.entity.js';
import { TechnicianProviderService } from '../modules/technicians/entities/technician-provider-service.entity.js';
import { TechnicianBooking } from '../modules/technicians/entities/technician-booking.entity.js';
import { InitialSeedService } from './seeds/initial-seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    TypeOrmModule.forFeature([
      Role,
      User,
      UserRole,
      Vehicle,
      DriverProfile,
      DriverVehicle,
      Booking,
      Tax,
      SystemSetting,
      ParkingOperator,
      ParkingLocation,
      ParkingBooking,
      Review,
      Transaction,
      TechnicianProfile,
      TechnicianCategory,
      TechnicianServiceCatalogItem,
      TechnicianProviderService,
      TechnicianBooking,
    ]),
  ],
  providers: [InitialSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
