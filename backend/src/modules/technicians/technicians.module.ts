import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TechnicianProfile])],
  controllers: [TechniciansController],
  providers: [TechniciansService],
  exports: [TechniciansService, TypeOrmModule],
})
export class TechniciansModule {}
