import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { ParkingModule } from './modules/parking/parking.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { UploadModule } from './modules/upload/upload.module';
import { TaxesModule } from './modules/taxes/taxes.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { LocationModule } from './modules/location/location.module.js';
import { DispatchModule } from './modules/dispatch/dispatch.module.js';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ApplicationsModule,
    TechniciansModule,
    DriversModule,
    ParkingModule,
    BookingsModule,
    UploadModule,
    TaxesModule,
    SettingsModule,
    LocationModule,
    DispatchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
