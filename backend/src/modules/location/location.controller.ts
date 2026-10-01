import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationService } from './location.service.js';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto.js';
import { PlaceAutocompleteDto } from './dto/place-autocomplete.dto.js';
import { PlaceDetailsDto } from './dto/place-details.dto.js';
import { CalculateDistanceDto } from './dto/calculate-distance.dto.js';
import { GetDirectionsDto } from './dto/get-directions.dto.js';

@ApiTags('Location & Maps Services')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('reverse-geocode')
  @ApiOperation({
    summary: 'Reverse Geocoding: Get location and address details from latitude & longitude',
    description:
      'Resolves GPS coordinates into formatted address, city, state, postal code, and components using Google Geocoding API.',
  })
  @ApiResponse({
    status: 200,
    description: 'Formatted address and structured location components',
  })
  async reverseGeocode(@Query() dto: ReverseGeocodeDto) {
    return this.locationService.reverseGeocode(dto.lat, dto.lng);
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Place Autocomplete: Location auto suggestions based on input and location type',
    description:
      'Provides real-time location suggestions filtered by location type (e.g. establishment, geocode, address, (cities)), with optional GPS proximity bias.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching autocomplete predictions',
  })
  async autocomplete(@Query() dto: PlaceAutocompleteDto) {
    return this.locationService.getPlaceAutocomplete(dto);
  }

  @Get('place-details')
  @ApiOperation({
    summary: 'Place Details: Get coordinates and address breakdown for a Google Place ID',
    description:
      'Retrieves latitude, longitude, formatted address, and viewport for a place selected from autocomplete.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed place metadata including coordinates',
  })
  async placeDetails(@Query() dto: PlaceDetailsDto) {
    return this.locationService.getPlaceDetails(dto.placeId, dto.sessionToken);
  }

  @Get('distance')
  @ApiOperation({
    summary: 'Calculate Distance & Duration: Distance from Point A to Point B (Query Params)',
    description:
      'Calculates driving distance in meters/kilometers and travel duration between two locations using Google Distance Matrix API with fallback.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated distance and duration metrics',
  })
  async calculateDistanceGet(@Query() dto: CalculateDistanceDto) {
    return this.locationService.calculateDistance(dto);
  }

  @Post('distance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate Distance & Duration: Distance from Point A to Point B (JSON Body)',
    description:
      'Alternative POST endpoint for calculating driving distance and duration from Point A to Point B.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated distance and duration metrics',
  })
  async calculateDistancePost(@Body() dto: CalculateDistanceDto) {
    return this.locationService.calculateDistance(dto);
  }

  @Get('directions')
  @ApiOperation({
    summary: 'Directions & Route Polyline: Turn-by-turn route between Point A and Point B',
    description:
      'Returns route summary, encoded polyline for map drawing, distance, duration, and navigation steps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Route navigation directions and polyline geometry',
  })
  async getDirections(@Query() dto: GetDirectionsDto) {
    return this.locationService.getDirections(dto);
  }

  @Get('haversine-distance')
  @ApiOperation({
    summary: 'Straight-line Haversine Distance: Instant zero-cost distance calculation',
    description:
      'Calculates mathematical great-circle distance between two GPS coordinates without calling external Google APIs. Useful for geofencing and proximity filters.',
  })
  @ApiQuery({ name: 'lat1', type: Number, example: 25.5941 })
  @ApiQuery({ name: 'lng1', type: Number, example: 85.1376 })
  @ApiQuery({ name: 'lat2', type: Number, example: 25.6192 })
  @ApiQuery({ name: 'lng2', type: Number, example: 85.0886 })
  @ApiResponse({
    status: 200,
    description: 'Straight-line distance in meters and kilometers',
  })
  calculateHaversine(
    @Query('lat1') lat1: number,
    @Query('lng1') lng1: number,
    @Query('lat2') lat2: number,
    @Query('lng2') lng2: number,
  ) {
    return this.locationService.calculateHaversineDistance(
      Number(lat1),
      Number(lng1),
      Number(lat2),
      Number(lng2),
    );
  }

  @Get('cache/stats')
  @ApiOperation({
    summary: 'Cache Metrics: Track hit ratio and cost savings in USD',
    description:
      'Provides real-time caching performance metrics including total requests saved, cache hit ratio, and estimated Google API cost reduction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current cache metrics and estimated cost savings in USD',
  })
  getCacheStats() {
    return this.locationService.getCacheStats();
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear Cache: Invalidate all stored location queries',
    description: 'Flushes all reverse geocode, autocomplete, distance, and direction cached entries.',
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmation that the location cache has been emptied',
  })
  clearCache() {
    return this.locationService.clearCache();
  }
}
