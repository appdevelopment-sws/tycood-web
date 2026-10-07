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
import { Vehicle } from '../../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../../drivers/entities/driver-profile.entity.js';
import {
  BookingServiceType,
  BookingStatus,
  BookingTripType,
  PaymentStatus,
} from '../../../common/enums/index.js';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? parseFloat(value) : 0),
};

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'booking_number', type: 'varchar', length: 50, unique: true })
  bookingNumber: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({
    name: 'service_type',
    type: 'enum',
    enum: BookingServiceType,
    default: BookingServiceType.CAB,
  })
  serviceType: BookingServiceType;

  @Index()
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    name: 'trip_type',
    type: 'enum',
    enum: BookingTripType,
    default: BookingTripType.ONE_WAY,
  })
  tripType: BookingTripType;

  @Column({ name: 'pickup_location', type: 'text' })
  pickupLocation: string;

  @Column({
    name: 'pickup_lat',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: numericTransformer,
  })
  pickupLat: number | null;

  @Column({
    name: 'pickup_lng',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: numericTransformer,
  })
  pickupLng: number | null;

  @Column({ name: 'drop_location', type: 'text', nullable: true })
  dropLocation: string;

  @Column({
    name: 'drop_lat',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: numericTransformer,
  })
  dropLat: number | null;

  @Column({
    name: 'drop_lng',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: numericTransformer,
  })
  dropLng: number | null;

  @Column({ name: 'intermediate_stop', type: 'text', nullable: true })
  intermediateStop: string | null;

  @Index()
  @Column({ name: 'scheduled_date_time', type: 'timestamptz' })
  scheduledDateTime: Date;

  @Column({ name: 'return_date_time', type: 'timestamptz', nullable: true })
  returnDateTime: Date | null;

  @Column({
    name: 'base_fare',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  baseFare: number;

  @Column({
    name: 'platform_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 49.0,
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

  @Column({
    name: 'admin_commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 20.0,
    transformer: numericTransformer,
  })
  adminCommissionRate: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, default: 'UPI' })
  paymentMethod: string;

  @Index()
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'passenger_name', type: 'varchar', length: 150 })
  passengerName: string;

  @Column({ name: 'passenger_phone', type: 'varchar', length: 50 })
  passengerPhone: string;

  @Column({ name: 'pickup_notes', type: 'text', nullable: true })
  pickupNotes: string | null;

  @Column({ type: 'varchar', length: 10 })
  otp: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Index()
  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @Index()
  @Column({ name: 'driver_profile_id', type: 'uuid', nullable: true })
  driverProfileId: string | null;

  // Snapshot details of the booked ride for quick retrieval
  @Column({ name: 'cab_name', type: 'varchar', length: 100, nullable: true })
  cabName: string | null;

  @Column({ name: 'cab_category', type: 'varchar', length: 50, nullable: true })
  cabCategory: string | null;

  @Column({ name: 'cab_plate_number', type: 'varchar', length: 50, nullable: true })
  cabPlateNumber: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 150, nullable: true })
  driverName: string | null;

  @Column({ name: 'driver_phone', type: 'varchar', length: 50, nullable: true })
  driverPhone: string | null;

  @Column({
    name: 'driver_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 4.9,
    transformer: numericTransformer,
  })
  driverRating: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Entity Relationships
  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle | null;

  @ManyToOne(() => DriverProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driver_profile_id' })
  driverProfile: DriverProfile | null;
}
