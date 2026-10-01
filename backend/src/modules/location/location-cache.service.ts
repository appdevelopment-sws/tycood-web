import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheStats {
  totalEntries: number;
  maxCapacity: number;
  hits: number;
  misses: number;
  hitRatio: string;
  savedRequestsCount: number;
  estimatedCostSavedUsd: string;
}

@Injectable()
export class LocationCacheService {
  private readonly logger = new Logger(LocationCacheService.name);

  // In-memory LRU store
  private readonly cache = new Map<string, CacheEntry<any>>();

  // Maximum items to prevent memory unbounded growth
  private readonly maxCapacity = 5000;

  // Cache Statistics
  private hits = 0;
  private misses = 0;

  // Approximate Google Maps API pricing per 1,000 requests ($5 for geocode/distance, $17 for details)
  private readonly averageCostPerCallUsd = 0.007;

  // Default TTLs (in milliseconds)
  public static readonly TTL = {
    REVERSE_GEOCODE: 24 * 60 * 60 * 1000, // 24 hours
    PLACE_DETAILS: 48 * 60 * 60 * 1000,   // 48 hours
    AUTOCOMPLETE: 6 * 60 * 60 * 1000,      // 6 hours
    DISTANCE: 30 * 60 * 1000,             // 30 minutes
    DIRECTIONS: 60 * 60 * 1000,           // 1 hour
  };

  constructor() {
    // Run periodic cleanup every 15 minutes to prune expired keys
    setInterval(() => this.pruneExpired(), 15 * 60 * 1000).unref();
  }

  /**
   * Retrieve item from cache if not expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Refresh LRU position (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value as T;
  }

  /**
   * Store item with TTL and enforce LRU max capacity
   */
  set<T>(key: string, value: T, ttlMs: number = LocationCacheService.TTL.REVERSE_GEOCODE): void {
    if (this.cache.size >= this.maxCapacity) {
      // Evict oldest item (first key in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  /**
   * Remove a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached location entries
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Location cache completely cleared');
  }

  /**
   * Get current cache performance statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0.0%';
    const estimatedCostSaved = (this.hits * this.averageCostPerCallUsd).toFixed(2);

    return {
      totalEntries: this.cache.size,
      maxCapacity: this.maxCapacity,
      hits: this.hits,
      misses: this.misses,
      hitRatio,
      savedRequestsCount: this.hits,
      estimatedCostSavedUsd: `$${estimatedCostSaved}`,
    };
  }

  /**
   * Remove expired keys to free memory
   */
  private pruneExpired(): void {
    const now = Date.now();
    let expiredCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      this.logger.debug(`Pruned ${expiredCount} expired location cache entries`);
    }
  }

  // --- KEY GENERATORS (WITH SMART COORDINATE BUCKETING) ---

  /**
   * Normalize GPS coordinates to ~11 meters grid (4 decimal places)
   * This clusters minor mobile GPS jitter to the SAME cache key!
   */
  normalizeCoordinate(coord: number, decimals = 4): string {
    return coord.toFixed(decimals);
  }

  getGeocodeKey(lat: number, lng: number): string {
    const normLat = this.normalizeCoordinate(lat, 4);
    const normLng = this.normalizeCoordinate(lng, 4);
    return `geo:${normLat},${normLng}`;
  }

  getAutocompleteKey(
    input: string,
    type?: string,
    lat?: number,
    lng?: number,
    radius?: number,
    country?: string,
  ): string {
    const cleanInput = input.trim().toLowerCase();
    const cleanType = (type || 'all').toLowerCase();
    const locPart =
      lat !== undefined && lng !== undefined
        ? `:${this.normalizeCoordinate(lat, 2)},${this.normalizeCoordinate(lng, 2)}:r${radius || 0}`
        : '';
    const countryPart = country ? `:c${country.toLowerCase()}` : '';

    return `ac:${cleanInput}:t${cleanType}${locPart}${countryPart}`;
  }

  getPlaceDetailsKey(placeId: string): string {
    return `place:${placeId.trim()}`;
  }

  getDistanceKey(origin: string, destination: string, mode: string): string {
    const normOrigin = origin.trim().toLowerCase();
    const normDest = destination.trim().toLowerCase();
    return `dist:${mode.toLowerCase()}:${normOrigin}->${normDest}`;
  }

  getDirectionsKey(origin: string, destination: string, mode: string): string {
    const normOrigin = origin.trim().toLowerCase();
    const normDest = destination.trim().toLowerCase();
    return `dir:${mode.toLowerCase()}:${normOrigin}->${normDest}`;
  }
}
