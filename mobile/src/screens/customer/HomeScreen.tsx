import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { merchantsApi } from '../../api/services';
import { useLocationStore } from '../../store';
import { getLocationWithValidation } from '../../utils/location';
import { ServiceAreaBanner } from '../../components/ServiceAreaBanner';
import { Merchant } from '../../types';
import { SUPPORTED_CITIES } from '../../constants/config';

interface Props {
  onMerchantPress: (merchantId: string) => void;
}

export function HomeScreen({ onMerchantPress }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const { inServiceArea, setLocation, setServiceArea } = useLocationStore();

  useEffect(() => {
    (async () => {
      const result = await getLocationWithValidation();
      if (result.coords) {
        setLocation(result.coords.latitude, result.coords.longitude);
        setServiceArea(result.valid);
      }
    })();
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['merchants', selectedCity, search],
    queryFn: async () => {
      const res = await merchantsApi.browse({ city: selectedCity, search });
      return res.data as Merchant[];
    },
  });

  const renderMerchant = useCallback(
    ({ item }: { item: Merchant }) => (
      <TouchableOpacity
        className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-100"
        onPress={() => onMerchantPress(item.id)}
      >
        <View className="h-32 bg-gray-200 items-center justify-center">
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} className="w-full h-full" />
          ) : (
            <Text className="text-4xl">🍽️</Text>
          )}
        </View>
        <View className="p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-secondary text-lg font-semibold flex-1">
              {item.businessName}
            </Text>
            <View
              className={`px-2 py-1 rounded-full ${item.isOpen ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-xs font-medium ${item.isOpen ? 'text-green-700' : 'text-gray-500'}`}
              >
                {item.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm mt-1">{item.city}</Text>
          {item.description && (
            <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [onMerchantPress],
  );

  return (
    <View className="flex-1 bg-surface">
      {!inServiceArea && <ServiceAreaBanner />}

      <View className="px-4 pt-4 pb-2">
        <Text className="text-secondary text-2xl font-bold mb-1">
          MurGo
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          Delivering in Murcia
        </Text>

        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3"
          placeholder="Search restaurants or food..."
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...SUPPORTED_CITIES.slice(0, 6)]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                (item === 'All' && !selectedCity) || selectedCity === item
                  ? 'bg-primary'
                  : 'bg-white border border-gray-200'
              }`}
              onPress={() => setSelectedCity(item === 'All' ? undefined : item)}
            >
              <Text
                className={`text-sm ${
                  (item === 'All' && !selectedCity) || selectedCity === item
                    ? 'text-white font-medium'
                    : 'text-secondary'
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMerchant}
        contentContainerClassName="px-4 pb-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400">
              {isLoading ? 'Loading merchants...' : 'No merchants found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
