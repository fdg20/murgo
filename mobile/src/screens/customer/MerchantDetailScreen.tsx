import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { merchantsApi } from '../../api/services';
import { useCartStore } from '../../store';
import { Product } from '../../types';

interface Props {
  merchantId: string;
  onCheckout: () => void;
}

export function MerchantDetailScreen({ merchantId, onCheckout }: Props) {
  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: async () => {
      const res = await merchantsApi.getOne(merchantId);
      return res.data;
    },
  });

  const { items, addItem, subtotal } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (product: Product) => {
    if (!merchant) return;
    if (product.stock <= 0) {
      Alert.alert('Out of stock', 'This item is currently unavailable');
      return;
    }
    addItem(merchant.id, merchant.businessName, {
      productId: product.id,
      name: product.name,
      price: product.discountPrice ?? product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  };

  if (isLoading || !merchant) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-secondary text-xl font-bold">
          {merchant.businessName}
        </Text>
        <Text className="text-gray-500">{merchant.city}</Text>
        {merchant.description && (
          <Text className="text-gray-400 text-sm mt-1">{merchant.description}</Text>
        )}
      </View>

      <FlatList
        data={merchant.products ?? []}
        keyExtractor={(item: Product) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }: { item: Product }) => (
          <View className="bg-white rounded-xl p-4 mb-3 flex-row border border-gray-100">
            <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-4">
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="w-full h-full rounded-lg" />
              ) : (
                <Text className="text-2xl">🍗</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-secondary font-semibold">{item.name}</Text>
              {item.description && (
                <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center">
                  {item.discountPrice ? (
                    <>
                      <Text className="text-primary font-bold">
                        ₱{item.discountPrice}
                      </Text>
                      <Text className="text-gray-400 line-through ml-2 text-sm">
                        ₱{item.price}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-primary font-bold">₱{item.price}</Text>
                  )}
                </View>
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-lg"
                  onPress={() => addToCart(item)}
                >
                  <Text className="text-white font-medium text-sm">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 py-10">No products available</Text>
        }
      />

      {cartCount > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 left-4 right-4 bg-primary rounded-xl py-4 flex-row justify-between px-6"
          onPress={onCheckout}
        >
          <Text className="text-white font-semibold">{cartCount} items</Text>
          <Text className="text-white font-semibold">
            View Cart · ₱{subtotal().toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
