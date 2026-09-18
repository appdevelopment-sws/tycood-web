import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingOperator } from './entities/parking-operator.entity';
import { ParkingLocation } from './entities/parking-location.entity';
import { ParkingService } from './parking.service';
import { ParkingController } from './parking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingOperator, ParkingLocation])],
  controllers: [ParkingController],
  providers: [ParkingService],
  exports: [ParkingService, TypeOrmModule],
})
export class ParkingModule {}
