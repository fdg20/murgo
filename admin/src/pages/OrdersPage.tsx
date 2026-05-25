import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
] as const;

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  notes?: string | null;
  riderId?: string | null;
  customer: { user: { firstName?: string; lastName?: string } };
  merchant: { businessName: string };
  rider?: {
    id: string;
    user: { firstName?: string; lastName?: string };
  } | null;
};

type Rider = {
  id: string;
  user: { firstName?: string; lastName?: string; email: string };
  status: string;
};

export function OrdersPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [riderPick, setRiderPick] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: orders, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await adminApi.orders()).data as Order[],
  });

  const { data: riders } = useQuery({
    queryKey: ['admin-riders'],
    queryFn: async () => (await adminApi.riders()).data as Rider[],
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

  const showError = (err: unknown) => {
    setSuccess(null);
    setError(err instanceof Error ? err.message : 'Something went wrong');
  };

  const showSuccess = (msg: string) => {
    setError(null);
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      invalidate();
      showSuccess('Order status updated');
    },
    onError: showError,
  });

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      adminApi.updateOrder(id, { notes }),
    onSuccess: () => {
      invalidate();
      setEditingNotes(null);
      showSuccess('Notes saved');
    },
    onError: showError,
  });

  const assignRider = useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      adminApi.assignRider(orderId, riderId),
    onSuccess: () => {
      invalidate();
      showSuccess('Rider assigned — customer can track on the map');
    },
    onError: showError,
  });

  const simulateLocation = useMutation({
    mutationFn: ({
      orderId,
      preset,
    }: {
      orderId: string;
      preset: 'merchant' | 'customer' | 'midpoint';
    }) => adminApi.simulateRiderLocation(orderId, preset),
    onSuccess: () => {
      invalidate();
      showSuccess('Test GPS ping sent to customer app');
    },
    onError: showError,
  });

  if (isLoading) return <p>Loading orders...</p>;

  if (isError) {
    return (
      <div>
        <h2>Orders</h2>
        <p className="error-banner">
          {loadError instanceof Error
            ? loadError.message
            : 'Could not load orders'}
        </p>
        <p className="hint">
          If you use the Vercel admin panel, set{' '}
          <code>VITE_API_URL=https://murgo-api.onrender.com/api</code> in Vercel
          env vars and redeploy Render after pulling latest code.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Orders</h2>
      <p className="subtitle">
        Update status, assign a rider for testing, and send GPS pings for live
        tracking on the customer app
      </p>

      {error && <p className="error-banner">{error}</p>}
      {success && <p className="success-banner">{success}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Merchant</th>
            <th>Status</th>
            <th>Rider</th>
            <th>Total</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.length === 0 && (
            <tr>
              <td colSpan={8} className="empty-row">
                No orders yet
              </td>
            </tr>
          )}
          {orders?.map((o) => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>
                {o.customer.user.firstName} {o.customer.user.lastName}
              </td>
              <td>{o.merchant.businessName}</td>
              <td>
                <select
                  className="status-select"
                  value={o.status}
                  disabled={updateStatus.isPending}
                  onChange={(e) =>
                    updateStatus.mutate({ id: o.id, status: e.target.value })
                  }
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {o.rider ? (
                  <span className="rider-name">
                    {o.rider.user.firstName} {o.rider.user.lastName}
                  </span>
                ) : (
                  <div className="rider-assign">
                    <select
                      className="status-select"
                      value={riderPick[o.id] ?? ''}
                      onChange={(e) =>
                        setRiderPick((p) => ({ ...p, [o.id]: e.target.value }))
                      }
                    >
                      <option value="">Select rider…</option>
                      {riders?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.user.firstName} {r.user.lastName} ({r.status})
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-small"
                      disabled={!riderPick[o.id] || assignRider.isPending}
                      onClick={() =>
                        assignRider.mutate({
                          orderId: o.id,
                          riderId: riderPick[o.id],
                        })
                      }
                    >
                      Assign
                    </button>
                  </div>
                )}
              </td>
              <td>₱{o.total.toFixed(2)}</td>
              <td>
                {editingNotes === o.id ? (
                  <input
                    className="inline-input"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateNotes.mutate({ id: o.id, notes: notesDraft });
                      }
                      if (e.key === 'Escape') setEditingNotes(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="notes-cell">{o.notes || '—'}</span>
                )}
              </td>
              <td className="actions">
                {editingNotes === o.id ? (
                  <>
                    <button
                      onClick={() =>
                        updateNotes.mutate({ id: o.id, notes: notesDraft })
                      }
                    >
                      Save
                    </button>
                    <button
                      className="btn-muted"
                      onClick={() => setEditingNotes(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-muted"
                      onClick={() => {
                        setEditingNotes(o.id);
                        setNotesDraft(o.notes ?? '');
                      }}
                    >
                      Edit notes
                    </button>
                    {o.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              id: o.id,
                              status: 'CONFIRMED',
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="danger"
                          onClick={() =>
                            updateStatus.mutate({
                              id: o.id,
                              status: 'CANCELLED',
                            })
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {o.rider && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                      <>
                        <button
                          className="btn-muted btn-small"
                          disabled={simulateLocation.isPending}
                          onClick={() =>
                            simulateLocation.mutate({
                              orderId: o.id,
                              preset: 'merchant',
                            })
                          }
                        >
                          GPS @ store
                        </button>
                        <button
                          className="btn-muted btn-small"
                          disabled={simulateLocation.isPending}
                          onClick={() =>
                            simulateLocation.mutate({
                              orderId: o.id,
                              preset: 'midpoint',
                            })
                          }
                        >
                          GPS en route
                        </button>
                        <button
                          className="btn-muted btn-small"
                          disabled={simulateLocation.isPending}
                          onClick={() =>
                            simulateLocation.mutate({
                              orderId: o.id,
                              preset: 'customer',
                            })
                          }
                        >
                          GPS @ customer
                        </button>
                      </>
                    )}
                    {o.status !== 'CANCELLED' &&
                      o.status !== 'DELIVERED' &&
                      o.status !== 'PENDING' && (
                        <button
                          className="danger"
                          onClick={() =>
                            updateStatus.mutate({
                              id: o.id,
                              status: 'CANCELLED',
                            })
                          }
                        >
                          Cancel
                        </button>
                      )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
