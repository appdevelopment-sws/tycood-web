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
import { ParkingLocation } from './parking-location.entity';

@Entity('parking_operators')
export class ParkingOperator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({
    name: 'business_type',
    type: 'varchar',
    length: 100,
    default: 'Commercial Operator',
  })
  businessType: string;

  @Column({ name: 'facility_name', type: 'varchar', length: 255, nullable: true })
  facilityName: string | null;

  @Column({ name: 'owner_name', type: 'varchar', length: 255 })
  ownerName: string;

  @Column({ name: 'business_phone', type: 'varchar', length: 50 })
  businessPhone: string;

  @Column({ name: 'business_email', type: 'varchar', length: 255, nullable: true })
  businessEmail: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gstin: string | null;

  @Column({ name: 'ownership_proof_uploaded', type: 'boolean', default: false })
  ownershipProofUploaded: boolean;

  @Column({ name: 'trade_license_uploaded', type: 'boolean', default: false })
  tradeLicenseUploaded: boolean;

  @Column({ name: 'facility_photos_uploaded', type: 'boolean', default: false })
  facilityPhotosUploaded: boolean;

  @Column({ name: 'account_holder', type: 'varchar', length: 255, nullable: true })
  accountHolder: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 100, nullable: true })
  accountNumber: string | null;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 32, nullable: true })
  ifscCode: string | null;

  @Index()
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.parkingOperator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ParkingLocation, (loc) => loc.operator)
  locations: ParkingLocation[];
}
