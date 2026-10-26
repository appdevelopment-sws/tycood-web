import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckType } from './entities/truck-type.entity';
import { Load } from './entities/load.entity';
import { LoadBid } from './entities/load-bid.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TruckType, Load, LoadBid])],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
