import { api } from './client';

export const geofenceApi = {
  validate: (latitude: number, longitude: number) =>
    api.post<{ valid: boolean; message?: string }>('/geofence/validate', {
      latitude,
      longitude,
    }),
  getCities: () => api.get('/geofence/cities'),
};

export const merchantsApi = {
  browse: (params?: { city?: string; search?: string }) =>
    api.get('/merchants', { params }),
  getOne: (id: string) => api.get(`/merchants/${id}`),
  register: (data: Record<string, unknown>) =>
    api.post('/merchants/register', data),
  getProfile: () => api.get('/merchants/me/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/merchants/me/profile', data),
  getOrders: (status?: string) =>
    api.get('/merchants/me/orders', { params: { status } }),
  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/merchants/me/orders/${orderId}/status`, { status }),
  getAnalytics: () => api.get('/merchants/me/analytics'),
};

export const productsApi = {
  search: (q: string) => api.get('/products/search', { params: { q } }),
  byMerchant: (merchantId: string) =>
    api.get(`/products/merchant/${merchantId}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/me'),
  createCategory: (name: string) =>
    api.post('/products/categories', { name }),
};

export const ordersApi = {
  preview: (data: Record<string, unknown>) =>
    api.post('/orders/checkout/preview', data),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  list: () => api.get('/orders'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

export const addressesApi = {
  list: () => api.get('/addresses'),
  create: (data: Record<string, unknown>) => api.post('/addresses', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/addresses/${id}`, data),
  remove: (id: string) => api.delete(`/addresses/${id}`),
};

export const ridersApi = {
  setStatus: (status: string) => api.patch('/riders/status', { status }),
  updateLocation: (latitude: number, longitude: number) =>
    api.post('/riders/location', { latitude, longitude }),
  getAvailableOrders: () => api.get('/riders/orders/available'),
  acceptOrder: (orderId: string) =>
    api.post(`/riders/orders/${orderId}/accept`),
  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/riders/orders/${orderId}/status`, { status }),
  trackLocation: (
    orderId: string,
    latitude: number,
    longitude: number,
    heading?: number,
  ) =>
    api.post(`/riders/orders/${orderId}/track`, {
      latitude,
      longitude,
      heading,
    }),
  getHistory: () => api.get('/riders/history'),
  getEarnings: () => api.get('/riders/earnings'),
};

export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/users/me', data),
  setRole: (role: string) => api.post('/users/role', { role }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const routesApi = {
  getRoute: (fromLat: number, fromLng: number, toLat: number, toLng: number) =>
    api.get('/routes', {
      params: { fromLat, fromLng, toLat, toLng },
    }),
};

export const promoApi = {
  validate: (code: string, subtotal: number) =>
    api.get('/promo/validate', { params: { code, subtotal } }),
};
