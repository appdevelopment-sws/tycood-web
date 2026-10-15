import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ParkingBooking } from '../parking/entities/parking-booking.entity';
import { ParkingLocation } from '../parking/entities/parking-location.entity';
import { ParkingOperator } from '../parking/entities/parking-operator.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      User,
      ParkingBooking,
      ParkingLocation,
      ParkingOperator,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService, TypeOrmModule],
})
export class TransactionsModule {}
