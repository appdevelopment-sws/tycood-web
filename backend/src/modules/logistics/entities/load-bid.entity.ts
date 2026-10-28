import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BidStatus } from '../enums/logistics.enums';
import { Load } from './load.entity';

const numericTransformer = {
  to: (value?: number | string | null) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return typeof value === 'string' ? parseFloat(value) : value;
  },
  from: (value?: string | null) =>
    value !== null && value !== undefined ? parseFloat(value) : null,
};

@Entity('load_bids')
export class LoadBid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'load_id', type: 'uuid' })
  loadId: string;

  @ManyToOne(() => Load, (load) => load.bids, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @Index()
  @Column({ name: 'driver_user_id', type: 'uuid', nullable: true })
  driverUserId: string;

  @Column({ name: 'driver_name', length: 120 })
  driverName: string;

  @Column({ name: 'driver_phone', length: 50 })
  driverPhone: string;

  @Column({
    name: 'proposed_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  proposedRate: number;

  @Column({ name: 'vehicle_number', length: 50, nullable: true })
  vehicleNumber: string;

  @Column({ name: 'vehicle_type', length: 100, nullable: true })
  vehicleType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.PENDING,
  })
  status: BidStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
