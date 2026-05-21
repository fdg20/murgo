import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { MerchantDetailScreen } from '../screens/customer/MerchantDetailScreen';
import { CheckoutScreen } from '../screens/customer/CheckoutScreen';
import { OrdersScreen, OrderTrackingScreen } from '../screens/customer/OrdersScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { MerchantRegisterScreen } from '../screens/merchant/MerchantRegisterScreen';
import { MerchantDashboardScreen } from '../screens/merchant/MerchantDashboardScreen';
import { RiderDashboardScreen } from '../screens/rider/RiderDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Orders: '📦',
    Profile: '👤',
    Dashboard: '📊',
    Deliveries: '🛵',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

function CustomerTabs({ navigation }: { navigation: { navigate: (screen: string, params?: object) => void } }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#E63946',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeScreen
            onMerchantPress={(id) =>
              navigation.navigate('MerchantDetail', { merchantId: id })
            }
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Orders">
        {() => (
          <OrdersScreen
            onOrderPress={(id) =>
              navigation.navigate('OrderTracking', { orderId: id })
            }
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function CustomerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomerTabs"
        component={CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MerchantDetail"
        options={{ title: 'Menu' }}
      >
        {({ navigation, route }) => (
          <MerchantDetailScreen
            merchantId={(route.params as { merchantId: string }).merchantId}
            onCheckout={() => navigation.navigate('Checkout')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Checkout" options={{ title: 'Checkout' }}>
        {({ navigation }) => (
          <CheckoutScreen
            onOrderPlaced={(orderId) => {
              navigation.navigate('OrderTracking', { orderId });
            }}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="OrderTracking"
        options={{ title: 'Track Order' }}
      >
        {({ route }) => (
          <OrderTrackingScreen
            orderId={(route.params as { orderId: string }).orderId}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export function MerchantNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MerchantRegister"
        options={{ title: 'Register Business' }}
      >
        {({ navigation }) => (
          <MerchantRegisterScreen
            onRegistered={() => navigation.replace('MerchantDashboard')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MerchantDashboard"
        component={MerchantDashboardScreen}
        options={{ title: 'Merchant Dashboard', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export function RiderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RiderDashboard"
        component={RiderDashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
