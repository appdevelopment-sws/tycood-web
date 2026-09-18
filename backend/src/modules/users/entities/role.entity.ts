import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 50, unique: true })
  name: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_system_role', type: 'boolean', default: true })
  isSystemRole: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  permissions: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];
}
