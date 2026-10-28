import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TruckBodyType } from '../enums/logistics.enums';
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

@Entity('truck_types')
export class TruckType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 120 })
  name: string;

  @Index()
  @Column({ length: 80, default: 'Open' })
  category: string;

  @Column({
    type: 'enum',
    enum: TruckBodyType,
    default: TruckBodyType.OPEN_HALF_BODY,
  })
  bodyType: TruckBodyType;

  // Length in feet (e.g., 14, 19, 22, 28, 32, 40) - critical for long iron rods/pipes
  @Column({
    name: 'length_ft',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 28.0,
    transformer: numericTransformer,
  })
  lengthFt: number;

  // Width in feet (e.g., 7.5, 8.0)
  @Column({
    name: 'width_ft',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 8.0,
    transformer: numericTransformer,
  })
  widthFt: number;

  // Height in feet (e.g., 6.0, 7.5, 8.5)
  @Column({
    name: 'height_ft',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 7.0,
    transformer: numericTransformer,
  })
  heightFt: number;

  @Column({ name: 'dimension_label', length: 120, nullable: true })
  dimensionLabel: string;

  // Minimum and Maximum Tonnage Capacity
  @Column({
    name: 'min_tons',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 7.5,
    transformer: numericTransformer,
  })
  minTons: number;

  @Column({
    name: 'max_tons',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 43.0,
    transformer: numericTransformer,
  })
  maxTons: number;

  @Column({ name: 'capacity_range', length: 80, default: '7.5 - 43 Ton' })
  capacityRange: string;

  @Column({ name: 'wheels_number', type: 'int', default: 10 })
  wheelsNumber: number;

  @Column({ name: 'wheel_count', length: 50, default: '10 Wheeler' })
  wheelCount: string;

  // List of materials this truck type is suitable for (e.g. Iron rods, cement, agro)
  @Column({
    name: 'suitable_materials',
    type: 'text',
    array: true,
    default: '{}',
  })
  suitableMaterials: string[];

  @Column({ name: 'icon_url', length: 255, nullable: true })
  iconUrl: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Load, (load) => load.truckType)
  loads: Load[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
