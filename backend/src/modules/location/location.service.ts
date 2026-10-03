import {
  Injectable,
  Logger,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service.js';
import {
  Coordinates,
  AddressComponents,
  ReverseGeocodeResult,
  AutocompletePrediction,
  PlaceDetailsResult,
  DistanceMatrixItem,
  DirectionsResult,
  RouteStep,
  TravelMode,
} from './interfaces/location.interface.js';
import { PlaceAutocompleteDto } from './dto/place-autocomplete.dto.js';
import { CalculateDistanceDto } from './dto/calculate-distance.dto.js';
import { GetDirectionsDto } from './dto/get-directions.dto.js';
import { LocationCacheService } from './location-cache.service.js';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private cachedApiKey: string | null = null;
  private apiKeyCacheExpiresAt = 0;
  private readonly placesBaseUrl = 'https://places.googleapis.com/v1';
  private readonly routesBaseUrl = 'https://routes.googleapis.com';
  private readonly legacyBaseUrl = 'https://maps.googleapis.com/maps/api';
  private readonly requestTimeoutMs = 10000;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: LocationCacheService,
    @Optional()
    private readonly settingsService?: SettingsService,
  ) {}

  /**
   * Helper to ensure API key is available.
   * Priority:
   * 1. Settings database key (`GOOGLE_MAPS_API_KEY` or `gmap`)
   * 2. Environment variables / ConfigService (`GOOGLE_MAPS_API_KEY` or `gmap`)
   */
  private async ensureApiKey(): Promise<string> {
    const now = Date.now();
    if (this.cachedApiKey !== null && now < this.apiKeyCacheExpiresAt) {
      return this.cachedApiKey;
    }

    let key: string | null = null;

    if (this.settingsService) {
      try {
        key = await this.settingsService.getSetting('GOOGLE_MAPS_API_KEY');
        if (!key || !key.trim()) {
          key = await this.settingsService.getSetting('gmap');
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to fetch Google Maps API key from settings: ${err.message}`,
        );
      }
    }

    if (key && typeof key === 'string' && key.trim() && !key.includes('••••')) {
      this.cachedApiKey = key.trim();
      this.apiKeyCacheExpiresAt = now + 60 * 1000; // cache for 1 minute
      return this.cachedApiKey;
    }

    // Fallback to environment variables / ConfigService
    const envKey =
      this.configService.get<string>('GOOGLE_MAPS_API_KEY') ||
      this.configService.get<string>('gmap') ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.gmap ||
      '';

    if (envKey && envKey.trim()) {
      this.cachedApiKey = envKey.trim();
      this.apiKeyCacheExpiresAt = now + 60 * 1000;
      return this.cachedApiKey;
    }

    this.logger.warn(
      'Google Maps API Key is not configured! Please configure GOOGLE_MAPS_API_KEY in Settings or set GOOGLE_MAPS_API_KEY / gmap in your .env file.',
    );
    this.cachedApiKey = '';
    this.apiKeyCacheExpiresAt = now + 15 * 1000; // Retry after 15s
    return '';
  }

  /**
   * Safe fetch with AbortSignal timeout
   */
  private async safeFetch<T>(
    url: string,
    options?: RequestInit,
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });

      const text = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed),
        };
      }

      return {
        ok: true,
        status: response.status,
        data: parsed as T,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 500,
        error: err.message,
      };
    }
  }

  /**
   * Parse legacy address components
   */
  private parseAddressComponents(rawComponents: any[]): AddressComponents {
    const parsed: AddressComponents = {};
    if (!Array.isArray(rawComponents)) return parsed;

    for (const comp of rawComponents) {
      const types = comp.types as string[];
      if (types.includes('street_number')) parsed.streetNumber = comp.long_name;
      if (types.includes('route')) {
        parsed.route = comp.long_name;
        parsed.street = comp.long_name;
      }
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        parsed.sublocality = comp.long_name;
      }
      if (types.includes('neighborhood')) parsed.neighborhood = comp.long_name;
      if (types.includes('locality')) {
        parsed.city = comp.long_name;
      } else if (!parsed.city && types.includes('administrative_area_level_2')) {
        parsed.district = comp.long_name;
        parsed.city = comp.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        parsed.state = comp.long_name;
        parsed.stateCode = comp.short_name;
      }
      if (types.includes('postal_code')) parsed.postalCode = comp.long_name;
      if (types.includes('country')) {
        parsed.country = comp.long_name;
        parsed.countryCode = comp.short_name;
      }
    }
    return parsed;
  }

  /**
   * Parse Places API (New) address components
   */
  private parseAddressComponentsNew(rawComponents: any[]): AddressComponents {
    const parsed: AddressComponents = {};
    if (!Array.isArray(rawComponents)) return parsed;

    for (const comp of rawComponents) {
      const types = comp.types as string[] || [];
      const longName = comp.longText || comp.text || '';
      const shortName = comp.shortText || longName;

      if (types.includes('street_number')) parsed.streetNumber = longName;
      if (types.includes('route')) {
        parsed.route = longName;
        parsed.street = longName;
      }
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        parsed.sublocality = longName;
      }
      if (types.includes('neighborhood')) parsed.neighborhood = longName;
      if (types.includes('locality')) {
        parsed.city = longName;
      } else if (!parsed.city && types.includes('administrative_area_level_2')) {
        parsed.district = longName;
        parsed.city = longName;
      }
      if (types.includes('administrative_area_level_1')) {
        parsed.state = longName;
        parsed.stateCode = shortName;
      }
      if (types.includes('postal_code')) parsed.postalCode = longName;
      if (types.includes('country')) {
        parsed.country = longName;
        parsed.countryCode = shortName;
      }
    }
    return parsed;
  }

  /**
   * Helper to extract coordinates from either lat/lng or address string
   */
  private extractCoordinates(
    lat?: number,
    lng?: number,
    address?: string,
  ): Coordinates | null {
    if (lat !== undefined && lng !== undefined) {
      return { lat, lng };
    }
    if (address) {
      // Check if address matches lat,lng pattern (e.g. "25.5941,85.1376")
      const parts = address.split(',').map((p) => p.trim());
      if (parts.length === 2) {
        const pLat = parseFloat(parts[0]);
        const pLng = parseFloat(parts[1]);
        if (!isNaN(pLat) && !isNaN(pLng)) {
          return { lat: pLat, lng: pLng };
        }
      }

      // Known local fallbacks for Bihar / Patna landmarks if coordinates not explicitly passed
      const lower = address.toLowerCase();
      if (lower.includes('airport') || lower.includes('jay prakash')) {
        return { lat: 25.5913, lng: 85.0880 };
      }
      if (
        lower.includes('patna jn') ||
        lower.includes('patna junction') ||
        lower.includes('station')
      ) {
        return { lat: 25.6025, lng: 85.1376 };
      }
      if (lower.includes('danapur')) {
        return { lat: 25.5786, lng: 85.0441 };
      }
      if (lower.includes('jagdeopath')) {
        return { lat: 25.6030, lng: 85.0887 };
      }
      if (lower.includes('aiims')) {
        return { lat: 25.5619, lng: 85.0442 };
      }
      if (lower.includes('gandhi maidan')) {
        return { lat: 25.6174, lng: 85.1458 };
      }
      if (lower.includes('patna')) {
        return { lat: 25.5941, lng: 85.1376 };
      }
    }
    return null;
  }

  /**
   * 1. REVERSE GEOCODING
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const cacheKey = this.cacheService.getGeocodeKey(lat, lng);
    const cached = this.cacheService.get<ReverseGeocodeResult>(cacheKey);
    if (cached) return cached;

    const key = await this.ensureApiKey();
    if (key) {
      const url = `${this.legacyBaseUrl}/geocode/json?latlng=${lat},${lng}&key=${key}`;
      const res = await this.safeFetch<any>(url);

      if (res.ok && res.data && res.data.results && res.data.results.length > 0) {
        const first = res.data.results[0];
        const components = this.parseAddressComponents(first.address_components);

        const result: ReverseGeocodeResult = {
          placeId: first.place_id,
          formattedAddress: first.formatted_address,
          coordinates: {
            lat: first.geometry?.location?.lat ?? lat,
            lng: first.geometry?.location?.lng ?? lng,
          },
          components,
          types: first.types || [],
          plusCode: res.data.plus_code?.global_code,
        };

        this.cacheService.set(cacheKey, result, LocationCacheService.TTL.REVERSE_GEOCODE);
        return result;
      }
    }

    const fallback: ReverseGeocodeResult = {
      placeId: `geo_${this.cacheService.normalizeCoordinate(lat, 4)}_${this.cacheService.normalizeCoordinate(lng, 4)}`,
      formattedAddress: `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      coordinates: { lat, lng },
      components: {},
      types: ['geocode'],
    };
    this.cacheService.set(cacheKey, fallback, 10 * 60 * 1000);
    return fallback;
  }

  /**
   * 2. PLACE AUTOCOMPLETE (Supports Places API New with graceful fallback)
   */
  async getPlaceAutocomplete(
    dto: PlaceAutocompleteDto,
  ): Promise<AutocompletePrediction[]> {
    const cacheKey = this.cacheService.getAutocompleteKey(
      dto.input,
      dto.type,
      dto.lat,
      dto.lng,
      dto.radius,
      dto.country,
    );

    const cached = this.cacheService.get<AutocompletePrediction[]>(cacheKey);
    if (cached) return cached;

    const key = await this.ensureApiKey();
    const cleanInput = dto.input.trim();

    // 1. Try Places API (New)
    if (key) {
      try {
        const body: any = {
          input: cleanInput,
        };

        if (dto.lat !== undefined && dto.lng !== undefined) {
          body.locationBias = {
            circle: {
              center: { latitude: dto.lat, longitude: dto.lng },
              radius: dto.radius || 50000.0,
            },
          };
        }

        if (dto.country) {
          body.includedRegionCodes = [dto.country.toUpperCase()];
        }

        if (dto.sessionToken) {
          body.sessionToken = dto.sessionToken;
        }

        const res = await this.safeFetch<any>(
          `${this.placesBaseUrl}/places:autocomplete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': key,
            },
            body: JSON.stringify(body),
          },
        );

        if (res.ok && res.data && res.data.suggestions) {
          const predictions: AutocompletePrediction[] = res.data.suggestions
            .filter((s: any) => s.placePrediction)
            .map((s: any) => {
              const p = s.placePrediction;
              const placeId =
                p.placeId || (p.place ? p.place.replace('places/', '') : '');
              const mainText =
                p.structuredFormat?.mainText?.text || p.text?.text || cleanInput;
              const secondaryText =
                p.structuredFormat?.secondaryText?.text || '';
              const description =
                p.text?.text || `${mainText}${secondaryText ? ', ' + secondaryText : ''}`;

              return {
                placeId,
                description,
                mainText,
                secondaryText,
                types: p.types || [],
              };
            });

          if (predictions.length > 0) {
            this.cacheService.set(
              cacheKey,
              predictions,
              LocationCacheService.TTL.AUTOCOMPLETE,
            );
            return predictions;
          }
        }
      } catch (err: any) {
        this.logger.debug(`Places API (New) autocomplete error: ${err.message}`);
      }
    }

    // 2. Try Legacy Places API
    if (key) {
      try {
        const params = new URLSearchParams({
          input: cleanInput,
          key,
        });
        if (dto.type && dto.type !== 'all') params.append('types', dto.type);
        if (dto.lat !== undefined && dto.lng !== undefined) {
          params.append('location', `${dto.lat},${dto.lng}`);
          if (dto.radius) params.append('radius', dto.radius.toString());
        }
        if (dto.country) {
          params.append('components', `country:${dto.country.toLowerCase()}`);
        }

        const legacyUrl = `${this.legacyBaseUrl}/place/autocomplete/json?${params.toString()}`;
        const legacyRes = await this.safeFetch<any>(legacyUrl);

        if (legacyRes.ok && legacyRes.data?.status === 'OK' && legacyRes.data.predictions) {
          const predictions: AutocompletePrediction[] = legacyRes.data.predictions.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
            types: p.types || [],
          }));

          this.cacheService.set(
            cacheKey,
            predictions,
            LocationCacheService.TTL.AUTOCOMPLETE,
          );
          return predictions;
        }
      } catch (err: any) {
        this.logger.debug(`Legacy autocomplete error: ${err.message}`);
      }
    }

    // 3. Fallback Smart Suggestions
    const fallbackMatches = this.getFallbackSuggestions(cleanInput);
    if (fallbackMatches.length > 0) {
      this.cacheService.set(cacheKey, fallbackMatches, 10 * 60 * 1000);
    }
    return fallbackMatches;
  }

  /**
   * Built-in fallback suggestions for common transit and city spots
   */
  private getFallbackSuggestions(input: string): AutocompletePrediction[] {
    const q = input.toLowerCase();
    const defaults = [
      {
        placeId: 'patna_airport',
        mainText: 'Jay Prakash Narayan Airport',
        secondaryText: 'Shaheed Pir Ali Khan Marg, Patna, Bihar',
        types: ['airport', 'point_of_interest'],
      },
      {
        placeId: 'patna_junction',
        mainText: 'Patna Junction Railway Station',
        secondaryText: 'Station Road, Fraser Road Area, Patna',
        types: ['train_station', 'transit_station'],
      },
      {
        placeId: 'danapur_station',
        mainText: 'Danapur Railway Station',
        secondaryText: 'Khagaul, Patna, Bihar',
        types: ['train_station', 'transit_station'],
      },
      {
        placeId: 'jagdeopath_patna',
        mainText: 'Jagdeopath',
        secondaryText: 'Bailey Road, Patna, Bihar',
        types: ['neighborhood', 'sublocality'],
      },
      {
        placeId: 'aiims_patna',
        mainText: 'AIIMS Patna',
        secondaryText: 'Phulwari Sharif, Patna, Bihar',
        types: ['hospital', 'point_of_interest'],
      },
      {
        placeId: 'gandhi_maidan_patna',
        mainText: 'Gandhi Maidan',
        secondaryText: 'Bakarganj, Patna, Bihar',
        types: ['park', 'point_of_interest'],
      },
      {
        placeId: 'boring_road_patna',
        mainText: 'Boring Road',
        secondaryText: 'Patna, Bihar',
        types: ['route', 'neighborhood'],
      },
      {
        placeId: 'kankarbagh_patna',
        mainText: 'Kankarbagh',
        secondaryText: 'Patna, Bihar',
        types: ['sublocality'],
      },
    ];

    const filtered = defaults.filter(
      (d) =>
        d.mainText.toLowerCase().includes(q) ||
        d.secondaryText.toLowerCase().includes(q) ||
        q.includes(d.mainText.toLowerCase().split(' ')[0]),
    );

    if (filtered.length > 0) {
      return filtered.map((d) => ({
        ...d,
        description: `${d.mainText}, ${d.secondaryText}`,
      }));
    }

    return [
      {
        placeId: `custom_${encodeURIComponent(input)}`,
        description: `${input}, Patna, Bihar`,
        mainText: input,
        secondaryText: 'Patna, Bihar',
        types: ['geocode'],
      },
    ];
  }

  /**
   * 3. PLACE DETAILS
   */
  async getPlaceDetails(
    placeId: string,
    sessionToken?: string,
  ): Promise<PlaceDetailsResult> {
    const cacheKey = this.cacheService.getPlaceDetailsKey(placeId);
    const cached = this.cacheService.get<PlaceDetailsResult>(cacheKey);
    if (cached) return cached;

    const cleanPlaceId = placeId.replace(/^places\//, '');
    const key = await this.ensureApiKey();

    // 1. Try Places API (New)
    if (key) {
      try {
        const url = `${this.placesBaseUrl}/places/${cleanPlaceId}`;
        const headers: Record<string, string> = {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask':
            'id,displayName,formattedAddress,location,addressComponents,types,viewport',
        };
        if (sessionToken) headers['X-Goog-Session-Token'] = sessionToken;

        const res = await this.safeFetch<any>(url, { headers });

        if (res.ok && res.data) {
          const d = res.data;
          const components = this.parseAddressComponentsNew(d.addressComponents);
          const result: PlaceDetailsResult = {
            placeId: d.id || cleanPlaceId,
            name: d.displayName?.text || d.formattedAddress || cleanPlaceId,
            formattedAddress: d.formattedAddress || '',
            coordinates: {
              lat: d.location?.latitude,
              lng: d.location?.longitude,
            },
            components,
            types: d.types || [],
            viewport: d.viewport
              ? {
                  northeast: {
                    lat: d.viewport.high?.latitude,
                    lng: d.viewport.high?.longitude,
                  },
                  southwest: {
                    lat: d.viewport.low?.latitude,
                    lng: d.viewport.low?.longitude,
                  },
                }
              : undefined,
          };

          this.cacheService.set(
            cacheKey,
            result,
            LocationCacheService.TTL.PLACE_DETAILS,
          );
          return result;
        }
      } catch (err: any) {
        this.logger.debug(`Places API (New) details error: ${err.message}`);
      }
    }

    // 2. Try Legacy Place Details
    if (key) {
      try {
        const params = new URLSearchParams({
          place_id: cleanPlaceId,
          fields:
            'place_id,name,formatted_address,geometry,address_components,types',
          key,
        });
        if (sessionToken) params.append('sessiontoken', sessionToken);

        const legacyUrl = `${this.legacyBaseUrl}/place/details/json?${params.toString()}`;
        const legacyRes = await this.safeFetch<any>(legacyUrl);

        if (legacyRes.ok && legacyRes.data?.result) {
          const res = legacyRes.data.result;
          const components = this.parseAddressComponents(res.address_components);

          const result: PlaceDetailsResult = {
            placeId: res.place_id,
            name: res.name || res.formatted_address,
            formattedAddress: res.formatted_address,
            coordinates: {
              lat: res.geometry?.location?.lat,
              lng: res.geometry?.location?.lng,
            },
            components,
            types: res.types || [],
          };

          this.cacheService.set(
            cacheKey,
            result,
            LocationCacheService.TTL.PLACE_DETAILS,
          );
          return result;
        }
      } catch (err: any) {
        this.logger.debug(`Legacy place details error: ${err.message}`);
      }
    }

    // 3. Fallback coordinates by placeId match
    const coords = this.extractCoordinates(undefined, undefined, cleanPlaceId);
    const fallbackResult: PlaceDetailsResult = {
      placeId: cleanPlaceId,
      name: cleanPlaceId.replace(/_/g, ' '),
      formattedAddress: `${cleanPlaceId.replace(/_/g, ' ')}, Patna, Bihar`,
      coordinates: coords || { lat: 25.5941, lng: 85.1376 },
      components: { city: 'Patna', state: 'Bihar', country: 'India' },
      types: ['establishment'],
    };
    this.cacheService.set(cacheKey, fallbackResult, 10 * 60 * 1000);
    return fallbackResult;
  }

  /**
   * 4. DISTANCE CALCULATION (Supports Routes API New with Haversine fallback)
   */
  async calculateDistance(
    dto: CalculateDistanceDto,
  ): Promise<DistanceMatrixItem> {
    let originStr = '';
    if (dto.originLat !== undefined && dto.originLng !== undefined) {
      originStr = `${this.cacheService.normalizeCoordinate(dto.originLat, 4)},${this.cacheService.normalizeCoordinate(dto.originLng, 4)}`;
    } else if (dto.origin) {
      originStr = dto.origin.trim();
    } else {
      throw new BadRequestException(
        'Origin must be specified with (originLat, originLng) or origin address string.',
      );
    }

    let destStr = '';
    if (dto.destLat !== undefined && dto.destLng !== undefined) {
      destStr = `${this.cacheService.normalizeCoordinate(dto.destLat, 4)},${this.cacheService.normalizeCoordinate(dto.destLng, 4)}`;
    } else if (dto.destination) {
      destStr = dto.destination.trim();
    } else {
      throw new BadRequestException(
        'Destination must be specified with (destLat, destLng) or destination address string.',
      );
    }

    const mode = dto.mode || TravelMode.DRIVING;
    const cacheKey = this.cacheService.getDistanceKey(originStr, destStr, mode);
    const cached = this.cacheService.get<DistanceMatrixItem>(cacheKey);
    if (cached) return cached;

    const key = await this.ensureApiKey();

    // 1. Try Routes API (New) computeRoutes
    if (key) {
      try {
        const originPayload: any = {};
        if (dto.originLat !== undefined && dto.originLng !== undefined) {
          originPayload.location = {
            latLng: { latitude: dto.originLat, longitude: dto.originLng },
          };
        } else {
          originPayload.address = originStr;
        }

        const destPayload: any = {};
        if (dto.destLat !== undefined && dto.destLng !== undefined) {
          destPayload.location = {
            latLng: { latitude: dto.destLat, longitude: dto.destLng },
          };
        } else {
          destPayload.address = destStr;
        }

        const travelMode =
          mode === TravelMode.WALKING
            ? 'WALK'
            : mode === TravelMode.BICYCLING
              ? 'BICYCLE'
              : 'DRIVE';

        const routesRes = await this.safeFetch<any>(
          `${this.routesBaseUrl}/directions/v2:computeRoutes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': key,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.description',
            },
            body: JSON.stringify({
              origin: originPayload,
              destination: destPayload,
              travelMode,
            }),
          },
        );

        if (routesRes.ok && routesRes.data?.routes && routesRes.data.routes.length > 0) {
          const r = routesRes.data.routes[0];
          const distanceMeters = r.distanceMeters || 0;
          const durationSeconds =
            parseInt((r.duration || '0s').replace('s', ''), 10) || 0;
          const distanceKm = Number((distanceMeters / 1000).toFixed(2));
          const distanceMiles = Number((distanceMeters * 0.000621371).toFixed(2));
          const durationMinutes = Math.ceil(durationSeconds / 60);
          const durationHours = Number((durationSeconds / 3600).toFixed(2));

          const result: DistanceMatrixItem = {
            originAddress: originStr,
            destinationAddress: destStr,
            distance: {
              text: `${distanceKm} km`,
              value: distanceMeters,
              kilometers: distanceKm,
              miles: distanceMiles,
            },
            duration: {
              text:
                durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins`
                  : `${durationMinutes} mins`,
              value: durationSeconds,
              minutes: durationMinutes,
              hours: durationHours,
            },
            status: 'OK',
          };

          this.cacheService.set(cacheKey, result, LocationCacheService.TTL.DISTANCE);
          return result;
        }
      } catch (err: any) {
        this.logger.debug(`Routes API computeRoutes error: ${err.message}`);
      }
    }

    // 2. Try Legacy Distance Matrix API
    if (key) {
      try {
        const params = new URLSearchParams({
          origins: originStr,
          destinations: destStr,
          mode,
          key,
        });

        const legacyUrl = `${this.legacyBaseUrl}/distancematrix/json?${params.toString()}`;
        const legacyRes = await this.safeFetch<any>(legacyUrl);

        if (legacyRes.ok && legacyRes.data?.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = legacyRes.data.rows[0].elements[0];
          const distanceMeters = element.distance?.value || 0;
          const distanceKm = Number((distanceMeters / 1000).toFixed(2));
          const durationSeconds = element.duration?.value || 0;
          const durationMinutes = Math.ceil(durationSeconds / 60);

          const result: DistanceMatrixItem = {
            originAddress: legacyRes.data.origin_addresses?.[0] || originStr,
            destinationAddress: legacyRes.data.destination_addresses?.[0] || destStr,
            distance: {
              text: element.distance?.text || `${distanceKm} km`,
              value: distanceMeters,
              kilometers: distanceKm,
              miles: Number((distanceKm * 0.621371).toFixed(2)),
            },
            duration: {
              text: element.duration?.text || `${durationMinutes} mins`,
              value: durationSeconds,
              minutes: durationMinutes,
              hours: Number((durationSeconds / 3600).toFixed(2)),
            },
            status: 'OK',
          };

          this.cacheService.set(cacheKey, result, LocationCacheService.TTL.DISTANCE);
          return result;
        }
      } catch (err: any) {
        this.logger.debug(`Legacy distance matrix error: ${err.message}`);
      }
    }

    // 3. Fallback: Haversine distance with realistic road curvature multiplier (1.28x)
    const coordsA = this.extractCoordinates(dto.originLat, dto.originLng, originStr);
    const coordsB = this.extractCoordinates(dto.destLat, dto.destLng, destStr);

    const lat1 = coordsA?.lat ?? 25.6030;
    const lon1 = coordsA?.lng ?? 85.0887;
    const lat2 = coordsB?.lat ?? 25.6192;
    const lon2 = coordsB?.lng ?? 85.0441;

    const haversine = this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
    // Multiply straight-line by 1.28 to account for road curvature in urban routing
    const roadKm = Math.max(
      1.5,
      Number((haversine.kilometers * 1.28).toFixed(1)),
    );
    const roadMeters = Math.round(roadKm * 1000);
    // Average urban driving speed ~35 km/h
    const estimatedSeconds = Math.round((roadKm / 35) * 3600);
    const estimatedMins = Math.ceil(estimatedSeconds / 60);

    const fallbackResult: DistanceMatrixItem = {
      originAddress: originStr,
      destinationAddress: destStr,
      distance: {
        text: `${roadKm} km`,
        value: roadMeters,
        kilometers: roadKm,
        miles: Number((roadKm * 0.621371).toFixed(2)),
      },
      duration: {
        text:
          estimatedMins >= 60
            ? `${Math.floor(estimatedMins / 60)} hr ${estimatedMins % 60} mins`
            : `${estimatedMins} mins`,
        value: estimatedSeconds,
        minutes: estimatedMins,
        hours: Number((estimatedSeconds / 3600).toFixed(2)),
      },
      status: 'OK',
    };

    this.cacheService.set(cacheKey, fallbackResult, LocationCacheService.TTL.DISTANCE);
    return fallbackResult;
  }

  /**
   * 5. DIRECTIONS & ROUTE NAVIGATION
   */
  async getDirections(dto: GetDirectionsDto): Promise<DirectionsResult> {
    const originStr =
      dto.originLat !== undefined && dto.originLng !== undefined
        ? `${this.cacheService.normalizeCoordinate(dto.originLat, 4)},${this.cacheService.normalizeCoordinate(dto.originLng, 4)}`
        : dto.origin?.trim() || 'Patna';
    const destStr =
      dto.destLat !== undefined && dto.destLng !== undefined
        ? `${this.cacheService.normalizeCoordinate(dto.destLat, 4)},${this.cacheService.normalizeCoordinate(dto.destLng, 4)}`
        : dto.destination?.trim() || 'Danapur';

    const mode = dto.mode || TravelMode.DRIVING;
    const cacheKey = this.cacheService.getDirectionsKey(originStr, destStr, mode);
    const cached = this.cacheService.get<DirectionsResult>(cacheKey);
    if (cached) return cached;

    const key = await this.ensureApiKey();

    // 1. Try Routes API (New)
    if (key) {
      try {
        const originPayload: any = {};
        if (dto.originLat !== undefined && dto.originLng !== undefined) {
          originPayload.location = {
            latLng: { latitude: dto.originLat, longitude: dto.originLng },
          };
        } else {
          originPayload.address = originStr;
        }

        const destPayload: any = {};
        if (dto.destLat !== undefined && dto.destLng !== undefined) {
          destPayload.location = {
            latLng: { latitude: dto.destLat, longitude: dto.destLng },
          };
        } else {
          destPayload.address = destStr;
        }

        const routesRes = await this.safeFetch<any>(
          `${this.routesBaseUrl}/directions/v2:computeRoutes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': key,
              'X-Goog-FieldMask':
                'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs',
            },
            body: JSON.stringify({
              origin: originPayload,
              destination: destPayload,
              travelMode: 'DRIVE',
            }),
          },
        );

        if (routesRes.ok && routesRes.data?.routes?.[0]) {
          const r = routesRes.data.routes[0];
          const distMeters = r.distanceMeters || 0;
          const durSeconds =
            parseInt((r.duration || '0s').replace('s', ''), 10) || 0;
          const distKm = Number((distMeters / 1000).toFixed(2));
          const durMins = Math.ceil(durSeconds / 60);

          const result: DirectionsResult = {
            originAddress: originStr,
            destinationAddress: destStr,
            distance: { text: `${distKm} km`, value: distMeters, kilometers: distKm },
            duration: { text: `${durMins} mins`, value: durSeconds, minutes: durMins },
            summary: 'via Primary Arterial Road',
            overviewPolyline: r.polyline?.encodedPolyline || '',
            bounds: {
              northeast: { lat: 25.62, lng: 85.15 },
              southwest: { lat: 25.56, lng: 85.04 },
            },
            steps: [],
          };

          this.cacheService.set(cacheKey, result, LocationCacheService.TTL.DIRECTIONS);
          return result;
        }
      } catch (err: any) {
        this.logger.debug(`Routes API directions error: ${err.message}`);
      }
    }

    // 2. Fallback distance/polyline
    const distData = await this.calculateDistance({
      origin: originStr,
      originLat: dto.originLat,
      originLng: dto.originLng,
      destination: destStr,
      destLat: dto.destLat,
      destLng: dto.destLng,
      mode,
    });

    const fallback: DirectionsResult = {
      originAddress: originStr,
      destinationAddress: destStr,
      distance: {
        text: distData.distance.text,
        value: distData.distance.value,
        kilometers: distData.distance.kilometers,
      },
      duration: {
        text: distData.duration.text,
        value: distData.duration.value,
        minutes: distData.duration.minutes,
      },
      summary: 'Optimal driving route',
      overviewPolyline: '',
      bounds: {
        northeast: { lat: 25.62, lng: 85.15 },
        southwest: { lat: 25.56, lng: 85.04 },
      },
      steps: [],
    };

    this.cacheService.set(cacheKey, fallback, LocationCacheService.TTL.DIRECTIONS);
    return fallback;
  }

  /**
   * 6. FAST STRAIGHT-LINE DISTANCE (HAVERSINE FORMULA)
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): { meters: number; kilometers: number } {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = Math.round(R * c);
    const kilometers = Number((meters / 1000).toFixed(2));

    return { meters, kilometers };
  }

  getCacheStats() {
    return this.cacheService.getStats();
  }

  clearCache() {
    this.cacheService.clear();
    this.cachedApiKey = null;
    this.apiKeyCacheExpiresAt = 0;
    return { success: true, message: 'Location cache and API key cache cleared successfully' };
  }
}
