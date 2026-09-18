import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { Vehicle } from './entities/vehicle.entity';
import { DriverVehicle } from './entities/driver-vehicle.entity';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DriverProfile, Vehicle, DriverVehicle])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService, TypeOrmModule],
})
export class DriversModule {}
