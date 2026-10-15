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
import { User } from '../../users/entities/user.entity.js';
import { VerificationStatus } from '../../../common/enums/verification-status.enum.js';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum.js';
import { TechnicianProviderService } from './technician-provider-service.entity.js';
import { TechnicianBooking } from './technician-booking.entity.js';

@Entity('technician_profiles')
export class TechnicianProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'workshop_name', type: 'varchar', length: 255, nullable: true })
  workshopName: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specializations: string[];

  @Column({ name: 'experience_years', type: 'varchar', length: 50, default: '3-5 years' })
  experienceYears: string;

  @Column({ name: 'trade_qualification', type: 'varchar', length: 255, nullable: true })
  tradeQualification: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'tools_available', type: 'text', array: true, default: '{}' })
  toolsAvailable: string[];

  @Column({ name: 'vehicle_type', type: 'varchar', length: 100, default: 'Bike with Tool Mounts' })
  vehicleType: string;

  @Column({ name: 'base_area', type: 'varchar', length: 255, default: 'Patna Central' })
  baseArea: string;

  @Column({
    name: 'service_radius_km',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 15.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 15.0,
    },
  })
  serviceRadiusKm: number;

  @Column({ name: 'operating_shift', type: 'varchar', length: 100, default: '24x7 Emergency & Daytime' })
  operatingShift: string;

  @Column({ name: 'id_proof_uploaded', type: 'boolean', default: false })
  idProofUploaded: boolean;

  @Column({ name: 'certificate_uploaded', type: 'boolean', default: false })
  certificateUploaded: boolean;

  @Column({ name: 'police_clearance_accepted', type: 'boolean', default: false })
  policeClearanceAccepted: boolean;

  @Column({ name: 'account_holder', type: 'varchar', length: 255, nullable: true })
  accountHolder: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 100, nullable: true })
  accountNumber: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 32, nullable: true })
  ifscCode: string;

  @Column({ name: 'upi_id', type: 'varchar', length: 100, nullable: true })
  upiId: string;

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

  @OneToOne(() => User, (user) => user.technicianProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    () => TechnicianProviderService,
    (providerService) => providerService.technicianProfile,
  )
  providerServices: TechnicianProviderService[];

  @OneToMany(() => TechnicianBooking, (booking) => booking.technicianProfile)
  bookings: TechnicianBooking[];
}
