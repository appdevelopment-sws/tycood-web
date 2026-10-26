import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { LoadStatus, PaymentTerms } from '../enums/logistics.enums';
import { TruckType } from './truck-type.entity';
import { LoadBid } from './load-bid.entity';

const numericTransformer = {
  to: (value?: number | null) => (value !== undefined && value !== null ? value : null),
  from: (value?: string | null) => (value ? parseFloat(value) : null),
};

@Entity('loads')
export class Load {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'load_number', length: 50, unique: true })
  loadNumber: string;

  // Origin / Pickup Information
  @Index()
  @Column({ name: 'pickup_city', length: 100 })
  pickupCity: string;

  @Column({ name: 'pickup_state', length: 100, default: 'Bihar' })
  pickupState: string;

  @Column({ name: 'pickup_address', length: 255, nullable: true })
  pickupAddress: string;

  // Destination / Unloading Point Information
  @Index()
  @Column({ name: 'unloading_city', length: 100 })
  unloadingCity: string;

  @Column({ name: 'unloading_state', length: 100, default: 'Bihar' })
  unloadingState: string;

  @Column({ name: 'unloading_address', length: 255, nullable: true })
  unloadingAddress: string;

  @Column({
    name: 'address_note',
    length: 255,
    default: 'Address will be shared on call',
  })
  addressNote: string;

  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 160.0,
    transformer: numericTransformer,
  })
  distanceKm: number;

  // Cargo / Material Specs
  @Index()
  @Column({ length: 150 })
  product: string; // e.g. "Ata chokar", "TMT Iron Rods 40ft", "Industrial Steel Pipes"

  @Column({ name: 'product_category', length: 100, default: 'General Cargo' })
  productCategory: string;

  // Product Length (ft) - e.g., 40 ft for long steel rods/pipes
  @Column({
    name: 'product_length_ft',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  productLengthFt: number;

  @Column({ name: 'total_load_tons', length: 80, default: '29-30 ton' })
  totalLoadTons: string;

  @Column({
    name: 'total_load_number',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 30.0,
    transformer: numericTransformer,
  })
  totalLoadNumber: number;

  // Required Truck Specifications
  @Index()
  @Column({ name: 'truck_type_id', type: 'uuid', nullable: true })
  truckTypeId: string;

  @ManyToOne(() => TruckType, (tt) => tt.loads, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'truck_type_id' })
  truckType: TruckType;

  @Index()
  @Column({ name: 'required_truck_category', length: 80, default: 'Open' })
  requiredTruckCategory: string;

  @Column({
    name: 'required_truck_type_desc',
    length: 150,
    default: 'Open Half/Full Body',
  })
  requiredTruckTypeDesc: string;

  @Column({ name: 'required_wheels', length: 50, default: '14 Wheeler' })
  requiredWheels: string;

  @Column({
    name: 'required_min_length_ft',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 28.0,
    transformer: numericTransformer,
  })
  requiredMinLengthFt: number;

  // Pricing & Payment Terms
  @Column({
    name: 'payment_terms',
    length: 80,
    default: PaymentTerms.TO_PAY,
  })
  paymentTerms: string;

  @Column({
    name: 'rate_per_truck',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 19000.0,
    transformer: numericTransformer,
  })
  ratePerTruck: number;

  @Column({ name: 'is_rate_negotiable', type: 'boolean', default: true })
  isRateNegotiable: boolean;

  @Column({
    name: 'pricing_note',
    length: 255,
    default: 'Full amount will be paid to the driver at the unloading point',
  })
  pricingNote: string;

  // Transporter / Shipper Details
  @Column({ name: 'transporter_name', length: 120, default: 'SKAND KUMAR' })
  transporterName: string;

  @Column({
    name: 'transporter_company',
    length: 150,
    default: 'RAJASTHAN GUJARAT ROADWAYS',
  })
  transporterCompany: string;

  @Column({
    name: 'transporter_phone',
    length: 50,
    default: '+91 98765 43210',
  })
  transporterPhone: string;

  @Column({
    name: 'transporter_rating',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 3.0,
    transformer: numericTransformer,
  })
  transporterRating: number;

  @Column({
    name: 'is_transporter_verified',
    type: 'boolean',
    default: true,
  })
  isTransporterVerified: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: LoadStatus,
    default: LoadStatus.OPEN,
  })
  status: LoadStatus;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @OneToMany(() => LoadBid, (bid) => bid.load)
  bids: LoadBid[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
