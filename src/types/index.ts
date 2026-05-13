export type Language = 'th' | 'mm' | 'en' | 'cn';
export type UserRole = 'admin' | 'stock' | 'cashier';
export type PaymentMethod = 'cash' | 'transfer';
export type OrderStatus = 'pending' | 'packing' | 'ready' | 'picked_up' | 'cancelled';
export type CreditStatus = 'active' | 'overdue' | 'suspended';

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
  image_url?: string;
  is_active: boolean;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  customer_type: 'retail' | 'wholesale';
  credit_limit: number;
  credit_used: number;
  credit_status: CreditStatus;
  address?: string;
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
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: 'unpaid' | 'paid' | 'partial';
  slip_image?: string;
  status: OrderStatus;
  pickup_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export interface CreditRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  order_id: string;
  order_number: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  created_at: string;
}

export interface LabelData {
  shop_name: string;
  product_name_th: string;
  product_name_secondary: string;
  weight_kg: number;
  price_per_kg: number;
  total_price: number;
  order_number: string;
  customer_name: string;
  date: string;
  barcode?: string;
}
