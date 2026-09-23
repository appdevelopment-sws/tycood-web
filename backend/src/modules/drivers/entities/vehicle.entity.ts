import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';
import { DriverVehicle } from './driver-vehicle.entity';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? parseFloat(value) : 0),
};

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string;

  @Column({ name: 'vehicle_category', length: 50, default: 'Sedan' })
  vehicleCategory: string;

  @Column({ length: 150, nullable: true })
  name: string;

  @Column({ name: 'similar_models', length: 255, nullable: true })
  similarModels: string;

  @Column({ length: 100, nullable: true, default: 'Standard Fleet' })
  make: string;

  @Column({ length: 100, nullable: true, default: 'Standard' })
  model: string;

  @Index({ unique: true })
  @Column({ name: 'registration_number', length: 50, unique: true })
  registrationNumber: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ name: 'manufacturing_year', length: 10, default: '2023' })
  manufacturingYear: string;

  @Column({ name: 'fuel_type', length: 50, default: 'CNG + Petrol' })
  fuelType: string;

  @Column({ name: 'seating_capacity', type: 'int', default: 4 })
  seatingCapacity: number;

  @Column({ name: 'luggage_capacity', type: 'int', default: 2 })
  luggageCapacity: number;

  @Column({ name: 'rc_number', length: 100, nullable: true })
  rcNumber: string;

  @Column({ name: 'insurance_policy_number', length: 100, nullable: true })
  insurancePolicyNumber: string;

  @Column({
    name: 'permit_type',
    length: 100,
    default: 'All India Tourist Permit',
  })
  permitType: string;

  @Column({ name: 'rc_photo_uploaded', type: 'boolean', default: false })
  rcPhotoUploaded: boolean;

  @Column({ name: 'insurance_doc_uploaded', type: 'boolean', default: false })
  insuranceDocUploaded: boolean;

  // --- Dynamic Pricing Engine ---
  @Column({
    name: 'base_fare',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 499.0,
    transformer: numericTransformer,
  })
  baseFare: number;

  @Column({
    name: 'base_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 10.0,
    transformer: numericTransformer,
  })
  baseKm: number;

  @Column({
    name: 'per_km_charge',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 12.0,
    transformer: numericTransformer,
  })
  perKmCharge: number;

  @Column({
    name: 'extra_km_charge',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 15.0,
    transformer: numericTransformer,
  })
  extraKmCharge: number;

  @Column({
    name: 'roundoff_cost_per_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 11.0,
    transformer: numericTransformer,
  })
  roundoffCostPerKm: number;

  @Column({
    name: 'outstation_base_charge',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 2499.0,
    transformer: numericTransformer,
  })
  outstationBaseCharge: number;

  @Column({
    name: 'outstation_per_km_charge',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 14.0,
    transformer: numericTransformer,
  })
  outstationPerKmCharge: number;

  @Column({
    name: 'original_fare',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 649.0,
    transformer: numericTransformer,
  })
  originalFare: number;

  // --- App Card Presentation & Features ---
  @Column({ name: 'badge_tag', type: 'varchar', length: 50, nullable: true })
  badgeTag: string | null;

  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 4.8,
    transformer: numericTransformer,
  })
  rating: number;

  @Column({ name: 'reviews_count', type: 'int', default: 100 })
  reviewsCount: number;

  @Column({ name: 'eta_minutes', type: 'int', default: 5 })
  etaMinutes: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  features: string[];

  @Column({ name: 'has_ac', type: 'boolean', default: true })
  hasAc: boolean;

  @Column({ name: 'toll_included', type: 'boolean', default: true })
  tollIncluded: boolean;

  @Column({ name: 'free_cancellation', type: 'boolean', default: true })
  freeCancellation: boolean;

  @Column({ name: 'is_instant', type: 'boolean', default: true })
  isInstant: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.ownedVehicles, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @OneToMany(() => DriverVehicle, (dv) => dv.vehicle)
  driverVehicles: DriverVehicle[];
}
