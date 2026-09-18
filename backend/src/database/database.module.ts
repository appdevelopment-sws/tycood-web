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
    ]),
  ],
  providers: [InitialSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
