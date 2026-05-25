import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { addressesApi, usersApi } from '../../api/services';
import { getLocationWithValidation } from '../../utils/location';
import { Address } from '../../types';
import { SUPPORTED_CITIES } from '../../constants/config';

export function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    barangay: '',
    city: 'Bacolod City',
    latitude: 10.676,
    longitude: 122.951,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressesApi.list();
      return res.data as Address[];
    },
  });

  const addAddress = useMutation({
    mutationFn: () => addressesApi.create(addressForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddAddress(false);
      Alert.alert('Success', 'Address added');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const useCurrentLocation = async () => {
    const result = await getLocationWithValidation();
    if (!result.valid || !result.coords) {
      Alert.alert('Outside Service Area', result.message ?? 'Invalid location');
      return;
    }
    setAddressForm((f) => ({
      ...f,
      latitude: result.coords!.latitude,
      longitude: result.coords!.longitude,
    }));
  };

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="bg-secondary px-6 pt-12 pb-8">
        <Text className="text-white text-2xl font-bold">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text className="text-gray-300">{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-secondary text-lg font-semibold">Addresses</Text>
          <TouchableOpacity onPress={() => setShowAddAddress(!showAddAddress)}>
            <Text className="text-primary">{showAddAddress ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddAddress && (
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2"
              placeholder="Label (Home, Work)"
              value={addressForm.label}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, label: v }))}
            />
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2"
              placeholder="Street address"
              value={addressForm.street}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, street: v }))}
            />
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2"
              placeholder="Barangay"
              value={addressForm.barangay}
              onChangeText={(v) => setAddressForm((f) => ({ ...f, barangay: v }))}
            />
            <Text className="text-gray-500 text-sm mb-1">Barangay / area (Murcia or Bacolod)</Text>
            <ScrollView horizontal className="mb-3">
              {SUPPORTED_CITIES.slice(0, 8).map((city) => (
                <TouchableOpacity
                  key={city}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    addressForm.city === city ? 'bg-primary' : 'bg-gray-100'
                  }`}
                  onPress={() => setAddressForm((f) => ({ ...f, city }))}
                >
                  <Text
                    className={`text-xs ${
                      addressForm.city === city ? 'text-white' : 'text-secondary'
                    }`}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="border border-primary rounded-lg py-2 mb-3"
              onPress={useCurrentLocation}
            >
              <Text className="text-primary text-center text-sm">
                Use Current Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-primary rounded-lg py-3"
              onPress={() => addAddress.mutate()}
            >
              <Text className="text-white text-center font-medium">Save Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses?.map((addr) => (
          <View key={addr.id} className="bg-white rounded-xl p-4 mb-2">
            <Text className="text-secondary font-medium">{addr.label}</Text>
            <Text className="text-gray-500 text-sm">
              {addr.street}, {addr.city}
            </Text>
            {addr.isDefault && (
              <Text className="text-primary text-xs mt-1">Default</Text>
            )}
          </View>
        ))}

        <TouchableOpacity
          className="mt-8 border border-red-300 rounded-xl py-3"
          onPress={() => signOut()}
        >
          <Text className="text-red-500 text-center font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
