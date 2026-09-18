import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { InitialSeedService } from './seeds/initial-seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    TypeOrmModule.forFeature([Role, User, UserRole]),
  ],
  providers: [InitialSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
