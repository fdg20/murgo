import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './App.css';

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const apiUrl = import.meta.env.VITE_API_URL;

function ConfigError({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#1d3557',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          background: '#fff',
          color: '#212529',
          padding: 32,
          borderRadius: 16,
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>{title}</h1>
        <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>{detail}</p>
        <pre
          style={{
            background: '#f8f9fa',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            overflow: 'auto',
          }}
        >
          {`cd admin
copy .env.example .env
# Set VITE_CLERK_PUBLISHABLE_KEY (same as mobile/backend)
# Set VITE_API_URL=http://localhost:3000/api
npm run dev`}
        </pre>
      </div>
    </div>
  );
}

const root = document.getElementById('root')!;

if (!clerkKey) {
  createRoot(root).render(
    <ConfigError
      title="MurGo Admin — missing Clerk key"
      detail="Create admin/.env with VITE_CLERK_PUBLISHABLE_KEY from your Clerk dashboard (same key as the mobile app)."
    />,
  );
} else if (!apiUrl) {
  createRoot(root).render(
    <ConfigError
      title="MurGo Admin — missing API URL"
      detail="Add VITE_API_URL=http://localhost:3000/api to admin/.env and ensure the backend is running."
    />,
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkKey}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    </StrictMode>,
  );
}
