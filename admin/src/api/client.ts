import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  merchants: (status?: string) =>
    api.get('/admin/merchants', { params: { status } }),
  updateMerchantStatus: (id: string, status: string) =>
    api.patch(`/admin/merchants/${id}/status`, { status }),
  customers: () => api.get('/admin/customers'),
  riders: () => api.get('/admin/riders'),
  suspendUser: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}/suspend`, { isActive }),
  orders: () => api.get('/admin/orders'),
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
