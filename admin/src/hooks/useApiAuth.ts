import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/client';

export function useApiAuth() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      return;
    }
    getToken().then((token) => setAuthToken(token));
  }, [getToken, isSignedIn]);
}
