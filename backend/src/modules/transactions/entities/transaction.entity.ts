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
import { User } from '../../users/entities/user.entity';
import { BusinessRole } from '../../../common/enums/business-role.enum';
import {
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '../../../common/enums/transaction.enums';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => (value ? parseFloat(String(value)) : 0),
};

@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['role', 'createdAt'])
@Index(['category', 'createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index()
  @Column({
    type: 'enum',
    enum: BusinessRole,
    nullable: true,
  })
  role: BusinessRole;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.CREDIT,
  })
  type: TransactionType;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionCategory,
    default: TransactionCategory.PARKING_COLLECTION,
  })
  category: TransactionCategory;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ length: 10, default: 'INR' })
  currency: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Index()
  @Column({ name: 'reference_id', nullable: true, length: 255 })
  referenceId: string;

  @Column({ name: 'reference_type', nullable: true, length: 100 })
  referenceType: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'payment_method', length: 50, default: 'CASH' })
  paymentMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    name: 'balance_after',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  balanceAfter: number;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
