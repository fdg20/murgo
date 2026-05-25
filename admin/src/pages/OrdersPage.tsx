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
  customer: { user: { firstName?: string; lastName?: string } };
  merchant: { businessName: string };
};

export function OrdersPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await adminApi.orders()).data as Order[],
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const updateNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      adminApi.updateOrder(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setEditingNotes(null);
    },
  });

  if (isLoading) return <p>Loading orders...</p>;

  return (
    <div>
      <h2>Orders</h2>
      <p className="subtitle">
        Approve, update status, add notes, or cancel orders
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Merchant</th>
            <th>Status</th>
            <th>Total</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-row">
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
