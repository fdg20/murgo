import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function DashboardPage() {
  useApiAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminApi.dashboard()).data,
  });

  if (isLoading) return <p>Loading dashboard...</p>;

  const stats = [
    { label: 'Customers', value: data?.totalCustomers ?? 0 },
    { label: 'Merchants', value: data?.totalMerchants ?? 0 },
    { label: 'Riders', value: data?.totalRiders ?? 0 },
    { label: 'Total Orders', value: data?.totalOrders ?? 0 },
    { label: 'Delivered', value: data?.deliveredOrders ?? 0 },
    { label: 'Pending Merchants', value: data?.pendingMerchants ?? 0 },
    {
      label: 'Revenue',
      value: `₱${(data?.totalRevenue ?? 0).toLocaleString()}`,
    },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="subtitle">MurGo — Murcia delivery overview</p>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
