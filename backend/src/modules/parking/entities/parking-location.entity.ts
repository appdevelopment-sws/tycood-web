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
import { ParkingOperator } from './parking-operator.entity';
import { ParkingLocationStatus } from '../../../common/enums/parking-status.enum';

@Entity('parking_locations')
export class ParkingLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'operator_id', type: 'uuid' })
  operatorId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 255, nullable: true })
  landmark: string;

  @Index()
  @Column({ length: 100 })
  city: string;

  @Column({ length: 20, nullable: true })
  pincode: string;

  @Column({ name: 'facility_structure', length: 100, default: 'Covered Basement & Ground' })
  facilityStructure: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ name: 'car_slots_total', type: 'int', default: 0 })
  carSlotsTotal: number;

  @Column({ name: 'bike_slots_total', type: 'int', default: 0 })
  bikeSlotsTotal: number;

  @Column({ name: 'ev_charging_points', type: 'int', default: 0 })
  evChargingPoints: number;

  @Column({ name: 'available_spaces', type: 'int', default: 0 })
  availableSpaces: number;

  @Column({ name: 'available_car_slots', type: 'int', default: 0 })
  availableCarSlots: number;

  @Column({ name: 'available_bike_slots', type: 'int', default: 0 })
  availableBikeSlots: number;

  @Column({ name: 'is_open_24x7', type: 'boolean', default: true })
  isOpen24x7: boolean;

  @Column({ name: 'operating_hours', type: 'text', default: '24x7 Open (Mon - Sun)' })
  operatingHours: string;

  @Column({ name: 'operating_schedule', type: 'jsonb', nullable: true })
  operatingSchedule: Record<string, any> | null;

  @Column({ name: 'opening_time', type: 'varchar', length: 10, nullable: true })
  openingTime: string | null;

  @Column({ name: 'closing_time', type: 'varchar', length: 10, nullable: true })
  closingTime: string | null;

  @Column({
    name: 'car_hourly_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 30.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 30.0,
    },
  })
  carHourlyRate: number;

  @Column({
    name: 'car_daily_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 250.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 250.0,
    },
  })
  carDailyRate: number;

  @Column({
    name: 'bike_hourly_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 15.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 15.0,
    },
  })
  bikeHourlyRate: number;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Index()
  @Column({
    type: 'enum',
    enum: ParkingLocationStatus,
    default: ParkingLocationStatus.ACTIVE,
  })
  status: ParkingLocationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => ParkingOperator, (op) => op.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: ParkingOperator;
}
