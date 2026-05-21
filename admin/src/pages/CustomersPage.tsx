import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function CustomersPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await adminApi.customers()).data,
  });

  const suspend = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.suspendUser(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  if (isLoading) return <p>Loading customers...</p>;

  return (
    <div>
      <h2>Customers</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers?.map(
            (c: {
              id: string;
              user: {
                id: string;
                firstName?: string;
                lastName?: string;
                email: string;
                isActive: boolean;
              };
              _count: { orders: number };
            }) => (
              <tr key={c.id}>
                <td>
                  {c.user.firstName} {c.user.lastName}
                </td>
                <td>{c.user.email}</td>
                <td>{c._count.orders}</td>
                <td>{c.user.isActive ? 'Active' : 'Suspended'}</td>
                <td>
                  <button
                    className={c.user.isActive ? 'danger' : ''}
                    onClick={() =>
                      suspend.mutate({
                        id: c.user.id,
                        isActive: !c.user.isActive,
                      })
                    }
                  >
                    {c.user.isActive ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
