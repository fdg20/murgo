import { View, Text } from 'react-native';
import { SERVICE_AREA_MESSAGE } from '../constants/config';

export function ServiceAreaBanner() {
  return (
    <View className="bg-red-600 px-4 py-3">
      <Text className="text-white text-center text-sm font-medium">
        {SERVICE_AREA_MESSAGE}
      </Text>
    </View>
  );
}
