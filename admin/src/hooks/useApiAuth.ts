import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken, setTokenGetter } from '../api/client';

export function useApiAuth() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      setTokenGetter(null);
      return;
    }

    setTokenGetter(() => getToken());
    getToken().then((token) => setAuthToken(token ?? null));
  }, [getToken, isSignedIn]);
}
