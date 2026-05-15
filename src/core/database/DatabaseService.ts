import { getDB, getRows } from './db';

export const DB = {

  getSetting(key: string): string {
    try {
      const r = getDB().execute('SELECT value FROM settings WHERE key=?', [key]);
      return getRows(r)?.[0]?.value ?? '';
    } catch { return ''; }
  },

  setSetting(key: string, value: string): void {
    try {
      getDB().execute('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', [key, value]);
    } catch(e) { console.error('setSetting error:', e); }
  },

  getAllSettings(): Record<string,string> {
    try {
      const r = getDB().execute('SELECT key,value FROM settings');
      const out: Record<string,string> = {};
      for (const row of getRows(r)) out[row.key] = row.value;
      return out;
    } catch { return {}; }
  },

  getAllProducts(): any[] {
    try {
      const r = getDB().execute('SELECT * FROM products WHERE is_active=1 ORDER BY name_th');
      return getRows(r);
    } catch(e) { console.error('getAllProducts error:', e); return []; }
  },

  getProductById(id: string): any {
    try {
      const r = getDB().execute('SELECT * FROM products WHERE id=?', [id]);
      return getRows(r)?.[0] ?? null;
    } catch { return null; }
  },

  saveProduct(p: any): void {
    try {
      const now = new Date().toISOString();
      getDB().execute(
        `INSERT OR REPLACE INTO products
         (id,name_th,name_mm,name_en,name_cn,category,unit,
          price_retail,price_wholesale,stock_kg,min_stock_kg,image_uri,is_active,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          p.id ?? ('P' + Date.now()),
          p.name_th ?? '',
          p.name_mm ?? '',
          p.name_en ?? '',
          p.name_cn ?? '',
          p.category ?? 'พริก',
          p.unit ?? 'กก.',
          Number(p.price_retail) || 0,
          Number(p.price_wholesale) || 0,
          Number(p.stock_kg) || 0,
          Number(p.min_stock_kg) || 5,
          p.image_uri ?? '',
          p.is_active ?? 1,
          now,
        ]
      );
    } catch(e) { console.error('saveProduct error:', e); throw e; }
  },

  deleteProduct(id: string): void {
    try {
      getDB().execute(
        'UPDATE products SET is_active=0, updated_at=? WHERE id=?',
        [new Date().toISOString(), id]
      );
    } catch(e) { console.error('deleteProduct error:', e); throw e; }
  },

  getAllCustomers(): any[] {
    try {
      const r = getDB().execute('SELECT * FROM customers WHERE is_active=1 ORDER BY shop_name');
      return getRows(r);
    } catch(e) { console.error('getAllCustomers error:', e); return []; }
  },

  getCustomerByShopName(shopName: string): any {
    try {
      const r = getDB().execute(
        'SELECT * FROM customers WHERE shop_name=? AND is_active=1', [shopName]);
      return getRows(r)?.[0] ?? null;
    } catch { return null; }
  },

  saveCustomer(c: any): void {
    try {
      const now = new Date().toISOString();
      getDB().execute(
        `INSERT OR REPLACE INTO customers
         (id,shop_name,phone,notes,password,customer_type,
          credit_limit,credit_used,is_active,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          c.id ?? ('C' + Date.now()),
          c.shop_name ?? '',
          c.phone ?? '',
          c.notes ?? '',
          c.password ?? '0000',
          c.customer_type ?? 'retail',
          Number(c.credit_limit) || 0,
          Number(c.credit_used) || 0,
          c.is_active ?? 1,
          c.created_at ?? now,
        ]
      );
    } catch(e) { console.error('saveCustomer error:', e); throw e; }
  },

  deleteCustomer(id: string): void {
    try {
      getDB().execute('UPDATE customers SET is_active=0 WHERE id=?', [id]);
    } catch(e) { console.error('deleteCustomer error:', e); throw e; }
  },

  saveOrder(order: any, items: any[]): void {
    try {
      const db = getDB();
      db.execute(
        `INSERT OR REPLACE INTO orders
         (id,order_number,customer_id,customer_name,customer_phone,
          subtotal,discount,total,payment_method,payment_status,
          status,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          order.id,
          order.order_number,
          order.customer_id ?? '',
          order.customer_name ?? 'ลูกค้าทั่วไป',
          order.customer_phone ?? '',
          Number(order.subtotal) || 0,
          Number(order.discount) || 0,
          Number(order.total) || 0,
          order.payment_method ?? 'cash',
          order.payment_status ?? 'paid',
          order.status ?? 'pending',
          order.notes ?? '',
          order.created_at,
          order.updated_at,
        ]
      );
      for (const item of items) {
        db.execute(
          `INSERT OR REPLACE INTO order_items
           (id,order_id,product_id,product_name_th,product_name_mm,
            product_name_en,product_name_cn,quantity_kg,unit_price,total_price,is_packed)
           VALUES (?,?,?,?,?,?,?,?,?,?,0)`,
          [
            item.id, order.id, item.product_id,
            item.product_name_th ?? '',
            item.product_name_mm ?? '',
            item.product_name_en ?? '',
            item.product_name_cn ?? '',
            Number(item.quantity_kg) || 0,
            Number(item.unit_price) || 0,
            Number(item.total_price) || 0,
          ]
        );
      }
    } catch(e) { console.error('saveOrder error:', e); throw e; }
  },

  getOrdersToday(): any[] {
    try {
      const today = new Date().toISOString().split('T')[0];
      const r = getDB().execute(
        'SELECT * FROM orders WHERE created_at LIKE ? ORDER BY created_at DESC',
        [today + '%']
      );
      return getRows(r);
    } catch(e) { console.error('getOrdersToday error:', e); return []; }
  },

  getOrdersByCustomer(customerName: string): any[] {
    try {
      const r = getDB().execute(
        'SELECT * FROM orders WHERE customer_name=? ORDER BY created_at DESC LIMIT 50',
        [customerName]
      );
      return getRows(r);
    } catch { return []; }
  },

  getOrderItems(orderId: string): any[] {
    try {
      const r = getDB().execute(
        'SELECT * FROM order_items WHERE order_id=?', [orderId]);
      return getRows(r);
    } catch { return []; }
  },

  getDashboardStats(): {
    revenueToday: number;
    ordersToday: number;
    pendingOrders: number;
    overdueCredit: number;
  } {
    try {
      const today = new Date().toISOString().split('T')[0];
      const rev = getDB().execute(
        "SELECT COALESCE(SUM(total),0) as total FROM orders WHERE created_at LIKE ? AND payment_status='paid'",
        [today + '%']
      );
      const ord = getDB().execute(
        'SELECT COUNT(*) as count FROM orders WHERE created_at LIKE ?',
        [today + '%']
      );
      const pen = getDB().execute(
        "SELECT COUNT(*) as count FROM orders WHERE status='pending'"
      );
      const cred = getDB().execute(
        "SELECT COALESCE(SUM(amount-amount_paid),0) as total FROM credit_records WHERE status='overdue'"
      );
      return {
        revenueToday:  getRows(rev)?.[0]?.total  ?? 0,
        ordersToday:   getRows(ord)?.[0]?.count  ?? 0,
        pendingOrders: getRows(pen)?.[0]?.count  ?? 0,
        overdueCredit: getRows(cred)?.[0]?.total ?? 0,
      };
    } catch {
      return { revenueToday: 0, ordersToday: 0, pendingOrders: 0, overdueCredit: 0 };
    }
  },
};