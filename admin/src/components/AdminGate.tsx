import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { setAuthToken, api } from '../api/client';

interface Props {
  children: React.ReactNode;
}

export function AdminGate({ children }: Props) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied' | 'error'>(
    'loading',
  );
  const [email, setEmail] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthToken(null);
      setStatus('loading');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        if (cancelled) return;
        setAuthToken(token ?? null);

        if (!token) {
          setStatus('error');
          setErrorDetail('Could not get a session token from Clerk. Try signing out and back in.');
          return;
        }

        const res = await api.get<{ role: string; email: string }>('/users/me');
        if (cancelled) return;

        if (res.data.role === 'ADMIN') {
          setStatus('admin');
          return;
        }
        setEmail(res.data.email);
        setStatus('denied');
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const msg =
          ax.response?.data?.message ??
          ax.message ??
          'Could not reach the MurGo API';
        setErrorDetail(
          ax.response?.status === 401
            ? `${msg} — Is the backend running at ${import.meta.env.VITE_API_URL}?`
            : msg,
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn, isLoaded]);

  if (!isLoaded || (isSignedIn && status === 'loading')) {
    return (
      <div className="auth-page">
        <p style={{ color: '#fff', fontSize: 18 }}>Checking admin access...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/murgo-logo.png" alt="MurGo" className="auth-logo" />
          <h1>Connection problem</h1>
          <p>{errorDetail}</p>
          <p className="hint">
            Start the API: <code>cd backend &amp;&amp; npm run start:dev</code>
          </p>
          <button type="button" className="btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/murgo-logo.png" alt="MurGo" className="auth-logo" />
          <h1>Access denied</h1>
          <p>
            {email
              ? `${email} is signed in but does not have admin permissions.`
              : 'This account does not have admin permissions.'}
          </p>
          <p className="hint">
            In the backend folder run: <code>npm run promote-admin -- your@email.com</code>
          </p>
          <button type="button" className="btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
