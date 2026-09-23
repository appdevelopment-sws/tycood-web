export const queryKeys = {
  operators: {
    all: ['operators'] as const,
    list: (filters?: Record<string, any>) => ['operators', 'list', filters] as const,
    detail: (id?: string | number) => ['operators', 'detail', id] as const,
  },
  buses: {
    all: ['buses'] as const,
    list: (filters?: Record<string, any>) => ['buses', 'list', filters] as const,
    detail: (id?: string | number) => ['buses', 'detail', id] as const,
  },
  cabs: {
    all: ['cabs'] as const,
    list: (filters?: Record<string, any>) => ['cabs', 'list', filters] as const,
    detail: (id?: string | number) => ['cabs', 'detail', id] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: (filters?: Record<string, any>) => ['brands', 'list', filters] as const,
    detail: (id?: string | number) => ['brands', 'detail', id] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    list: (filters?: Record<string, any>) => ['drivers', 'list', filters] as const,
    detail: (id?: string | number) => ['drivers', 'detail', id] as const,
  },
  seats: {
    all: ['seats'] as const,
    byBus: (busId?: string) => ['seats', 'bus', busId] as const,
    detail: (id?: string) => ['seats', 'detail', id] as const,
  },
  routes: {
    all: ['routes'] as const,
    list: (filters?: Record<string, any>) => ['routes', 'list', filters] as const,
    detail: (id?: string | number) => ['routes', 'detail', id] as const,
  },
  stations: {
    all: ['stations'] as const,
    list: (filters?: Record<string, any>) => ['stations', 'list', filters] as const,
    detail: (id?: string | number) => ['stations', 'detail', id] as const,
  },
  trips: {
    all: ['trips'] as const,
    list: (filters?: Record<string, any>) => ['trips', 'list', filters] as const,
    detail: (id?: string | number) => ['trips', 'detail', id] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (filters?: Record<string, any>) => ['bookings', 'list', filters] as const,
    detail: (id?: string | number) => ['bookings', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, any>) => ['users', 'list', filters] as const,
    detail: (id?: string | number) => ['users', 'detail', id] as const,
  },
  vouchers: {
    all: ['vouchers'] as const,
    list: (filters?: Record<string, any>) => ['vouchers', 'list', filters] as const,
    detail: (id?: string | number) => ['vouchers', 'detail', id] as const,
  },
} as const


