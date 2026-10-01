export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  streetNumber?: string;
  route?: string;
  street?: string;
  sublocality?: string;
  neighborhood?: string;
  city?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
}

export interface ReverseGeocodeResult {
  placeId: string;
  formattedAddress: string;
  coordinates: Coordinates;
  components: AddressComponents;
  types: string[];
  plusCode?: string;
}

export interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetailsResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  coordinates: Coordinates;
  components: AddressComponents;
  types: string[];
  viewport?: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

export interface DistanceMatrixItem {
  originAddress: string;
  destinationAddress: string;
  distance: {
    text: string;
    value: number; // in meters
    kilometers: number;
    miles: number;
  };
  duration: {
    text: string;
    value: number; // in seconds
    minutes: number;
    hours: number;
  };
  status: string;
}

export interface RouteStep {
  instruction: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation: Coordinates;
  endLocation: Coordinates;
  travelMode: string;
}

export interface DirectionsResult {
  originAddress: string;
  destinationAddress: string;
  distance: {
    text: string;
    value: number;
    kilometers: number;
  };
  duration: {
    text: string;
    value: number;
    minutes: number;
  };
  summary: string;
  overviewPolyline: string;
  bounds: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
  steps: RouteStep[];
}

export enum TravelMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  BICYCLING = 'bicycling',
  TRANSIT = 'transit',
}

export enum LocationTypeFilter {
  ALL = 'all',
  GEOCODE = 'geocode',
  ADDRESS = 'address',
  ESTABLISHMENT = 'establishment',
  CITIES = '(cities)',
  REGIONS = '(regions)',
}
