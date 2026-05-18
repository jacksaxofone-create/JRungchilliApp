import { create } from 'zustand';
import { Lang } from '../i18n/translations';

// ── Types ──
export type UserRole = 'admin' | 'stock' | 'cashier' | 'customer' | null;

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
  image_uri: string;
  is_active: boolean;
  updated_at: string;
}

export interface Customer {
  id: string;
  shop_name: string;
  phone: string;
  notes: string;
  password: string;
  customer_type: 'retail' | 'wholesale';
  credit_limit: number;
  credit_used: number;
  is_active: boolean;
  created_at: string;
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
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'transfer' | 'credit';
  payment_status: 'paid' | 'pending' | 'partial';
  status: 'pending' | 'confirmed' | 'packing' | 'delivered' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity_kg: number;
  unit_price: number;
  price_type: 'retail' | 'wholesale';
}

export interface AppSettings {
  admin_pin: string;
  shop_name: string;
  shop_address: string;
  change_fund: number;
}

// ── State Interface ──
interface AppState {
  // Auth
  lang: Lang;
  userRole: UserRole;
  isAuthenticated: boolean;
  currentCustomer: Customer | null;

  // Settings
  settings: AppSettings;

  // Hardware
  scaleConnected: boolean;
  scaleWeight: number;
  printerConnected: boolean;
  printerAddress: string;

  // Data
  products: Product[];
  customers: Customer[];
  orders: Order[];

  // POS Cart
  cart: CartItem[];

  // Network
  isOnline: boolean;

  // ── Actions: Auth ──
  setLang: (lang: Lang) => void;
  setUserRole: (role: UserRole) => void;
  setAuthenticated: (v: boolean) => void;
  setCurrentCustomer: (customer: Customer | null) => void;
  logout: () => void;

  // ── Actions: Settings ──
  setSettings: (s: Partial<AppSettings>) => void;

  // ── Actions: Hardware ──
  setScaleConnected: (v: boolean) => void;
  setScaleWeight: (w: number) => void;
  setPrinterConnected: (v: boolean) => void;
  setPrinterAddress: (addr: string) => void;

  // ── Actions: Data ──
  setProducts: (products: Product[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;

  // ── Actions: Cart ──
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, priceType: string, qty: number) => void;
  removeFromCart: (productId: string, priceType: string) => void;
  clearCart: () => void;

  // ── Actions: Online ──
  setIsOnline: (v: boolean) => void;
}

// ── Store ──
export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  lang: 'th',
  userRole: null,
  isAuthenticated: false,
  currentCustomer: null,

  // Settings
  settings: {
    admin_pin: '0000',
    shop_name: 'ร้านเจรุ่งชิลลี่',
    shop_address: 'แม่สอด',
    change_fund: 500,
  },

  // Hardware
  scaleConnected: false,
  scaleWeight: 0,
  printerConnected: false,
  printerAddress: '',

  // Data
  products: [],
  customers: [],
  orders: [],

  // Cart
  cart: [],

  // Network
  isOnline: true,

  // Auth actions
  setLang: (lang) => set({ lang }),
  setUserRole: (role) => set({ userRole: role, isAuthenticated: role !== null }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
  logout: () => set({ userRole: null, isAuthenticated: false, cart: [], currentCustomer: null }),

  // Settings actions
  setSettings: (s) => set((state) => ({
    settings: { ...state.settings, ...s }
  })),

  // Hardware actions
  setScaleConnected: (v) => set({ scaleConnected: v }),
  setScaleWeight: (w) => set({ scaleWeight: w }),
  setPrinterConnected: (v) => set({ printerConnected: v }),
  setPrinterAddress: (addr) => set({ printerAddress: addr }),

  // Data actions
  setProducts: (products) => set({ products }),
  setCustomers: (customers) => set({ customers }),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders]
  })),

  // Cart actions
  addToCart: (item) => set((state) => {
    const idx = state.cart.findIndex(
      c => c.product.id === item.product.id && c.price_type === item.price_type
    );
    if (idx >= 0) {
      const updated = [...state.cart];
      updated[idx] = {
        ...updated[idx],
        quantity_kg: Math.round((updated[idx].quantity_kg + item.quantity_kg) * 1000) / 1000,
      };
      return { cart: updated };
    }
    return { cart: [...state.cart, item] };
  }),
  updateCartItem: (productId, priceType, qty) => set((state) => ({
    cart: state.cart.map(c =>
      c.product.id === productId && c.price_type === priceType
        ? { ...c, quantity_kg: qty }
        : c
    )
  })),
  removeFromCart: (productId, priceType) => set((state) => ({
    cart: state.cart.filter(
      c => !(c.product.id === productId && c.price_type === priceType)
    )
  })),
  clearCart: () => set({ cart: [] }),

  // Online action
  setIsOnline: (v) => set({ isOnline: v }),
}));

// ── Selectors (computed values) ──
export const cartTotalSelector = (state: AppState) =>
  state.cart.reduce((sum, item) => sum + item.quantity_kg * item.unit_price, 0);

export const cartCountSelector = (state: AppState) => state.cart.length;