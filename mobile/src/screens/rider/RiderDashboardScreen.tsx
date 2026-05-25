import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ridersApi } from '../../api/services';
import { emitRiderLocation } from '../../api/socket';
import { validateServiceArea } from '../../utils/location';
import { Screen } from '../../components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function RiderDashboardScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { data: earnings } = useQuery({
    queryKey: ['rider-earnings'],
    queryFn: async () => {
      const res = await ridersApi.getEarnings();
      return res.data;
    },
  });

  const { data: availableOrders, refetch } = useQuery({
    queryKey: ['rider-available-orders'],
    queryFn: async () => {
      const res = await ridersApi.getAvailableOrders();
      return res.data;
    },
    enabled: isOnline && !activeOrderId,
    refetchInterval: 10000,
  });

  const { data: history } = useQuery({
    queryKey: ['rider-history'],
    queryFn: async () => {
      const res = await ridersApi.getHistory();
      return res.data;
    },
  });

  const toggleOnline = useMutation({
    mutationFn: async (online: boolean) => {
      await ridersApi.setStatus(online ? 'ONLINE' : 'OFFLINE');
      setIsOnline(online);
    },
  });

  const acceptOrder = useMutation({
    mutationFn: (orderId: string) => ridersApi.acceptOrder(orderId),
    onSuccess: (res) => {
      setActiveOrderId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['rider-available-orders'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ridersApi.updateOrderStatus(orderId, status),
    onSuccess: (_, { status }) => {
      if (status === 'DELIVERED') {
        setActiveOrderId(null);
        queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
      }
    },
  });

  useEffect(() => {
    if (!isOnline) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          const validation = await validateServiceArea(latitude, longitude);
          if (!validation.valid) {
            Alert.alert('Outside Service Area', validation.message);
            toggleOnline.mutate(false);
            return;
          }

          setCurrentLocation({ latitude, longitude });
          await ridersApi.updateLocation(latitude, longitude);

          if (activeOrderId) {
            emitRiderLocation({
              orderId: activeOrderId,
              latitude,
              longitude,
              heading: loc.coords.heading ?? undefined,
            });
            await ridersApi.trackLocation(
              activeOrderId,
              latitude,
              longitude,
              loc.coords.heading ?? undefined,
            );
          }
        },
      );
    })();

    return () => subscription?.remove();
  }, [isOnline, activeOrderId]);

  const activeOrder = history?.find(
    (o: { id: string; status: string }) =>
      o.id === activeOrderId && o.status !== 'DELIVERED',
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="bg-secondary px-4 pt-2 pb-4">
        <Text className="text-white text-xl font-bold">Rider Dashboard</Text>
        <View className="flex-row justify-between items-center mt-3">
          <View>
            <Text className="text-white text-2xl font-bold">
              ₱{(earnings?.totalEarnings ?? 0).toFixed(2)}
            </Text>
            <Text className="text-gray-300 text-sm">
              {earnings?.totalDeliveries ?? 0} deliveries
            </Text>
          </View>
          <TouchableOpacity
            className={`px-6 py-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
            onPress={() => toggleOnline.mutate(!isOnline)}
          >
            <Text className="text-white font-semibold">
              {isOnline ? 'Online' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentLocation && (
        <MapView
          className="h-48"
          region={{
            ...currentLocation,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker coordinate={currentLocation} title="You" />
        </MapView>
      )}

      {activeOrder ? (
        <View className="p-4">
          <Text className="text-secondary font-bold text-lg mb-2">
            Active Delivery
          </Text>
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-secondary font-medium">
              {activeOrder.orderNumber}
            </Text>
            <Text className="text-gray-500">
              {activeOrder.merchant?.businessName}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {activeOrder.address?.street}, {activeOrder.address?.city}
            </Text>
            <View className="flex-row mt-3 gap-2">
              {activeOrder.status === 'RIDER_ASSIGNED' && (
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                  onPress={() =>
                    updateStatus.mutate({
                      orderId: activeOrder.id,
                      status: 'PICKED_UP',
                    })
                  }
                >
                  <Text className="text-white">Picked Up</Text>
                </TouchableOpacity>
              )}
              {activeOrder.status === 'PICKED_UP' && (
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-lg"
                  onPress={() =>
                    updateStatus.mutate({
                      orderId: activeOrder.id,
                      status: 'IN_TRANSIT',
                    })
                  }
                >
                  <Text className="text-white">Start Delivery</Text>
                </TouchableOpacity>
              )}
              {activeOrder.status === 'IN_TRANSIT' && (
                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg"
                  onPress={() =>
                    updateStatus.mutate({
                      orderId: activeOrder.id,
                      status: 'DELIVERED',
                    })
                  }
                >
                  <Text className="text-white">Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Text className="text-secondary font-semibold mb-3">
            Available Deliveries
          </Text>
          <FlatList
            data={availableOrders ?? []}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            keyExtractor={(item: { id: string }) => item.id}
            renderItem={({ item }: { id: string; orderNumber: string; deliveryFee: number; merchant: { businessName: string }; address: { city: string } }) => (
              <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
                <Text className="text-secondary font-medium">
                  {item.orderNumber}
                </Text>
                <Text className="text-gray-500">{item.merchant?.businessName}</Text>
                <Text className="text-gray-400 text-sm">{item.address?.city}</Text>
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-primary font-bold">
                    ₱{item.deliveryFee.toFixed(2)} fee
                  </Text>
                  <TouchableOpacity
                    className="bg-primary px-4 py-2 rounded-lg"
                    onPress={() => acceptOrder.mutate(item.id)}
                  >
                    <Text className="text-white font-medium">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-gray-400 text-center py-10">
                {isOnline
                  ? 'No deliveries available right now'
                  : 'Go online to see deliveries'}
              </Text>
            }
            onRefresh={refetch}
            refreshing={false}
          />
        </View>
      )}
    </Screen>
  );
}
