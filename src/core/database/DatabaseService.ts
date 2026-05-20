import { getDB, getRows } from './db';

export const DB = {

  // ─── Settings ───────────────────────────────────────────
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

  // ─── Products ───────────────────────────────────────────
  getAllProducts(): any[] {
    try {
      const r = getDB().execute('SELECT * FROM products WHERE is_active=1 ORDER BY category, name_th');
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
      console.log('[DB] saveProduct START id:', p.id ?? ('P'+Date.now()), 'name:', p.name_th);
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
      console.log('[DB] saveProduct SUCCESS id:', p.id, 'name:', p.name_th);
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

  // ─── Customers ──────────────────────────────────────────
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

  getCustomerById(id: string): any {
    try {
      const r = getDB().execute('SELECT * FROM customers WHERE id=? AND is_active=1', [id]);
      return getRows(r)?.[0] ?? null;
    } catch { return null; }
  },

  loginCustomer(shopName: string, password: string): any {
    try {
      const r = getDB().execute(
        'SELECT * FROM customers WHERE shop_name=? AND password=? AND is_active=1',
        [shopName, password]
      );
      return getRows(r)?.[0] ?? null;
    } catch { return null; }
  },

  searchCustomers(query: string): any[] {
    try {
      const r = getDB().execute(
        "SELECT * FROM customers WHERE is_active=1 AND shop_name LIKE ? ORDER BY shop_name LIMIT 10",
        [`%${query}%`]
      );
      return getRows(r);
    } catch { return []; }
  },

  saveCustomer(c: any): void {
    try {
      const now = new Date().toISOString();
      console.log('[DB] saveCustomer START id:', c.id ?? ('C'+Date.now()), 'shop:', c.shop_name);
      getDB().execute(
        `INSERT OR REPLACE INTO customers
         (id,shop_name,phone,notes,password,customer_type,
          credit_limit,credit_used,is_active,created_at,image_uri)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          c.id ?? ('C' + Date.now()),
          c.shop_name ?? '',
          c.phone ?? '',
          c.notes ?? '',
          c.password ?? Math.floor(1000 + Math.random() * 9000).toString(),
          c.customer_type ?? 'retail',
          Number(c.credit_limit) || 0,
          Number(c.credit_used) || 0,
          c.is_active ?? 1,
          c.created_at ?? now,
          c.image_uri ?? '',
        ]
      );
      console.log('[DB] saveCustomer SUCCESS id:', c.id, 'shop:', c.shop_name);
    } catch(e) { console.error('saveCustomer error:', e); throw e; }
  },

  updateCustomerCredit(customerId: string, creditUsed: number): void {
    try {
      getDB().execute(
        'UPDATE customers SET credit_used=? WHERE id=?',
        [creditUsed, customerId]
      );
    } catch(e) { console.error('updateCustomerCredit error:', e); }
  },

  deleteCustomer(id: string): void {
    try {
      getDB().execute('UPDATE customers SET is_active=0 WHERE id=?', [id]);
    } catch(e) { console.error('deleteCustomer error:', e); throw e; }
  },

  // ─── Orders ─────────────────────────────────────────────
  saveOrder(order: any, items: any[]): void {
    try {
      const db = getDB();
      db.execute(
        `INSERT OR REPLACE INTO orders
         (id,order_number,customer_id,customer_name,customer_phone,
          subtotal,discount,total,payment_method,payment_status,
          status,notes,order_type,pack_status,scheduled_date,
          confirmed_by,confirmed_at,packed_at,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          order.order_type ?? 'walk_in',
          order.pack_status ?? 'waiting',
          order.scheduled_date ?? '',
          order.confirmed_by ?? '',
          order.confirmed_at ?? '',
          order.packed_at ?? '',
          order.created_at,
          order.updated_at,
        ]
      );
      for (const item of items) {
        db.execute(
          `INSERT OR REPLACE INTO order_items
           (id,order_id,product_id,product_name_th,product_name_mm,
            product_name_en,product_name_cn,quantity_kg,unit_price,total_price,
            requested_kg,actual_kg,actual_weight_kg,item_notes,is_packed,packed_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,'')`,
          [
            item.id, order.id, item.product_id,
            item.product_name_th ?? '',
            item.product_name_mm ?? '',
            item.product_name_en ?? '',
            item.product_name_cn ?? '',
            Number(item.quantity_kg) || 0,
            Number(item.unit_price) || 0,
            Number(item.total_price) || 0,
            Number(item.requested_kg || item.quantity_kg) || 0,
            Number(item.actual_kg) || 0,
            Number(item.actual_weight_kg) || 0,
            item.item_notes ?? '',
          ]
        );
      }
    } catch(e) { console.error('saveOrder error:', e); throw e; }
  },

  updateOrderStatus(orderId: string, status: string, packStatus?: string): void {
    try {
      const now = new Date().toISOString();
      if (packStatus) {
        getDB().execute(
          'UPDATE orders SET status=?, pack_status=?, updated_at=? WHERE id=?',
          [status, packStatus, now, orderId]
        );
      } else {
        getDB().execute(
          'UPDATE orders SET status=?, updated_at=? WHERE id=?',
          [status, now, orderId]
        );
      }
    } catch(e) { console.error('updateOrderStatus error:', e); }
  },

  updateOrderPackStatus(orderId: string, packStatus: string): void {
    try {
      const now = new Date().toISOString();
      const packedAt = packStatus === 'packed' ? now : '';
      getDB().execute(
        'UPDATE orders SET pack_status=?, packed_at=?, updated_at=? WHERE id=?',
        [packStatus, packedAt, now, orderId]
      );
    } catch(e) { console.error('updateOrderPackStatus error:', e); }
  },

  updateItemPacked(itemId: string, isPacked: boolean, actualWeight?: number): void {
    try {
      const now = new Date().toISOString();
      const aw = actualWeight ?? 0;
      const total = aw * 0; // will recalculate externally
      getDB().execute(
        'UPDATE order_items SET is_packed=?, actual_weight_kg=?, actual_kg=?, packed_at=? WHERE id=?',
        [isPacked ? 1 : 0, aw, aw, isPacked ? now : '', itemId]
      );
    } catch(e) { console.error('updateItemPacked error:', e); }
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

  getPreOrdersForDate(date: string): any[] {
    try {
      const r = getDB().execute(
        "SELECT * FROM orders WHERE order_type='pre_order' AND (scheduled_date=? OR scheduled_date LIKE ?) ORDER BY created_at DESC",
        [date, date + '%']
      );
      return getRows(r);
    } catch(e) { return []; }
  },

  getPendingPackOrders(): any[] {
    try {
      const r = getDB().execute(
        "SELECT * FROM orders WHERE order_type='pre_order' AND pack_status IN ('waiting','packing') ORDER BY scheduled_date ASC, created_at ASC"
      );
      return getRows(r);
    } catch(e) { return []; }
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

  getOrdersByCustomerId(customerId: string): any[] {
    try {
      const r = getDB().execute(
        'SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 50',
        [customerId]
      );
      return getRows(r);
    } catch { return []; }
  },

  getAllOrders(limit: number = 100): any[] {
    try {
      const r = getDB().execute(
        'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
        [limit]
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

  // ─── Credit ─────────────────────────────────────────────
  saveCreditRecord(c: any): void {
    try {
      const now = new Date().toISOString();
      getDB().execute(
        `INSERT OR REPLACE INTO credit_records
         (id,customer_id,customer_name,order_id,order_number,
          amount,amount_paid,due_date,paid_date,status,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          c.id ?? ('CR' + Date.now()),
          c.customer_id ?? '',
          c.customer_name ?? '',
          c.order_id ?? '',
          c.order_number ?? '',
          Number(c.amount) || 0,
          Number(c.amount_paid) || 0,
          c.due_date ?? '',
          c.paid_date ?? '',
          c.status ?? 'pending',
          c.created_at ?? now,
        ]
      );
    } catch(e) { console.error('saveCreditRecord error:', e); }
  },

  getCreditByCustomer(customerId: string): any[] {
    try {
      const r = getDB().execute(
        "SELECT * FROM credit_records WHERE customer_id=? AND status!='paid' ORDER BY created_at DESC",
        [customerId]
      );
      return getRows(r);
    } catch { return []; }
  },

  getTotalCreditUsed(customerId: string): number {
    try {
      const r = getDB().execute(
        "SELECT COALESCE(SUM(amount-amount_paid),0) as total FROM credit_records WHERE customer_id=? AND status!='paid'",
        [customerId]
      );
      return getRows(r)?.[0]?.total ?? 0;
    } catch { return 0; }
  },

  // ─── Dashboard ──────────────────────────────────────────
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

  // cashier PIN rotation
  rotateCashierPinIfNeeded(): string {
    try {
      const lastChanged = this.getSetting('cashier_pin_last_changed') || '';
      const rotateDays = parseInt(this.getSetting('cashier_pin_rotate_days') || '5', 10);
      const today = new Date().toISOString().split('T')[0];
      const lastDate = new Date(lastChanged || today);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= rotateDays) {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        this.setSetting('cashier_pin', newPin);
        this.setSetting('cashier_pin_last_changed', today);
        return newPin;
      }
      return this.getSetting('cashier_pin') || '1234';
    } catch { return '1234'; }
  },

  // ── Sub-customers (รายชื่อลูกค้าของผู้ค้าส่ง) ──
  getSubCustomers(ownerCustomerId: string): string[] {
    try {
      const res = getDB().execute(
        `SELECT name FROM sub_customers WHERE owner_customer_id = ? ORDER BY name ASC`,
        [ownerCustomerId]
      );
      return (res.rows?._array || []).map((r: any) => r.name);
    } catch (e) { console.error('getSubCustomers error:', e); return []; }
  },

  searchSubCustomers(ownerCustomerId: string, query: string): string[] {
    try {
      const res = getDB().execute(
        `SELECT name FROM sub_customers WHERE owner_customer_id = ? AND name LIKE ? ORDER BY name ASC LIMIT 10`,
        [ownerCustomerId, `${query}%`]
      );
      return (res.rows?._array || []).map((r: any) => r.name);
    } catch (e) { console.error('searchSubCustomers error:', e); return []; }
  },

  saveSubCustomer(ownerCustomerId: string, name: string): void {
    try {
      const trimmed = name.trim();
      if (!trimmed) return;
      getDB().execute(
        `INSERT OR IGNORE INTO sub_customers (id, owner_customer_id, name) VALUES (?,?,?)`,
        [`SC${Date.now()}`, ownerCustomerId, trimmed]
      );
    } catch (e) { console.error('saveSubCustomer error:', e); }
  },
};
