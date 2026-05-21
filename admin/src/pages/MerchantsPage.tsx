import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function MerchantsPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async () => (await adminApi.merchants()).data,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateMerchantStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
  });

  if (isLoading) return <p>Loading merchants...</p>;

  return (
    <div>
      <h2>Merchant Management</h2>
      <p className="subtitle">Approve or suspend merchants in Murcia</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>City</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {merchants?.map(
            (m: {
              id: string;
              businessName: string;
              city: string;
              status: string;
            }) => (
              <tr key={m.id}>
                <td>{m.businessName}</td>
                <td>{m.city}</td>
                <td>
                  <span className={`badge badge-${m.status.toLowerCase()}`}>
                    {m.status}
                  </span>
                </td>
                <td className="actions">
                  {m.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() =>
                          updateStatus.mutate({ id: m.id, status: 'APPROVED' })
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="danger"
                        onClick={() =>
                          updateStatus.mutate({ id: m.id, status: 'REJECTED' })
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {m.status === 'APPROVED' && (
                    <button
                      className="danger"
                      onClick={() =>
                        updateStatus.mutate({ id: m.id, status: 'SUSPENDED' })
                      }
                    >
                      Suspend
                    </button>
                  )}
                  {m.status === 'SUSPENDED' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: m.id, status: 'APPROVED' })
                      }
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
