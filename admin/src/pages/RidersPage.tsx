import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function RidersPage() {
  useApiAuth();
  const { data: riders, isLoading } = useQuery({
    queryKey: ['admin-riders'],
    queryFn: async () => (await adminApi.riders()).data,
  });

  if (isLoading) return <p>Loading riders...</p>;

  return (
    <div>
      <h2>Riders</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Deliveries</th>
            <th>Earnings</th>
          </tr>
        </thead>
        <tbody>
          {riders?.map(
            (r: {
              id: string;
              vehicleType: string;
              status: string;
              totalDeliveries: number;
              totalEarnings: number;
              user: { firstName?: string; lastName?: string };
            }) => (
              <tr key={r.id}>
                <td>
                  {r.user.firstName} {r.user.lastName}
                </td>
                <td>{r.vehicleType}</td>
                <td>{r.status}</td>
                <td>{r.totalDeliveries}</td>
                <td>₱{r.totalEarnings.toFixed(2)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
