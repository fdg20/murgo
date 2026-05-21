import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/services';
import { joinOrderRoom, onOrderStatus, onRiderLocation } from '../../api/socket';
import { Order } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  RIDER_ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface Props {
  onOrderPress: (orderId: string) => void;
}

export function OrdersScreen({ onOrderPress }: Props) {
  const { data: orders, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await ordersApi.list();
      return res.data as Order[];
    },
  });

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-secondary text-xl font-bold">My Orders</Text>
      </View>
      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        onRefresh={refetch}
        refreshing={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
            onPress={() => onOrderPress(item.id)}
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-secondary font-semibold">
                {item.merchant?.businessName}
              </Text>
              <Text className="text-primary text-sm font-medium">
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs mb-1">{item.orderNumber}</Text>
            <Text className="text-gray-500 text-sm">
              {item.items.length} items · ₱{item.total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 py-20">No orders yet</Text>
        }
      />
    </View>
  );
}

interface TrackingProps {
  orderId: string;
}

export function OrderTrackingScreen({ orderId }: TrackingProps) {
  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [status, setStatus] = useState<string>('');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersApi.getOne(orderId);
      return res.data as Order;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    joinOrderRoom(orderId);
    const unsubStatus = onOrderStatus((data) => {
      if (data.orderId === orderId) setStatus(data.status);
    });
    const unsubLocation = onRiderLocation((data) => {
      if (data.orderId === orderId) {
        setRiderLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    });
    return () => {
      unsubStatus();
      unsubLocation();
    };
  }, [orderId]);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading order...</Text>
      </View>
    );
  }

  const currentStatus = status || order.status;
  const destLat = order.address?.latitude ?? 10.676;
  const destLng = order.address?.longitude ?? 122.951;

  return (
    <View className="flex-1 bg-surface">
      <View className="p-4 bg-white border-b border-gray-100">
        <Text className="text-secondary text-lg font-bold">
          {STATUS_LABELS[currentStatus] ?? currentStatus}
        </Text>
        <Text className="text-gray-500">{order.orderNumber}</Text>
        {order.estimatedEta && currentStatus === 'IN_TRANSIT' && (
          <Text className="text-primary mt-1">ETA: ~{order.estimatedEta} min</Text>
        )}
      </View>

      <MapView
        className="flex-1"
        initialRegion={{
          latitude: destLat,
          longitude: destLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{ latitude: destLat, longitude: destLng }}
          title="Delivery Address"
          pinColor="#E63946"
        />
        {riderLocation && (
          <Marker
            coordinate={riderLocation}
            title="Rider"
            pinColor="#1D3557"
          />
        )}
      </MapView>

      <View className="p-4 bg-white">
        <Text className="text-secondary font-semibold mb-2">Order Summary</Text>
        {order.items.map((item) => (
          <Text key={item.id} className="text-gray-500 text-sm">
            {item.quantity}x {item.name} — ₱{(item.price * item.quantity).toFixed(2)}
          </Text>
        ))}
        <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between">
          <Text className="font-bold">Total</Text>
          <Text className="font-bold text-primary">₱{order.total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}
