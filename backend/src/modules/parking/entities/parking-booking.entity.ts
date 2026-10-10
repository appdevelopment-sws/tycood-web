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
import { User } from '../../users/entities/user.entity';
import { ParkingLocation } from './parking-location.entity';
import {
  ParkingBookingStatus,
  ParkingPaymentStatus,
  ParkingRefundStatus,
  ParkingVehicleType,
} from '../../../common/enums/parking-status.enum';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => (value ? parseFloat(String(value)) : 0),
};

@Entity('parking_bookings')
export class ParkingBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'booking_number', type: 'varchar', length: 50, unique: true })
  bookingNumber: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: ParkingVehicleType,
    default: ParkingVehicleType.CAR,
  })
  vehicleType: ParkingVehicleType;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 50 })
  vehicleNumber: string;

  @Index()
  @Column({ name: 'check_in_time', type: 'timestamptz' })
  checkInTime: Date;

  @Column({ name: 'check_out_time', type: 'timestamptz' })
  checkOutTime: Date;

  @Column({ name: 'duration_hours', type: 'int', default: 2 })
  durationHours: number;

  @Column({ name: 'actual_check_in_time', type: 'timestamptz', nullable: true })
  actualCheckInTime: Date | null;

  @Column({ name: 'actual_check_out_time', type: 'timestamptz', nullable: true })
  actualCheckOutTime: Date | null;

  @Column({ name: 'allocated_floor', type: 'varchar', length: 50, nullable: true })
  allocatedFloor: string | null;

  @Column({ name: 'allocated_bay', type: 'varchar', length: 50, nullable: true })
  allocatedBay: string | null;

  // Rate snapshot
  @Column({
    name: 'hourly_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  hourlyRate: number;

  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  basePrice: number;

  @Column({
    name: 'addons_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  addonsPrice: number;

  @Column({
    name: 'extra_hours_charge',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  extraHoursCharge: number;

  @Column({
    name: 'platform_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 15.0,
    transformer: numericTransformer,
  })
  platformFee: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  discountAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  totalAmount: number;

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
    name: 'remaining_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  remainingAmount: number;

  @Column({ name: 'advance_paid_at', type: 'timestamptz', nullable: true })
  advancePaidAt: Date | null;

  @Column({ name: 'remaining_paid_at', type: 'timestamptz', nullable: true })
  remainingPaidAt: Date | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, default: 'UPI' })
  paymentMethod: string;

  @Column({ name: 'transaction_id', type: 'varchar', length: 100, nullable: true })
  transactionId: string | null;

  // Commission & settlement snapshot
  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 15.0,
    transformer: numericTransformer,
  })
  commissionRate: number;

  @Column({
    name: 'commission_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  commissionAmount: number;

  @Column({
    name: 'provider_earnings',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  providerEarnings: number;

  // Statuses
  @Index()
  @Column({
    type: 'enum',
    enum: ParkingBookingStatus,
    default: ParkingBookingStatus.PENDING_PAYMENT,
  })
  status: ParkingBookingStatus;

  @Index()
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ParkingPaymentStatus,
    default: ParkingPaymentStatus.PENDING,
  })
  paymentStatus: ParkingPaymentStatus;

  @Column({
    name: 'refund_status',
    type: 'enum',
    enum: ParkingRefundStatus,
    default: ParkingRefundStatus.NOT_REQUIRED,
  })
  refundStatus: ParkingRefundStatus;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: numericTransformer,
  })
  refundAmount: number;

  // Access pass
  @Column({ name: 'gate_pin_otp', type: 'varchar', length: 10 })
  gatePinOtp: string;

  @Column({ name: 'qr_code_payload', type: 'text' })
  qrCodePayload: string;

  // Temporary hold expiration
  @Column({ name: 'hold_expires_at', type: 'timestamptz', nullable: true })
  holdExpiresAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'is_walk_in', type: 'boolean', default: false })
  isWalkIn: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ParkingLocation, (loc) => loc.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location: ParkingLocation;
}
