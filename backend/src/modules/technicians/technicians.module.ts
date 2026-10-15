import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { TechnicianCategory } from './entities/technician-category.entity.js';
import { TechnicianServiceCatalogItem } from './entities/technician-service-catalog-item.entity.js';
import { TechnicianProviderService } from './entities/technician-provider-service.entity.js';
import { TechnicianBooking } from './entities/technician-booking.entity.js';
import { SystemSetting } from '../settings/entities/system-setting.entity.js';

import { TechniciansService } from './technicians.service.js';
import { TechnicianCategoriesService } from './technician-categories.service.js';
import { TechnicianProviderServicesService } from './technician-provider-services.service.js';
import { TechnicianBookingsService } from './technician-bookings.service.js';

import { TechniciansController } from './technicians.controller.js';
import { TechnicianCategoriesController } from './technician-categories.controller.js';
import { TechnicianBookingsController } from './technician-bookings.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TechnicianProfile,
      TechnicianCategory,
      TechnicianServiceCatalogItem,
      TechnicianProviderService,
      TechnicianBooking,
      SystemSetting,
    ]),
  ],
  controllers: [
    TechniciansController,
    TechnicianCategoriesController,
    TechnicianBookingsController,
  ],
  providers: [
    TechniciansService,
    TechnicianCategoriesService,
    TechnicianProviderServicesService,
    TechnicianBookingsService,
  ],
  exports: [
    TechniciansService,
    TechnicianCategoriesService,
    TechnicianProviderServicesService,
    TechnicianBookingsService,
    TypeOrmModule,
  ],
})
export class TechniciansModule {}

