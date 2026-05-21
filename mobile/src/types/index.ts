export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN';

export interface Merchant {
  id: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  city: string;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  stock: number;
  isAvailable: boolean;
  category?: { id: string; name: string };
}

export interface Address {
  id: string;
  label: string;
  street: string;
  barangay?: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  distanceKm: number;
  estimatedEta?: number;
  merchant?: { id: string; businessName: string; logoUrl?: string };
  items: { id: string; name: string; price: number; quantity: number }[];
  address?: Address;
  rider?: { user: { firstName?: string; lastName?: string } };
}

export interface CheckoutPreview {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  distanceKm: number;
  estimatedEta: number;
}
