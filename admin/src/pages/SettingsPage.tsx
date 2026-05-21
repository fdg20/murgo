import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/client';
import { useApiAuth } from '../hooks/useApiAuth';

export function SettingsPage() {
  useApiAuth();
  const queryClient = useQueryClient();
  const [feeForm, setFeeForm] = useState({
    baseFee: '49',
    perKmRate: '10',
    flatFeeKm: '2',
    flatFeeAmount: '49',
  });

  const { data: fees } = useQuery({
    queryKey: ['delivery-fees'],
    queryFn: async () => (await adminApi.deliveryFees()).data,
  });

  const { data: commissions } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => (await adminApi.commissions()).data,
  });

  const { data: promos } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => (await adminApi.promoCodes()).data,
  });

  const updateFee = useMutation({
    mutationFn: (data: { id: string; payload: Record<string, unknown> }) =>
      adminApi.updateDeliveryFee(data.id, data.payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['delivery-fees'] }),
  });

  const activeFee = fees?.find((f: { isActive: boolean }) => f.isActive);

  return (
    <div>
      <h2>Platform Settings</h2>

      <section className="settings-section">
        <h3>Delivery Fee Configuration</h3>
        <p className="subtitle">
          If distance ≤ 2km: flat fee. Else: base fee + (distance × per km rate)
        </p>
        {activeFee && (
          <div className="settings-card">
            <p>
              <strong>Active:</strong> Base ₱{activeFee.baseFee} + ₱
              {activeFee.perKmRate}/km (flat ₱{activeFee.flatFeeAmount} within{' '}
              {activeFee.flatFeeKm}km)
            </p>
            <div className="form-row">
              <input
                type="number"
                placeholder="Base fee"
                value={feeForm.baseFee}
                onChange={(e) =>
                  setFeeForm((f) => ({ ...f, baseFee: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Per km rate"
                value={feeForm.perKmRate}
                onChange={(e) =>
                  setFeeForm((f) => ({ ...f, perKmRate: e.target.value }))
                }
              />
              <button
                onClick={() =>
                  updateFee.mutate({
                    id: activeFee.id,
                    payload: {
                      baseFee: parseFloat(feeForm.baseFee),
                      perKmRate: parseFloat(feeForm.perKmRate),
                      flatFeeKm: parseFloat(feeForm.flatFeeKm),
                      flatFeeAmount: parseFloat(feeForm.flatFeeAmount),
                    },
                  })
                }
              >
                Update Fees
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Commission</h3>
        {commissions?.map(
          (c: {
            id: string;
            platformRate: number;
            merchantRate: number;
            isActive: boolean;
          }) => (
            <div key={c.id} className="settings-card">
              Platform: {c.platformRate}% · Merchant: {c.merchantRate}%
            </div>
          ),
        )}
      </section>

      <section className="settings-section">
        <h3>Promo Codes</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Used</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {promos?.map(
              (p: {
                id: string;
                code: string;
                discountType: string;
                discountValue: number;
                usedCount: number;
                usageLimit?: number;
                isActive: boolean;
              }) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>
                    {p.discountType === 'PERCENTAGE'
                      ? `${p.discountValue}%`
                      : `₱${p.discountValue}`}
                  </td>
                  <td>
                    {p.usedCount}
                    {p.usageLimit ? ` / ${p.usageLimit}` : ''}
                  </td>
                  <td>{p.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
