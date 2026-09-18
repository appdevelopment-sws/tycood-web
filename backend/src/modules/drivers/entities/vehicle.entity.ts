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

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string;

  @Column({ name: 'vehicle_category', length: 50, default: 'Sedan Prime' })
  vehicleCategory: string;

  @Column({ length: 100, default: 'Maruti Suzuki' })
  make: string;

  @Column({ length: 100, default: 'Dzire' })
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

  @Column({ name: 'rc_number', length: 100, nullable: true })
  rcNumber: string;

  @Column({ name: 'insurance_policy_number', length: 100, nullable: true })
  insurancePolicyNumber: string;

  @Column({ name: 'permit_type', length: 100, default: 'All India Tourist Permit' })
  permitType: string;

  @Column({ name: 'rc_photo_uploaded', type: 'boolean', default: false })
  rcPhotoUploaded: boolean;

  @Column({ name: 'insurance_doc_uploaded', type: 'boolean', default: false })
  insuranceDocUploaded: boolean;

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

  @ManyToOne(() => User, (user) => user.ownedVehicles, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @OneToMany(() => DriverVehicle, (dv) => dv.vehicle)
  driverVehicles: DriverVehicle[];
}
