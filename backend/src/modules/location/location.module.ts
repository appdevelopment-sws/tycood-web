import { Module } from '@nestjs/common';
import { LocationService } from './location.service.js';
import { LocationCacheService } from './location-cache.service.js';
import { LocationController } from './location.controller.js';

import { SettingsModule } from '../settings/settings.module.js';

@Module({
  imports: [SettingsModule],
  controllers: [LocationController],
  providers: [LocationCacheService, LocationService],
  exports: [LocationService, LocationCacheService],
})
export class LocationModule {}
