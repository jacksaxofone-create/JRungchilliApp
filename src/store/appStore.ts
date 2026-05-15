import { create } from 'zustand';
import { Language } from '../i18n/translations';

export type UserRole = 'admin' | 'stock' | 'cashier' | null;

export interface AppUser {
  role: UserRole;
  name: string;
}

export interface Product {
  id: string;
  name_th: string;
  name_mm: string;
  name_en: string;
  name_cn: string;
  category: string;
  unit: string;
  price_retail: number;
  price_wholesale: number;
  stock_kg: number;
  min_stock_kg: number;
  image_uri?: string;
  is_active: boolean;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_th: string;
  product_name_mm: string;
  product_name_en: string;
  product_name_cn: string;
  quantity_kg: number;
  unit_price: number;
  total_price: number;
  is_packed: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items?: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export type PaymentMethod = 'cash' | 'transfer' | 'credit';

interface AppState {
  primaryLanguage: Language;
  secondaryLanguage: Language;
  currentUser: AppUser | null;
  printerConnected: boolean;
  printerAddress: string;
  products: Product[];
  orders: Order[];
  isOnline: boolean;
  syncQueueCount: number;
  lastSyncTime: string;
  setPrimaryLanguage: (lang: Language) => void;
  setSecondaryLanguage: (lang: Language) => void;
  setCurrentUser: (user: AppUser | null) => void;
  setPrinterConnected: (connected: boolean) => void;
  setPrinterAddress: (address: string) => void;
  setProducts: (products: Product[]) => void;
  addOrder: (order: Order) => void;
  setOrders: (orders: Order[]) => void;
  setIsOnline: (online: boolean) => void;
  setSyncQueueCount: (count: number) => void;
  setLastSyncTime: (time: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  primaryLanguage: 'th',
  secondaryLanguage: 'mm',
  currentUser: null,
  printerConnected: false,
  printerAddress: '',
  products: [],
  orders: [],
  isOnline: true,
  syncQueueCount: 0,
  lastSyncTime: '',
  setPrimaryLanguage: (lang) => set({ primaryLanguage: lang }),
  setSecondaryLanguage: (lang) => set({ secondaryLanguage: lang }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setPrinterConnected: (connected) => set({ printerConnected: connected }),
  setPrinterAddress: (address) => set({ printerAddress: address }),
  setProducts: (products) => set({ products }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  setOrders: (orders) => set({ orders }),
  setIsOnline: (online) => set({ isOnline: online }),
  setSyncQueueCount: (count) => set({ syncQueueCount: count }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));