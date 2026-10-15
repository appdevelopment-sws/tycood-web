import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/users/entities/role.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { ProfessionalApplication } from '../modules/applications/entities/professional-application.entity';
import { TechnicianProfile } from '../modules/technicians/entities/technician-profile.entity';
import { DriverProfile } from '../modules/drivers/entities/driver-profile.entity';
import { Vehicle } from '../modules/drivers/entities/vehicle.entity';
import { DriverVehicle } from '../modules/drivers/entities/driver-vehicle.entity';
import { ParkingOperator } from '../modules/parking/entities/parking-operator.entity';
import { ParkingLocation } from '../modules/parking/entities/parking-location.entity';
import { ParkingBooking } from '../modules/parking/entities/parking-booking.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { Tax } from '../modules/taxes/entities/tax.entity.js';
import { SystemSetting } from '../modules/settings/entities/system-setting.entity.js';
import { Review } from '../modules/reviews/entities/review.entity.js';
import { Transaction } from '../modules/transactions/entities/transaction.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'cab_booking_db',
  entities: [
    User,
    Role,
    UserRole,
    ProfessionalApplication,
    TechnicianProfile,
    DriverProfile,
    Vehicle,
    DriverVehicle,
    ParkingOperator,
    ParkingLocation,
    ParkingBooking,
    Booking,
    Tax,
    SystemSetting,
    Review,
    Transaction,
  ],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging:
    process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
});
