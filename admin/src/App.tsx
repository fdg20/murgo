import { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { DashboardPage } from './pages/DashboardPage';
import { MerchantsPage } from './pages/MerchantsPage';
import { CustomersPage } from './pages/CustomersPage';
import { RidersPage } from './pages/RidersPage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminGate } from './components/AdminGate';

function Sidebar() {
  const location = useLocation();
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/merchants', label: 'Merchants' },
    { to: '/customers', label: 'Customers' },
    { to: '/riders', label: 'Riders' },
    { to: '/orders', label: 'Orders' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/murgo-logo.png" alt="MurGo" className="brand-logo" />
        <div>
          <h1>MurGo</h1>
          <p>Admin Panel</p>
        </div>
      </div>
      <nav>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="service-note">Service area: Murcia, Negros Occidental only</p>
    </aside>
  );
}

function AdminLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/merchants" element={<MerchantsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/murgo-logo.png" alt="MurGo" className="auth-logo" />
        <h1>MurGo Admin</h1>
        <p>
          {mode === 'signin'
            ? 'Sign in with your admin account'
            : 'Create your account, then run promote-admin for access'}
        </p>
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>
        {mode === 'signin' ? (
          <SignIn routing="hash" signUpUrl="#/signup" />
        ) : (
          <SignUp routing="hash" signInUrl="#/signin" />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedOut>
        <AuthPage />
      </SignedOut>
      <SignedIn>
        <AdminGate>
          <AdminLayout />
        </AdminGate>
      </SignedIn>
    </>
  );
}
