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
import { TechnicianProfile } from './technician-profile.entity.js';
import { TechnicianServiceCatalogItem } from './technician-service-catalog-item.entity.js';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? parseFloat(value) : 0),
};

@Entity('technician_provider_services')
@Index(['technicianProfileId', 'serviceCatalogItemId'], { unique: true })
export class TechnicianProviderService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'technician_profile_id', type: 'uuid' })
  technicianProfileId: string;

  @Index()
  @Column({ name: 'service_catalog_item_id', type: 'uuid' })
  serviceCatalogItemId: string;

  @Column({
    name: 'custom_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  customPrice: number;

  @Index()
  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    () => TechnicianProfile,
    (profile) => profile.providerServices,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'technician_profile_id' })
  technicianProfile: TechnicianProfile;

  @ManyToOne(
    () => TechnicianServiceCatalogItem,
    (item) => item.providerServices,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'service_catalog_item_id' })
  serviceCatalogItem: TechnicianServiceCatalogItem;
}
