export const SERVICE_AREA_MESSAGE =
  'Sorry, MurGo is currently available only within Murcia and Bacolod City, Negros Occidental.';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

/** Murcia municipality approximate boundary (simplified polygon, [lng, lat]) */
export const MURCIA_SERVICE_BOUNDARY: GeoPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [122.97, 10.54],
      [123.11, 10.54],
      [123.13, 10.62],
      [123.1, 10.68],
      [122.96, 10.67],
      [122.94, 10.6],
      [122.97, 10.54],
    ],
  ],
};

/** Bacolod City approximate boundary (simplified polygon, [lng, lat]) */
export const BACOLOD_SERVICE_BOUNDARY: GeoPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [122.88, 10.62],
      [123.06, 10.62],
      [123.07, 10.71],
      [122.92, 10.72],
      [122.88, 10.68],
      [122.88, 10.62],
    ],
  ],
};

export const ACTIVE_SERVICE_BOUNDARIES: GeoPolygon[] = [
  MURCIA_SERVICE_BOUNDARY,
  BACOLOD_SERVICE_BOUNDARY,
];

/** @deprecated Use MURCIA_SERVICE_BOUNDARY */
export const NEGROS_OCCIDENTAL_BOUNDARY = MURCIA_SERVICE_BOUNDARY;

export const SUPPORTED_CITIES = [
  { name: 'Murcia (Poblacion)', lat: 10.604, lng: 123.041 },
  { name: 'Blumentritt', lat: 10.612, lng: 123.028 },
  { name: 'Minoyan', lat: 10.618, lng: 123.055 },
  { name: 'Cansilayan', lat: 10.595, lng: 123.062 },
  { name: 'Damsite', lat: 10.588, lng: 123.035 },
  { name: 'San Miguel', lat: 10.621, lng: 123.018 },
  { name: 'Lopez Jaena', lat: 10.576, lng: 123.048 },
  { name: 'Caliban', lat: 10.567, lng: 123.021 },
  { name: 'Bacolod (Downtown)', lat: 10.676, lng: 122.951 },
  { name: 'Lacson', lat: 10.68, lng: 122.965 },
  { name: 'Burgos', lat: 10.668, lng: 122.944 },
  { name: 'Mandalagan', lat: 10.695, lng: 122.97 },
  { name: 'Tangub', lat: 10.658, lng: 122.938 },
  { name: 'Villamonte', lat: 10.655, lng: 122.955 },
  { name: 'Singcang', lat: 10.662, lng: 122.968 },
  { name: 'Banago', lat: 10.702, lng: 122.958 },
] as const;

export function isPointInPolygon(point: LatLng, polygon: number[][]): boolean {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function isWithinMurciaServiceArea(lat: number, lng: number): boolean {
  const ring = MURCIA_SERVICE_BOUNDARY.coordinates[0];
  return isPointInPolygon({ lat, lng }, ring);
}

export function isWithinBacolodServiceArea(lat: number, lng: number): boolean {
  const ring = BACOLOD_SERVICE_BOUNDARY.coordinates[0];
  return isPointInPolygon({ lat, lng }, ring);
}

export function isWithinActiveServiceArea(lat: number, lng: number): boolean {
  return ACTIVE_SERVICE_BOUNDARIES.some((boundary) =>
    isPointInPolygon({ lat, lng }, boundary.coordinates[0]),
  );
}

/** @deprecated Use isWithinActiveServiceArea */
export const isWithinNegrosOccidental = isWithinActiveServiceArea;

export function validateServiceArea(
  lat: number,
  lng: number,
): { valid: boolean; message?: string } {
  if (!isWithinActiveServiceArea(lat, lng)) {
    return { valid: false, message: SERVICE_AREA_MESSAGE };
  }
  return { valid: true };
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface DeliveryFeeParams {
  distanceKm: number;
  baseFee: number;
  perKmRate: number;
  flatFeeKm: number;
  flatFeeAmount: number;
}

export function calculateDeliveryFee(
  params: DeliveryFeeParams,
): number {
  const { distanceKm, baseFee, perKmRate, flatFeeKm, flatFeeAmount } = params;

  if (distanceKm <= flatFeeKm) {
    return flatFeeAmount;
  }

  return Math.round((baseFee + distanceKm * perKmRate) * 100) / 100;
}

export function estimateEtaMinutes(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.ceil((distanceKm / avgSpeedKmh) * 60) + 5;
}
