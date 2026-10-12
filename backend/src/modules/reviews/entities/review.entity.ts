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
import {
  ReviewServiceType,
  ReviewRole,
  ReviewTargetType,
} from '../../../common/enums/index.js';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ReviewServiceType,
    default: ReviewServiceType.CAB,
  })
  serviceType: ReviewServiceType;

  @Index()
  @Column({
    name: 'reviewer_role',
    type: 'enum',
    enum: ReviewRole,
    default: ReviewRole.DRIVER,
  })
  reviewerRole: ReviewRole;

  @Index()
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ReviewTargetType,
    default: ReviewTargetType.USER,
  })
  targetType: ReviewTargetType;

  @Index()
  @Column({ name: 'booking_id', type: 'varchar', length: 100, nullable: true })
  bookingId: string | null;

  @Index()
  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @Index()
  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Index()
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.givenReviews, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne(() => User, (user) => user.receivedReviews, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'target_id' })
  targetUser: User | null;
}
