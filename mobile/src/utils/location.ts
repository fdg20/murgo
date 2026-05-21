import * as Location from 'expo-location';
import { geofenceApi } from '../api/services';
import { SERVICE_AREA_MESSAGE } from '../constants/config';

export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function validateServiceArea(
  latitude: number,
  longitude: number,
): Promise<{ valid: boolean; message?: string }> {
  try {
    const { data } = await geofenceApi.validate(latitude, longitude);
    return data;
  } catch {
    return { valid: false, message: SERVICE_AREA_MESSAGE };
  }
}

export async function getLocationWithValidation() {
  const coords = await getCurrentLocation();
  if (!coords) {
    return { coords: null, valid: false, message: 'Location permission denied' };
  }

  const validation = await validateServiceArea(
    coords.latitude,
    coords.longitude,
  );
  return { coords, ...validation };
}
