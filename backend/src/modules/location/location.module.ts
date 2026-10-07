import { Module } from '@nestjs/common';
import { LocationService } from './location.service.js';
import { LocationCacheService } from './location-cache.service.js';
import { LocationController } from './location.controller.js';

import { SettingsModule } from '../settings/settings.module.js';
import { DispatchModule } from '../dispatch/dispatch.module.js';

@Module({
  imports: [SettingsModule, DispatchModule],
  controllers: [LocationController],
  providers: [LocationCacheService, LocationService],
  exports: [LocationService, LocationCacheService],
})
export class LocationModule {}
