import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

type Merchant = {
  id: string;
  businessName: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  user: { email: string };
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];

const emptyForm = {
  email: '',
  businessName: '',
  phone: '',
  address: '',
  city: 'Murcia',
  latitude: '10.604',
  longitude: '123.041',
  description: '',
};

export function MerchantsPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-merchants', filter],
    queryFn: async () =>
      (
        await adminApi.merchants(filter === 'ALL' ? undefined : filter)
      ).data as Merchant[],
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateMerchantStatus(id, status),
    onSuccess: invalidate,
  });

  const updateMerchant = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateMerchant(id, data),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Could not update merchant');
    },
  });

  const createMerchant = useMutation({
    mutationFn: () =>
      adminApi.createMerchant({
        ...addForm,
        latitude: parseFloat(addForm.latitude),
        longitude: parseFloat(addForm.longitude),
      }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setAddForm(emptyForm);
      setError(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Could not add merchant');
    },
  });

  const deleteMerchant = useMutation({
    mutationFn: (id: string) => adminApi.deleteMerchant(id),
    onSuccess: (res) => {
      invalidate();
      alert(res.data.message);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Could not remove merchant');
    },
  });

  const startEdit = (m: Merchant) => {
    setEditingId(m.id);
    setEditForm({
      businessName: m.businessName,
      phone: m.phone,
      email: m.email,
      address: m.address,
      city: m.city,
      description: '',
    });
    setError(null);
  };

  if (isLoading) return <p>Loading merchants...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Merchant Management</h2>
          <p className="subtitle">Approve, edit, add, or remove merchants</p>
        </div>
        <button onClick={() => { setShowAdd(true); setError(null); }}>
          + Add merchant
        </button>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="error-banner">{error}</p>}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add merchant</h3>
            <p className="hint">
              User must already have signed up in the app. Enter their email to
              link the store.
            </p>
            <div className="form-grid">
              <input
                placeholder="User email *"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <input
                placeholder="Business name *"
                value={addForm.businessName}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, businessName: e.target.value }))
                }
              />
              <input
                placeholder="Phone *"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <input
                placeholder="City *"
                value={addForm.city}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, city: e.target.value }))
                }
              />
              <input
                placeholder="Address *"
                value={addForm.address}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, address: e.target.value }))
                }
                className="span-2"
              />
              <input
                placeholder="Latitude"
                value={addForm.latitude}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, latitude: e.target.value }))
                }
              />
              <input
                placeholder="Longitude"
                value={addForm.longitude}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, longitude: e.target.value }))
                }
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => createMerchant.mutate()}
                disabled={createMerchant.isPending}
              >
                {createMerchant.isPending ? 'Adding…' : 'Add merchant'}
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
            <th>Business</th>
            <th>Owner email</th>
            <th>City</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {merchants?.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                No merchants in this category
              </td>
            </tr>
          )}
          {merchants?.map((m) => (
            <tr key={m.id}>
              {editingId === m.id ? (
                <>
                  <td colSpan={5}>
                    <div className="inline-edit-form">
                      <input
                        value={editForm.businessName}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            businessName: e.target.value,
                          }))
                        }
                        placeholder="Business name"
                      />
                      <input
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="Phone"
                      />
                      <input
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, city: e.target.value }))
                        }
                        placeholder="City"
                      />
                      <input
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Address"
                        className="span-2"
                      />
                      <button
                        onClick={() =>
                          updateMerchant.mutate({ id: m.id, data: editForm })
                        }
                      >
                        Save
                      </button>
                      <button
                        className="btn-muted"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td>{m.businessName}</td>
                  <td>{m.user.email}</td>
                  <td>{m.city}</td>
                  <td>
                    <span className={`badge badge-${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-muted" onClick={() => startEdit(m)}>
                      Edit
                    </button>
                    {m.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              id: m.id,
                              status: 'APPROVED',
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="danger"
                          onClick={() =>
                            updateStatus.mutate({
                              id: m.id,
                              status: 'REJECTED',
                            })
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
                          updateStatus.mutate({
                            id: m.id,
                            status: 'SUSPENDED',
                          })
                        }
                      >
                        Suspend
                      </button>
                    )}
                    {m.status === 'SUSPENDED' && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({
                            id: m.id,
                            status: 'APPROVED',
                          })
                        }
                      >
                        Reactivate
                      </button>
                    )}
                    {m.status === 'REJECTED' && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({
                            id: m.id,
                            status: 'APPROVED',
                          })
                        }
                      >
                        Approve
                      </button>
                    )}
                    <button
                      className="danger"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove "${m.businessName}"? If they have orders, they will be deactivated instead.`,
                          )
                        ) {
                          deleteMerchant.mutate(m.id);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
