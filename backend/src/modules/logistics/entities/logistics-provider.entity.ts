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

@Entity('logistics_providers')
export class LogisticsProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 255 })
  contactPerson: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'operating_city', type: 'varchar', length: 100, default: 'Patna' })
  operatingCity: string;

  @Column({ name: 'operating_hub', type: 'varchar', length: 255, default: 'Transport Nagar' })
  operatingHub: string;

  @Column({
    name: 'business_type',
    type: 'varchar',
    length: 100,
    default: 'Transporter / Fleet Broker',
  })
  businessType: string;

  @Column({ name: 'primary_cargo_types', type: 'text', array: true, default: '{}' })
  primaryCargoTypes: string[];

  @Column({ name: 'required_vehicle_categories', type: 'text', array: true, default: '{}' })
  requiredVehicleCategories: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pan: string | null;

  @Column({ name: 'is_gst_verified', type: 'boolean', default: false })
  isGstVerified: boolean;

  @Column({ name: 'is_aadhaar_verified', type: 'boolean', default: false })
  isAadhaarVerified: boolean;

  @Column({ name: 'id_proof_uploaded', type: 'boolean', default: false })
  idProofUploaded: boolean;

  @Column({ name: 'business_proof_uploaded', type: 'boolean', default: false })
  businessProofUploaded: boolean;

  @Column({ name: 'account_holder', type: 'varchar', length: 255, nullable: true })
  accountHolder: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 100, nullable: true })
  accountNumber: string | null;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 50, nullable: true })
  ifscCode: string | null;

  @Column({ name: 'upi_id', type: 'varchar', length: 100, nullable: true })
  upiId: string | null;

  @Index()
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.logisticsProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
