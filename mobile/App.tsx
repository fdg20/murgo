import './global.css';
import { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { API_URL, CLERK_PUBLISHABLE_KEY } from './src/constants/config';
import { getFreshAuthToken, setAuthToken } from './src/api/client';
import { connectSocket, disconnectSocket } from './src/api/socket';
import { useApiAuth } from './src/hooks/useApiAuth';
import { BootScreen } from './src/components/BootScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { RoleSelectScreen } from './src/screens/auth/RoleSelectScreen';
import { AdminMobileScreen } from './src/screens/auth/AdminMobileScreen';
import {
  CustomerNavigator,
  MerchantNavigator,
  RiderNavigator,
} from './src/navigation/AppNavigator';
import { usersApi } from './src/api/services';
import { UserRole } from './src/types';
import { withTimeout } from './src/utils/timeout';

const CLERK_BOOT_MS = 15000;
const PROFILE_BOOT_MS = 10000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

function AppRoot() {
  const { isSignedIn, isLoaded } = useAuth();
  useApiAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [needsRoleSelect, setNeedsRoleSelect] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [clerkSlow, setClerkSlow] = useState(false);
  const [bootKey, setBootKey] = useState(0);

  useEffect(() => {
    if (isLoaded) {
      setClerkSlow(false);
      return;
    }
    const t = setTimeout(() => setClerkSlow(true), CLERK_BOOT_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const loadSignedInUser = useCallback(async () => {
    setLoadingRole(true);
    setBootError(null);

    try {
      const token = await withTimeout(
        getFreshAuthToken(),
        PROFILE_BOOT_MS,
        'Sign-in',
      );
      if (token) {
        try {
          connectSocket(token);
        } catch {
          // optional
        }
      }

      const res = await usersApi.getProfile();
      const userRole = res.data.role as UserRole;
      if (userRole) {
        setRole(userRole);
        setNeedsRoleSelect(false);
      } else {
        setNeedsRoleSelect(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load profile';
      const isLocalApi =
        API_URL.includes('localhost') ||
        API_URL.includes('127.0.0.1') ||
        /https?:\/\/192\.168\.|https?:\/\/10\.|https?:\/\/172\.(1[6-9]|2\d|3[01])\./.test(
          API_URL,
        );
      setBootError(
        message.includes('timed out') || message.includes('Network')
          ? isLocalApi
            ? `Cannot reach API at ${API_URL}. For local dev: same Wi‑Fi as your PC, backend running, and EXPO_PUBLIC_API_URL set to your PC IP. For live Render: use https://YOUR-SERVICE.onrender.com/api in mobile/.env, redeploy API, then restart Expo.`
            : `Cannot reach API at ${API_URL}. Check Render is awake (open the URL in a browser), DATABASE_URL on Render, and mobile/.env uses https (not http). First request after sleep can take ~30s.`
          : message,
      );
      setNeedsRoleSelect(true);
    } finally {
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthToken(null);
      disconnectSocket();
      setRole(null);
      setBootError(null);
      setNeedsRoleSelect(false);
      setLoadingRole(false);
      return;
    }

    loadSignedInUser();
  }, [isSignedIn, isLoaded, loadSignedInUser, bootKey]);

  const handleRoleSelect = async (selectedRole: UserRole) => {
    setLoadingRole(true);
    setBootError(null);
    try {
      await usersApi.setRole(selectedRole);
      setRole(selectedRole);
      setNeedsRoleSelect(false);
    } catch (err: unknown) {
      setBootError(err instanceof Error ? err.message : 'Could not set role');
    } finally {
      setLoadingRole(false);
    }
  };

  if (!isLoaded) {
    if (clerkSlow) {
      return (
        <BootScreen
          message="MurGo is taking too long to start"
          hint="Force-close Expo Go, run: npx expo start --tunnel -c, then scan the new QR code. Check EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env."
          onRetry={() => {
            setClerkSlow(false);
            setBootKey((k) => k + 1);
          }}
        />
      );
    }
    return <BootScreen message="Starting MurGo…" />;
  }

  if (isSignedIn && loadingRole) {
    return <BootScreen message="Loading your account…" />;
  }

  if (!isSignedIn) {
    return <AuthScreen onAuthenticated={() => setBootKey((k) => k + 1)} />;
  }

  if (role === 'ADMIN') {
    return <AdminMobileScreen />;
  }

  if (bootError && needsRoleSelect) {
    return (
      <RoleSelectScreen
        onSelectRole={handleRoleSelect}
        errorMessage={bootError}
      />
    );
  }

  if (needsRoleSelect || !role) {
    return <RoleSelectScreen onSelectRole={handleRoleSelect} />;
  }

  return (
    <NavigationContainer>
      {role === 'CUSTOMER' && <CustomerNavigator />}
      {role === 'MERCHANT' && <MerchantNavigator />}
      {role === 'RIDER' && <RiderNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <BootScreen message="Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env" />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            <AppRoot />
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
