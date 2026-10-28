import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckType } from './entities/truck-type.entity';
import { Load } from './entities/load.entity';
import { LoadBid } from './entities/load-bid.entity';
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TruckType,
      Load,
      LoadBid,
      LogisticsProvider,
      User,
      UserRole,
      Role,
    ]),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
