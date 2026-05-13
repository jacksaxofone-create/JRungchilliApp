import { open } from '@op-engineering/op-sqlite';

let db: any = null;

export const DatabaseService = {
  async init(): Promise<void> {
    try {
      db = open({ name: 'jrungchilli.db' });
      await this.createTables();
      await this.seedDefaultData();
    } catch(e) { console.error('DB init error:', e); }
  },

  async createTables(): Promise<void> {
    if (!db) return;
    db.execute(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name_th TEXT, name_mm TEXT, name_en TEXT, name_cn TEXT,
      category TEXT, unit TEXT, price_retail REAL, price_wholesale REAL,
      stock_kg REAL, min_stock_kg REAL, image_url TEXT, is_active INTEGER DEFAULT 1,
      updated_at TEXT)`);
    db.execute(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT, phone TEXT, customer_type TEXT,
      credit_limit REAL DEFAULT 0, credit_used REAL DEFAULT 0,
      password TEXT, address TEXT, created_at TEXT)`);
    db.execute(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, order_number TEXT, customer_id TEXT, customer_name TEXT,
      customer_phone TEXT, subtotal REAL, discount REAL DEFAULT 0, total REAL,
      payment_method TEXT, payment_status TEXT, status TEXT,
      notes TEXT, created_at TEXT, updated_at TEXT, is_synced INTEGER DEFAULT 0)`);
    db.execute(`CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT, product_id TEXT,
      product_name_th TEXT, product_name_mm TEXT, product_name_en TEXT,
      quantity_kg REAL, unit_price REAL, total_price REAL, is_packed INTEGER DEFAULT 0)`);
    db.execute(`CREATE TABLE IF NOT EXISTS credit_records (
      id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, order_id TEXT,
      order_number TEXT, amount REAL, amount_paid REAL DEFAULT 0,
      due_date TEXT, paid_date TEXT, status TEXT, created_at TEXT)`);
    db.execute(`CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY, table_name TEXT, record_id TEXT,
      action TEXT, data TEXT, created_at TEXT)`);
  },

  async seedDefaultData(): Promise<void> {
    if (!db) return;
    const result = db.execute('SELECT COUNT(*) as count FROM products');
    const count = result.rows?._array?.[0]?.count ?? 0;
    if (count > 0) return;
    const now = new Date().toISOString();
    const defaults = [
      { id:'p001', name_th:'พริกสด', name_mm:'ငရုတ်သီးစိမ်း', name_en:'Fresh Chili', name_cn:'新鲜辣椒', price_retail:80, price_wholesale:65, stock_kg:500 },
      { id:'p002', name_th:'พริกแห้ง', name_mm:'ငရုတ်သီးခြောက်', name_en:'Dried Chili', name_cn:'干辣椒', price_retail:120, price_wholesale:100, stock_kg:300 },
      { id:'p003', name_th:'พริกขี้หนู', name_mm:'ငရုတ်သီးကလေး', name_en:'Bird Eye Chili', name_cn:'小辣椒', price_retail:150, price_wholesale:130, stock_kg:200 },
      { id:'p004', name_th:'พริกหวาน', name_mm:'ငရုတ်သီးချို', name_en:'Sweet Pepper', name_cn:'甜椒', price_retail:60, price_wholesale:45, stock_kg:400 },
      { id:'p005', name_th:'พริกชี้ฟ้า', name_mm:'ငရုတ်သီးစောင်း', name_en:'Cayenne Pepper', name_cn:'长辣椒', price_retail:70, price_wholesale:55, stock_kg:350 },
    ];
    for (const p of defaults) {
      db.execute(
        `INSERT INTO products (id,name_th,name_mm,name_en,name_cn,category,unit,
         price_retail,price_wholesale,stock_kg,min_stock_kg,is_active,updated_at)
         VALUES (?,?,?,?,?,'ผัก','กก.',?,?,?,10,1,?)`,
        [p.id,p.name_th,p.name_mm,p.name_en,p.name_cn,
         p.price_retail,p.price_wholesale,p.stock_kg,now]
      );
    }
  },

  async getAllProducts(): Promise<any[]> {
    if (!db) return [];
    const result = db.execute('SELECT * FROM products WHERE is_active=1 ORDER BY name_th');
    return result.rows?._array ?? [];
  },

  async upsertProduct(product: any): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT OR REPLACE INTO products
       (id,name_th,name_mm,name_en,name_cn,category,unit,
        price_retail,price_wholesale,stock_kg,min_stock_kg,is_active,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [product.id,product.name_th,product.name_mm,product.name_en,product.name_cn,
       product.category,product.unit,product.price_retail,product.price_wholesale,
       product.stock_kg,product.min_stock_kg,product.is_active?1:0,product.updated_at]
    );
  },

  async updateProductPrice(id: string, retail: number, wholesale: number): Promise<void> {
    if (!db) return;
    db.execute('UPDATE products SET price_retail=?,price_wholesale=?,updated_at=? WHERE id=?',
      [retail,wholesale,new Date().toISOString(),id]);
  },

  async getAllCustomers(): Promise<any[]> {
    if (!db) return [];
    const result = db.execute('SELECT * FROM customers ORDER BY name');
    return result.rows?._array ?? [];
  },

  async upsertCustomer(customer: any): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT OR REPLACE INTO customers
       (id,name,phone,customer_type,credit_limit,password,address,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [customer.id,customer.name,customer.phone,customer.customer_type??'retail',
       customer.credit_limit??0,customer.password??'',
       customer.address??'',customer.created_at??new Date().toISOString()]
    );
  },

  async saveOrder(order: any, items: any[]): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT INTO orders
       (id,order_number,customer_id,customer_name,customer_phone,
        subtotal,discount,total,payment_method,payment_status,
        status,notes,created_at,updated_at,is_synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
      [order.id,order.order_number,order.customer_id??'',order.customer_name??'',
       order.customer_phone??'',order.subtotal,order.discount??0,order.total,
       order.payment_method,order.payment_status,order.status,
       order.notes??'',order.created_at,order.updated_at]
    );
    for (const item of items) {
      db.execute(
        `INSERT INTO order_items
         (id,order_id,product_id,product_name_th,product_name_mm,
          product_name_en,quantity_kg,unit_price,total_price,is_packed)
         VALUES (?,?,?,?,?,?,?,?,?,0)`,
        [item.id,order.id,item.product_id,item.product_name_th??'',
         item.product_name_mm??'',item.product_name_en??'',
         item.quantity_kg,item.unit_price,item.total_price]
      );
    }
  },

  async getOrdersToday(): Promise<any[]> {
    if (!db) return [];
    const today = new Date().toISOString().split('T')[0];
    const result = db.execute(
      "SELECT * FROM orders WHERE created_at LIKE ? ORDER BY created_at DESC",
      [`${today}%`]
    );
    return result.rows?._array ?? [];
  },

  async getOrderItems(orderId: string): Promise<any[]> {
    if (!db) return [];
    const result = db.execute('SELECT * FROM order_items WHERE order_id=?',[orderId]);
    return result.rows?._array ?? [];
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    if (!db) return;
    db.execute('UPDATE orders SET status=?,updated_at=? WHERE id=?',
      [status,new Date().toISOString(),orderId]);
  },

  async getMasterPickList(): Promise<any[]> {
    if (!db) return [];
    const today = new Date().toISOString().split('T')[0];
    const result = db.execute(`
      SELECT oi.product_name_th,oi.product_name_mm,oi.product_name_en,
             SUM(oi.quantity_kg) as total_kg
      FROM order_items oi JOIN orders o ON oi.order_id=o.id
      WHERE o.created_at LIKE ? AND o.status IN ('pending','packing')
      GROUP BY oi.product_id`,
      [`${today}%`]
    );
    return result.rows?._array ?? [];
  },

  async getDashboardStats(): Promise<any> {
    if (!db) return { revenueToday:0, ordersToday:0, pendingOrders:0, overdueCredit:0 };
    const today = new Date().toISOString().split('T')[0];
    const rev = db.execute(
      "SELECT SUM(total) as total FROM orders WHERE created_at LIKE ? AND payment_status='paid'",
      [`${today}%`]);
    const ord = db.execute(
      "SELECT COUNT(*) as count FROM orders WHERE created_at LIKE ?",
      [`${today}%`]);
    const pen = db.execute("SELECT COUNT(*) as count FROM orders WHERE status='pending'");
    const cred = db.execute(
      "SELECT SUM(amount-amount_paid) as total FROM credit_records WHERE status='overdue'");
    return {
      revenueToday: rev.rows?._array?.[0]?.total ?? 0,
      ordersToday:  ord.rows?._array?.[0]?.count ?? 0,
      pendingOrders: pen.rows?._array?.[0]?.count ?? 0,
      overdueCredit: cred.rows?._array?.[0]?.total ?? 0,
    };
  },

  async addToSyncQueue(tableName: string, recordId: string, action: string, data: string): Promise<void> {
    if (!db) return;
    db.execute(
      'INSERT INTO sync_queue (id,table_name,record_id,action,data,created_at) VALUES (?,?,?,?,?,?)',
      [`sq_${Date.now()}`,tableName,recordId,action,data,new Date().toISOString()]
    );
  },

  async getSyncQueue(): Promise<any[]> {
    if (!db) return [];
    const result = db.execute('SELECT * FROM sync_queue ORDER BY created_at ASC');
    return result.rows?._array ?? [];
  },

  async deleteSyncQueueItem(id: string): Promise<void> {
    if (!db) return;
    db.execute('DELETE FROM sync_queue WHERE id=?',[id]);
  },
};