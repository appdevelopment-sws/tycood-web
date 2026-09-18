import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { DriverProfile } from './driver-profile.entity';
import { Vehicle } from './vehicle.entity';
import { DriverVehicleAssignmentStatus } from '../../../common/enums/vehicle-status.enum';

@Entity('driver_vehicles')
@Unique(['driverProfileId', 'vehicleId'])
export class DriverVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'driver_profile_id', type: 'uuid' })
  driverProfileId: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'is_primary', type: 'boolean', default: true })
  isPrimary: boolean;

  @Index()
  @Column({
    name: 'assignment_status',
    type: 'enum',
    enum: DriverVehicleAssignmentStatus,
    default: DriverVehicleAssignmentStatus.ASSIGNED,
  })
  assignmentStatus: DriverVehicleAssignmentStatus;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ name: 'unassigned_at', type: 'timestamptz', nullable: true })
  unassignedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => DriverProfile, (dp) => dp.driverVehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_profile_id' })
  driverProfile: DriverProfile;

  @ManyToOne(() => Vehicle, (v) => v.driverVehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;
}
