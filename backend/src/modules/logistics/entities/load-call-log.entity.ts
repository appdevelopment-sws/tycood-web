import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Load } from './load.entity';
import { User } from '../../users/entities/user.entity';

@Entity('load_call_logs')
export class LoadCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'load_id', type: 'uuid' })
  loadId: string;

  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  @Index()
  @Column({ name: 'caller_user_id', type: 'uuid', nullable: true })
  callerUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'caller_user_id' })
  callerUser?: User;

  @Column({ name: 'caller_name', length: 150 })
  callerName: string;

  @Index()
  @Column({ name: 'caller_phone', length: 50 })
  callerPhone: string;

  @Column({ name: 'load_number', length: 50 })
  loadNumber: string;

  @Column({ name: 'transporter_name', length: 150, nullable: true })
  transporterName?: string;

  @Column({ name: 'transporter_phone', length: 50, nullable: true })
  transporterPhone?: string;

  @Column({ name: 'source', length: 80, default: 'LOAD_DETAILS_SCREEN' })
  source: string;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
