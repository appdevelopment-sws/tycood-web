import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.entity';
import { ProfessionalApplication } from '../../applications/entities/professional-application.entity';
import { TechnicianProfile } from '../../technicians/entities/technician-profile.entity';
import { DriverProfile } from '../../drivers/entities/driver-profile.entity';
import { ParkingOperator } from '../../parking/entities/parking-operator.entity';
import { Vehicle } from '../../drivers/entities/vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { LogisticsProvider } from '../../logistics/entities/logistics-provider.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 255, unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ length: 50, unique: true, nullable: true })
  phone: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash: string;

  @Column({ name: 'profile_image', length: 500, nullable: true })
  profileImage: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'emergency_contact', length: 50, nullable: true })
  emergencyContact: string;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ name: 'blood_group', length: 20, nullable: true })
  bloodGroup: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({
    name: 'wallet_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  walletBalance: number;

  @Column({
    name: 'current_lat',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  currentLat: number | null;

  @Column({
    name: 'current_lng',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  currentLng: number | null;

  @Column({ name: 'current_address', type: 'text', nullable: true })
  currentAddress: string | null;

  @Column({ name: 'last_location_updated_at', type: 'timestamptz', nullable: true })
  lastLocationUpdatedAt: Date | null;

  @Column({
    name: 'passenger_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 5.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 5.0,
    },
  })
  passengerRating: number;

  @Column({ name: 'passenger_reviews_count', type: 'int', default: 0 })
  passengerReviewsCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
  userRoles: UserRole[];

  @OneToMany(() => ProfessionalApplication, (app) => app.user, { cascade: true })
  applications: ProfessionalApplication[];

  @OneToOne(() => TechnicianProfile, (tech) => tech.user)
  technicianProfile: TechnicianProfile;

  @OneToOne(() => DriverProfile, (driver) => driver.user)
  driverProfile: DriverProfile;

  @OneToOne(() => ParkingOperator, (operator) => operator.user)
  parkingOperator: ParkingOperator;

  @OneToOne(() => LogisticsProvider, (provider) => provider.user)
  logisticsProvider: LogisticsProvider;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  ownedVehicles: Vehicle[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.reviewer)
  givenReviews: Review[];

  @OneToMany(() => Review, (review) => review.targetUser)
  receivedReviews: Review[];
}
