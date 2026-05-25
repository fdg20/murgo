import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addressesApi, ordersApi } from '../../api/services';
import { useCartStore } from '../../store';
import { Address, CheckoutPreview } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onOrderPlaced: (orderId: string) => void;
  onBack: () => void;
}

export function CheckoutScreen({ onOrderPlaced, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { merchantId, items, promoCode, setPromoCode, clearCart } = useCartStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressesApi.list();
      return res.data as Address[];
    },
  });

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  const loadPreview = async (addressId: string) => {
    if (!merchantId) return;
    setLoadingPreview(true);
    try {
      const res = await ordersApi.preview({
        merchantId,
        addressId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        promoCode: promoCode || undefined,
      });
      setPreview(res.data);
      setSelectedAddressId(addressId);
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!merchantId || !selectedAddressId) throw new Error('Select an address');
      const res = await ordersApi.create({
        merchantId,
        addressId: selectedAddressId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        promoCode: promoCode || undefined,
      });
      return res.data;
    },
    onSuccess: (order) => {
      clearCart();
      onOrderPlaced(order.id);
    },
    onError: (err: Error) => Alert.alert('Order Failed', err.message),
  });

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <View className="p-4">
        <Text className="text-secondary text-xl font-bold mb-4">Checkout</Text>

        <Text className="text-secondary font-semibold mb-2">Order Items</Text>
        {items.map((item) => (
          <View
            key={item.productId}
            className="bg-white rounded-xl p-3 mb-2 flex-row justify-between"
          >
            <Text className="text-secondary">
              {item.quantity}x {item.name}
            </Text>
            <Text className="text-secondary font-medium">
              ₱{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        <Text className="text-secondary font-semibold mt-4 mb-2">
          Delivery Address
        </Text>
        {addresses?.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            className={`bg-white rounded-xl p-4 mb-2 border-2 ${
              selectedAddressId === addr.id ? 'border-primary' : 'border-transparent'
            }`}
            onPress={() => loadPreview(addr.id)}
          >
            <Text className="text-secondary font-medium">{addr.label}</Text>
            <Text className="text-gray-500 text-sm">
              {addr.street}, {addr.city}
            </Text>
          </TouchableOpacity>
        ))}

        {!addresses?.length && (
          <Text className="text-gray-400 mb-4">
            Add a delivery address in your profile first.
          </Text>
        )}

        <Text className="text-secondary font-semibold mt-4 mb-2">Promo Code</Text>
        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 mr-2"
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
          {selectedAddressId && (
            <TouchableOpacity
              className="bg-secondary px-4 rounded-xl justify-center"
              onPress={() => loadPreview(selectedAddressId)}
            >
              <Text className="text-white">Apply</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingPreview && <ActivityIndicator color="#E63946" />}

        {preview && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Subtotal</Text>
              <Text>₱{preview.subtotal.toFixed(2)}</Text>
            </View>
            {preview.discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Discount</Text>
                <Text className="text-green-600">-₱{preview.discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">
                Delivery Fee ({preview.distanceKm} km)
              </Text>
              <Text>₱{preview.deliveryFee.toFixed(2)}</Text>
            </View>
            <View className="border-t border-gray-100 pt-2 flex-row justify-between">
              <Text className="text-secondary font-bold text-lg">Total</Text>
              <Text className="text-primary font-bold text-lg">
                ₱{preview.total.toFixed(2)}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              Estimated delivery: ~{preview.estimatedEta} minutes
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-xl py-4 mb-4 ${
            preview && selectedAddressId ? 'bg-primary' : 'bg-gray-300'
          }`}
          disabled={!preview || !selectedAddressId || placeOrder.isPending}
          onPress={() => placeOrder.mutate()}
        >
          <Text className="text-white text-center font-semibold text-base">
            {placeOrder.isPending ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack}>
          <Text className="text-primary text-center">Back to menu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
