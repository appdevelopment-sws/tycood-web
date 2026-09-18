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

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  ownedVehicles: Vehicle[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}
