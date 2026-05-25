export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** Web admin dashboard (set EXPO_PUBLIC_ADMIN_URL in .env on a real device) */
export const ADMIN_PANEL_URL =
  process.env.EXPO_PUBLIC_ADMIN_URL ?? 'http://localhost:5173';

export const SERVICE_AREA_MESSAGE =
  'Sorry, MurGo is currently available only within Murcia and Bacolod City, Negros Occidental.';

/** Fallback when /geofence/cities is unavailable */
export const SUPPORTED_CITIES = [
  'Murcia (Poblacion)',
  'Blumentritt',
  'Bacolod (Downtown)',
  'Lacson',
  'Mandalagan',
  'Burgos',
  'Villamonte',
];
