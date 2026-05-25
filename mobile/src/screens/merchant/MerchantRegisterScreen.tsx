import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { merchantsApi } from '../../api/services';
import { getLocationWithValidation } from '../../utils/location';
import { SUPPORTED_CITIES } from '../../constants/config';

interface Props {
  onRegistered: () => void;
}

export function MerchantRegisterScreen({ onRegistered }: Props) {
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bacolod City',
    latitude: 10.676,
    longitude: 122.951,
    openingTime: '08:00',
    closingTime: '22:00',
  });

  const register = useMutation({
    mutationFn: () => merchantsApi.register(form),
    onSuccess: () => {
      Alert.alert(
        'Registration Submitted',
        'Your merchant account is pending admin approval.',
        [{ text: 'OK', onPress: onRegistered }],
      );
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const useCurrentLocation = async () => {
    const result = await getLocationWithValidation();
    if (!result.valid || !result.coords) {
      Alert.alert(
        'Outside Service Area',
        result.message ?? 'Business must be in Murcia or Bacolod City',
      );
      return;
    }
    setForm((f) => ({
      ...f,
      latitude: result.coords!.latitude,
      longitude: result.coords!.longitude,
    }));
  };

  return (
    <ScrollView className="flex-1 bg-surface p-4">
      <Text className="text-secondary text-xl font-bold mb-2">
        Register Your Business
      </Text>
      <Text className="text-gray-500 mb-6">
        Business location must be within Murcia or Bacolod City
      </Text>

      {(
        [
          ['businessName', 'Business Name'],
          ['description', 'Description'],
          ['phone', 'Phone Number'],
          ['email', 'Email'],
          ['address', 'Street Address'],
        ] as const
      ).map(([key, label]) => (
        <View key={key} className="mb-3">
          <Text className="text-gray-600 text-sm mb-1">{label}</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3"
            value={form[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
            multiline={key === 'description'}
          />
        </View>
      ))}

      <Text className="text-gray-600 text-sm mb-2">City</Text>
      <ScrollView horizontal className="mb-4">
        {SUPPORTED_CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            className={`mr-2 px-3 py-2 rounded-full ${
              form.city === city ? 'bg-primary' : 'bg-white border border-gray-200'
            }`}
            onPress={() => setForm((f) => ({ ...f, city }))}
          >
            <Text className={form.city === city ? 'text-white text-sm' : 'text-secondary text-sm'}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        className="border border-primary rounded-xl py-3 mb-4"
        onPress={useCurrentLocation}
      >
        <Text className="text-primary text-center">Use Current Location</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-primary rounded-xl py-4"
        onPress={() => register.mutate()}
        disabled={register.isPending}
      >
        <Text className="text-white text-center font-semibold">
          {register.isPending ? 'Submitting...' : 'Submit Registration'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
