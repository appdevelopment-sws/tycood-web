import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationStatus } from '../../../common/enums/verification-status.enum';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';
import { DriverVehicle } from './driver-vehicle.entity';

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'license_number', length: 100 })
  licenseNumber: string;

  @Column({ name: 'license_expiry', length: 50, nullable: true })
  licenseExpiry: string;

  @Column({ name: 'license_type', length: 100, default: 'Commercial LMV Transport' })
  licenseType: string;

  @Column({ name: 'dl_front_uploaded', type: 'boolean', default: false })
  dlFrontUploaded: boolean;

  @Column({ name: 'dl_back_uploaded', type: 'boolean', default: false })
  dlBackUploaded: boolean;

  @Column({ type: 'text', array: true, default: '{Hindi, English}' })
  languages: string[];

  @Column({ name: 'aadhaar_verified', type: 'boolean', default: false })
  aadhaarVerified: boolean;

  @Column({ name: 'police_declaration_accepted', type: 'boolean', default: false })
  policeDeclarationAccepted: boolean;

  @Column({ name: 'code_of_conduct_accepted', type: 'boolean', default: false })
  codeOfConductAccepted: boolean;

  @Index()
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Index()
  @Column({
    name: 'availability_status',
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.OFFLINE,
  })
  availabilityStatus: AvailabilityStatus;

  @Index()
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

  @Index()
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.driverProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => DriverVehicle, (dv) => dv.driverProfile)
  driverVehicles: DriverVehicle[];
}
