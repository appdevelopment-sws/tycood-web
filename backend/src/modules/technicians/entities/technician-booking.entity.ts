import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { TechnicianProfile } from './technician-profile.entity.js';
import { TechnicianCategory } from './technician-category.entity.js';
import { TechnicianServiceCatalogItem } from './technician-service-catalog-item.entity.js';
import { TechnicianProviderService } from './technician-provider-service.entity.js';
import {
  TechnicianBookingType,
  TechnicianBookingStatus,
  QuotationStatus,
  PaymentStatus,
} from '../../../common/enums/index.js';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? parseFloat(value) : 0),
};

@Entity('technician_bookings')
export class TechnicianBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'booking_number', type: 'varchar', length: 50, unique: true })
  bookingNumber: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'technician_profile_id', type: 'uuid', nullable: true })
  technicianProfileId: string | null;

  @Index()
  @Column({
    name: 'booking_type',
    type: 'enum',
    enum: TechnicianBookingType,
    default: TechnicianBookingType.KNOWN_SERVICE,
  })
  bookingType: TechnicianBookingType;

  @Index()
  @Column({
    type: 'enum',
    enum: TechnicianBookingStatus,
    default: TechnicianBookingStatus.REQUESTED,
  })
  status: TechnicianBookingStatus;

  @Index()
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Index()
  @Column({ name: 'service_catalog_item_id', type: 'uuid', nullable: true })
  serviceCatalogItemId: string | null;

  @Index()
  @Column({ name: 'provider_service_id', type: 'uuid', nullable: true })
  providerServiceId: string | null;

  @Column({ name: 'breakdown_location', type: 'text' })
  breakdownLocation: string;

  @Column({
    name: 'breakdown_lat',
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: numericTransformer,
  })
  breakdownLat: number;

  @Column({
    name: 'breakdown_lng',
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: numericTransformer,
  })
  breakdownLng: number;

  @Column({ type: 'text', nullable: true })
  landmark: string | null;

  @Column({ name: 'vehicle_make_model', type: 'varchar', length: 150, nullable: true })
  vehicleMakeModel: string | null;

  @Column({ name: 'vehicle_plate_number', type: 'varchar', length: 50, nullable: true })
  vehiclePlateNumber: string | null;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 50, default: 'Car' })
  vehicleType: string;

  @Column({ name: 'issue_description', type: 'text', nullable: true })
  issueDescription: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  symptoms: string[];

  @Column({ name: 'media_urls', type: 'text', array: true, default: '{}' })
  mediaUrls: string[];

  @Column({
    name: 'quoted_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  quotedAmount: number;

  @Column({ name: 'quotation_notes', type: 'text', nullable: true })
  quotationNotes: string | null;

  @Column({ name: 'quotation_submitted_at', type: 'timestamptz', nullable: true })
  quotationSubmittedAt: Date | null;

  @Column({ name: 'quotation_accepted_at', type: 'timestamptz', nullable: true })
  quotationAcceptedAt: Date | null;

  @Index()
  @Column({
    name: 'quotation_status',
    type: 'enum',
    enum: QuotationStatus,
    default: QuotationStatus.NOT_REQUIRED,
  })
  quotationStatus: QuotationStatus;

  @Column({
    name: 'admin_commission_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 20.0,
    transformer: numericTransformer,
  })
  adminCommissionPercentage: number;

  @Column({
    name: 'advance_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  advanceAmount: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  taxAmount: number;

  @Column({
    name: 'remaining_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  remainingAmount: number;

  @Index()
  @Column({
    name: 'advance_payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  advancePaymentStatus: PaymentStatus;

  @Column({ name: 'advance_payment_method', type: 'varchar', length: 50, default: 'UPI' })
  advancePaymentMethod: string;

  @Column({ name: 'advance_payment_transaction_id', type: 'varchar', length: 150, nullable: true })
  advancePaymentTransactionId: string | null;

  @Index()
  @Column({
    name: 'remaining_payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  remainingPaymentStatus: PaymentStatus;

  @Column({ name: 'start_otp', type: 'varchar', length: 6 })
  startOtp: string;

  @Column({ name: 'completion_otp', type: 'varchar', length: 6 })
  completionOtp: string;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string | null;

  @Column({ name: 'technician_notes', type: 'text', nullable: true })
  technicianNotes: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_by', type: 'varchar', length: 50, nullable: true })
  cancelledBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TechnicianProfile, (tp) => tp.bookings, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'technician_profile_id' })
  technicianProfile: TechnicianProfile | null;

  @ManyToOne(() => TechnicianCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: TechnicianCategory | null;

  @ManyToOne(() => TechnicianServiceCatalogItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_catalog_item_id' })
  serviceCatalogItem: TechnicianServiceCatalogItem | null;

  @ManyToOne(() => TechnicianProviderService, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'provider_service_id' })
  providerService: TechnicianProviderService | null;
}
