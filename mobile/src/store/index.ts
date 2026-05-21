import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  merchantId: string | null;
  merchantName: string | null;
  items: CartItem[];
  promoCode: string;
  addItem: (merchantId: string, merchantName: string, item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setPromoCode: (code: string) => void;
  clearCart: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  merchantId: null,
  merchantName: null,
  items: [],
  promoCode: '',

  addItem: (merchantId, merchantName, item) => {
    const state = get();
    if (state.merchantId && state.merchantId !== merchantId) {
      set({ merchantId, merchantName, items: [item] });
      return;
    }
    const existing = state.items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        merchantId,
        merchantName,
        items: state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        ),
      });
    } else {
      set({
        merchantId,
        merchantName,
        items: [...state.items, item],
      });
    }
  },

  removeItem: (productId) =>
    set((s) => ({
      items: s.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((s) => ({
      items:
        quantity <= 0
          ? s.items.filter((i) => i.productId !== productId)
          : s.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
    })),

  setPromoCode: (code) => set({ promoCode: code }),

  clearCart: () =>
    set({ merchantId: null, merchantName: null, items: [], promoCode: '' }),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  inServiceArea: boolean;
  setLocation: (lat: number, lng: number, city?: string) => void;
  setServiceArea: (valid: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  city: null,
  inServiceArea: true,
  setLocation: (latitude, longitude, city) =>
    set({ latitude, longitude, city: city ?? null }),
  setServiceArea: (inServiceArea) => set({ inServiceArea }),
}));
