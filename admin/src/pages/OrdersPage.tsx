import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function OrdersPage() {
  useApiAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await adminApi.orders()).data,
  });

  if (isLoading) return <p>Loading orders...</p>;

  return (
    <div>
      <h2>Orders</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Merchant</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map(
            (o: {
              id: string;
              orderNumber: string;
              status: string;
              total: number;
              customer: { user: { firstName?: string; lastName?: string } };
              merchant: { businessName: string };
            }) => (
              <tr key={o.id}>
                <td>{o.orderNumber}</td>
                <td>
                  {o.customer.user.firstName} {o.customer.user.lastName}
                </td>
                <td>{o.merchant.businessName}</td>
                <td>{o.status}</td>
                <td>₱{o.total.toFixed(2)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
