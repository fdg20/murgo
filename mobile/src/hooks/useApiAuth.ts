import { useLayoutEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setAuthToken, setTokenGetter } from '../api/client';

export function useApiAuth() {
  const { getToken, isSignedIn } = useAuth();

  useLayoutEffect(() => {
    if (!isSignedIn) {
      setTokenGetter(null);
      setAuthToken(null);
      return;
    }

    setTokenGetter(getToken);
  }, [getToken, isSignedIn]);
}
