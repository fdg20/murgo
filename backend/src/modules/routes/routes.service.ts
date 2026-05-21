import { Injectable } from '@nestjs/common';
import { calculateDistanceKm } from '../../common/utils/geofence';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
}

@Injectable()
export class RoutesService {
  private osrmBase =
    process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';

  async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<RouteResult> {
    try {
      const url = `${this.osrmBase}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        return {
          distanceKm: Math.round((route.distance / 1000) * 100) / 100,
          durationMinutes: Math.ceil(route.duration / 60),
          coordinates: route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number],
          ),
        };
      }
    } catch {
      // fallback to haversine
    }

    const distanceKm = calculateDistanceKm(fromLat, fromLng, toLat, toLng);
    return {
      distanceKm,
      durationMinutes: Math.ceil((distanceKm / 25) * 60) + 5,
      coordinates: [
        [fromLat, fromLng],
        [toLat, toLng],
      ],
    };
  }
}
