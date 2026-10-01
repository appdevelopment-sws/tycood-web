import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaxType } from '../enums/tax-type.enum.js';
import { TaxScope } from '../enums/tax-scope.enum.js';

@Entity('taxes')
export class Tax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 50, unique: true })
  code: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TaxType,
    default: TaxType.PERCENTAGE,
  })
  taxType: TaxType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  rate: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaxScope,
    default: TaxScope.ALL_RIDES,
  })
  applicableOn: TaxScope;

  @Column({
    name: 'is_included_in_fare',
    type: 'boolean',
    default: false,
  })
  isIncludedInFare: boolean;

  @Index()
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
