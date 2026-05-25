import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  merchantsApi,
  productsApi,
} from '../../api/services';
import { Screen } from '../../components/Screen';

export function MerchantDashboardScreen() {
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '10',
  });

  const { data: profile } = useQuery({
    queryKey: ['merchant-profile'],
    queryFn: async () => {
      const res = await merchantsApi.getProfile();
      return res.data;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['merchant-analytics'],
    queryFn: async () => {
      const res = await merchantsApi.getAnalytics();
      return res.data;
    },
  });

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: async () => {
      const res = await merchantsApi.getOrders();
      return res.data;
    },
    refetchInterval: 15000,
  });

  const createProduct = useMutation({
    mutationFn: () =>
      productsApi.create({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      setShowAddProduct(false);
      setProductForm({ name: '', description: '', price: '', stock: '10' });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      merchantsApi.updateOrderStatus(orderId, status),
    onSuccess: () => refetchOrders(),
  });

  if (profile?.status === 'PENDING') {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-surface">
        <Text className="text-secondary text-xl font-bold mb-2">
          Pending Approval
        </Text>
        <Text className="text-gray-500 text-center">
          Your merchant account is awaiting admin approval.
        </Text>
      </View>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="bg-secondary px-4 pt-2 pb-6">
        <Text className="text-white text-xl font-bold">
          {profile?.businessName}
        </Text>
        <Text className="text-gray-300">{profile?.city}</Text>
        <View className="flex-row mt-4 gap-4">
          <View className="bg-white/10 rounded-xl p-3 flex-1">
            <Text className="text-white text-lg font-bold">
              {analytics?.totalOrders ?? 0}
            </Text>
            <Text className="text-gray-300 text-xs">Total Orders</Text>
          </View>
          <View className="bg-white/10 rounded-xl p-3 flex-1">
            <Text className="text-white text-lg font-bold">
              ₱{(analytics?.totalRevenue ?? 0).toFixed(0)}
            </Text>
            <Text className="text-gray-300 text-xs">Revenue</Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-secondary font-semibold text-lg">Products</Text>
          <TouchableOpacity onPress={() => setShowAddProduct(!showAddProduct)}>
            <Text className="text-primary">{showAddProduct ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddProduct && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2"
              placeholder="Product name"
              value={productForm.name}
              onChangeText={(v) => setProductForm((f) => ({ ...f, name: v }))}
            />
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2"
              placeholder="Price"
              keyboardType="decimal-pad"
              value={productForm.price}
              onChangeText={(v) => setProductForm((f) => ({ ...f, price: v }))}
            />
            <TouchableOpacity
              className="bg-primary rounded-lg py-3"
              onPress={() => createProduct.mutate()}
            >
              <Text className="text-white text-center">Save Product</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={profile?.products ?? []}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item }: { item: { id: string; name: string; price: number; stock: number } }) => (
            <View className="bg-white rounded-xl p-3 mb-2 flex-row justify-between">
              <View>
                <Text className="text-secondary font-medium">{item.name}</Text>
                <Text className="text-gray-400 text-sm">Stock: {item.stock}</Text>
              </View>
              <Text className="text-primary font-bold">₱{item.price}</Text>
            </View>
          )}
          ListHeaderComponent={
            <Text className="text-secondary font-semibold text-lg mb-3 mt-4">
              Incoming Orders
            </Text>
          }
          ListFooterComponent={
            <FlatList
              data={orders ?? []}
              keyExtractor={(item: { id: string }) => item.id}
              scrollEnabled={false}
              renderItem={({ item }: { id: string; orderNumber: string; status: string; total: number }) => (
                <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
                  <Text className="text-secondary font-medium">{item.orderNumber}</Text>
                  <Text className="text-gray-500">₱{item.total.toFixed(2)} · {item.status}</Text>
                  <View className="flex-row mt-2 gap-2">
                    {item.status === 'PENDING' && (
                      <TouchableOpacity
                        className="bg-green-500 px-3 py-1 rounded-lg"
                        onPress={() =>
                          updateOrderStatus.mutate({
                            orderId: item.id,
                            status: 'CONFIRMED',
                          })
                        }
                      >
                        <Text className="text-white text-sm">Confirm</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'CONFIRMED' && (
                      <TouchableOpacity
                        className="bg-blue-500 px-3 py-1 rounded-lg"
                        onPress={() =>
                          updateOrderStatus.mutate({
                            orderId: item.id,
                            status: 'PREPARING',
                          })
                        }
                      >
                        <Text className="text-white text-sm">Preparing</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'PREPARING' && (
                      <TouchableOpacity
                        className="bg-primary px-3 py-1 rounded-lg"
                        onPress={() =>
                          updateOrderStatus.mutate({
                            orderId: item.id,
                            status: 'READY_FOR_PICKUP',
                          })
                        }
                      >
                        <Text className="text-white text-sm">Ready</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text className="text-gray-400 text-center py-4">No orders yet</Text>
              }
            />
          }
        />
      </View>
    </Screen>
  );
}
