import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationStatus } from '../../../common/enums/verification-status.enum';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';

@Entity('technician_profiles')
export class TechnicianProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'workshop_name', length: 255, nullable: true })
  workshopName: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specializations: string[];

  @Column({ name: 'experience_years', length: 50, default: '3-5 years' })
  experienceYears: string;

  @Column({ name: 'trade_qualification', length: 255, nullable: true })
  tradeQualification: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'tools_available', type: 'text', array: true, default: '{}' })
  toolsAvailable: string[];

  @Column({ name: 'vehicle_type', length: 100, default: 'Bike with Tool Mounts' })
  vehicleType: string;

  @Column({ name: 'base_area', length: 255, default: 'Patna Central' })
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

  @Column({ name: 'operating_shift', length: 100, default: '24x7 Emergency & Daytime' })
  operatingShift: string;

  @Column({ name: 'id_proof_uploaded', type: 'boolean', default: false })
  idProofUploaded: boolean;

  @Column({ name: 'certificate_uploaded', type: 'boolean', default: false })
  certificateUploaded: boolean;

  @Column({ name: 'police_clearance_accepted', type: 'boolean', default: false })
  policeClearanceAccepted: boolean;

  @Column({ name: 'account_holder', length: 255, nullable: true })
  accountHolder: string;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName: string;

  @Column({ name: 'account_number', length: 100, nullable: true })
  accountNumber: string;

  @Column({ name: 'ifsc_code', length: 32, nullable: true })
  ifscCode: string;

  @Column({ name: 'upi_id', length: 100, nullable: true })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.technicianProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
