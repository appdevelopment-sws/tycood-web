import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalApplication } from './entities/professional-application.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { Vehicle } from '../drivers/entities/vehicle.entity';
import { DriverVehicle } from '../drivers/entities/driver-vehicle.entity';
import { ParkingOperator } from '../parking/entities/parking-operator.entity';
import { ParkingLocation } from '../parking/entities/parking-location.entity';
import { UsersModule } from '../users/users.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfessionalApplication,
      UserRole,
      Role,
      TechnicianProfile,
      DriverProfile,
      Vehicle,
      DriverVehicle,
      ParkingOperator,
      ParkingLocation,
    ]),
    UsersModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
