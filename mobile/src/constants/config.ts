const DEFAULT_API = 'http://localhost:3000/api';
const DEFAULT_SOCKET = 'http://localhost:3000';

const rawApi = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API;
const rawSocket = process.env.EXPO_PUBLIC_SOCKET_URL ?? DEFAULT_SOCKET;

const LOCAL_HOST =
  /localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/;

const REMOTE_API_HOST = /onrender\.com|railway\.app|fly\.dev|vercel\.app/;

/** Derive socket base URL from API URL when socket still points at a LAN IP. */
function resolveSocketUrl(apiUrl: string, socketUrl: string): string {
  const apiIsRemote = REMOTE_API_HOST.test(apiUrl);
  const socketIsLocal = LOCAL_HOST.test(socketUrl);
  if (apiIsRemote && socketIsLocal) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return socketUrl;
}

export const API_URL = rawApi;

export const SOCKET_URL = resolveSocketUrl(rawApi, rawSocket);

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
