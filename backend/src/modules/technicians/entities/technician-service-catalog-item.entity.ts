import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TechnicianCategory } from './technician-category.entity.js';
import { TechnicianProviderService } from './technician-provider-service.entity.js';

@Entity('technician_service_catalog_items')
export class TechnicianServiceCatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Index()
  @Column({ length: 150 })
  name: string;

  @Index()
  @Column({ length: 150 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'estimated_duration_minutes', type: 'int', default: 30 })
  estimatedDurationMinutes: number;

  @Column({ name: 'is_inspection_required', type: 'boolean', default: false })
  isInspectionRequired: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => TechnicianCategory, (category) => category.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: TechnicianCategory;

  @OneToMany(
    () => TechnicianProviderService,
    (providerService) => providerService.serviceCatalogItem,
  )
  providerServices: TechnicianProviderService[];
}
