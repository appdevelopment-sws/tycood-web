import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Index()
  @Column({ length: 50, default: 'GENERAL' })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_secret', type: 'boolean', default: false })
  isSecret: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
