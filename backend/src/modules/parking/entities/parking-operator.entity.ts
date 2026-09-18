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
    length: 100,
    default: 'Commercial Operator',
  })
  businessType: string;

  @Column({ name: 'facility_name', length: 255, nullable: true })
  facilityName: string;

  @Column({ name: 'owner_name', length: 255 })
  ownerName: string;

  @Column({ name: 'business_phone', length: 50 })
  businessPhone: string;

  @Column({ name: 'business_email', length: 255, nullable: true })
  businessEmail: string;

  @Column({ length: 50, nullable: true })
  gstin: string;

  @Column({ name: 'ownership_proof_uploaded', type: 'boolean', default: false })
  ownershipProofUploaded: boolean;

  @Column({ name: 'trade_license_uploaded', type: 'boolean', default: false })
  tradeLicenseUploaded: boolean;

  @Column({ name: 'facility_photos_uploaded', type: 'boolean', default: false })
  facilityPhotosUploaded: boolean;

  @Column({ name: 'account_holder', length: 255, nullable: true })
  accountHolder: string;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName: string;

  @Column({ name: 'account_number', length: 100, nullable: true })
  accountNumber: string;

  @Column({ name: 'ifsc_code', length: 32, nullable: true })
  ifscCode: string;

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
