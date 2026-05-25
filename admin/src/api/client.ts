import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

let authToken: string | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  tokenGetter = getter;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = tokenGetter ? await tokenGetter() : authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ??
      (status === 404
        ? 'API route not found — redeploy the backend on Render'
        : status === 403
          ? 'Admin access required'
          : err.message);
    return Promise.reject(new Error(message));
  },
);

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  merchants: (status?: string) =>
    api.get('/admin/merchants', { params: { status } }),
  updateMerchantStatus: (id: string, status: string) =>
    api.patch(`/admin/merchants/${id}/status`, { status }),
  updateMerchant: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/merchants/${id}`, data),
  createMerchant: (data: Record<string, unknown>) =>
    api.post('/admin/merchants', data),
  deleteMerchant: (id: string) => api.delete(`/admin/merchants/${id}`),
  customers: () => api.get('/admin/customers'),
  createCustomer: (email: string) => api.post('/admin/customers', { email }),
  deleteCustomer: (id: string) => api.delete(`/admin/customers/${id}`),
  riders: () => api.get('/admin/riders'),
  suspendUser: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}/suspend`, { isActive }),
  orders: () => api.get('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  updateOrder: (id: string, data: { notes?: string }) =>
    api.patch(`/admin/orders/${id}`, data),
  assignRider: (orderId: string, riderId: string) =>
    api.patch(`/admin/orders/${orderId}/rider`, { riderId }),
  simulateRiderLocation: (
    orderId: string,
    preset: 'merchant' | 'customer' | 'midpoint',
  ) => api.post(`/admin/orders/${orderId}/simulate-location`, { preset }),
  deliveryFees: () => api.get('/admin/delivery-fees'),
  updateDeliveryFee: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/delivery-fees/${id}`, data),
  createDeliveryFee: (data: Record<string, unknown>) =>
    api.post('/admin/delivery-fees', data),
  commissions: () => api.get('/admin/commissions'),
  updateCommission: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/commissions/${id}`, data),
  promoCodes: () => api.get('/admin/promo-codes'),
};
