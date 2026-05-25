import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function CustomersPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await adminApi.customers()).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-customers'] });

  const suspend = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.suspendUser(id, isActive),
    onSuccess: invalidate,
  });

  const createCustomer = useMutation({
    mutationFn: () => adminApi.createCustomer(email),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setEmail('');
      setError(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Could not add customer');
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => adminApi.deleteCustomer(id),
    onSuccess: (res) => {
      invalidate();
      alert(res.data.message);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Could not remove customer');
    },
  });

  if (isLoading) return <p>Loading customers...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p className="subtitle">Add, suspend, or remove customer accounts</p>
        </div>
        <button onClick={() => { setShowAdd(true); setError(null); }}>
          + Add customer
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add customer</h3>
            <p className="hint">
              User must already have signed up in the app. Enter their email to
              create a customer profile.
            </p>
            <input
              placeholder="User email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div className="modal-actions">
              <button
                onClick={() => createCustomer.mutate()}
                disabled={createCustomer.isPending || !email.trim()}
              >
                {createCustomer.isPending ? 'Adding…' : 'Add customer'}
              </button>
              <button className="btn-muted" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          {customers?.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                No customers yet
              </td>
            </tr>
          )}
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
                <td className="actions">
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
                  <button
                    className="danger"
                    onClick={() => {
                      if (
                        confirm(
                          `Remove ${c.user.email}? If they have orders, they will be suspended instead.`,
                        )
                      ) {
                        deleteCustomer.mutate(c.id);
                      }
                    }}
                  >
                    Remove
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
