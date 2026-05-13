import { open, OPSQLiteConnection } from '@op-engineering/op-sqlite';

let db: OPSQLiteConnection | null = null;

export const DatabaseService = {

  async init() {
    db = open({ name: 'jrungchilli.db' });
    await this.createTables();
    await this.seedDefaultData();
  },

  async createTables() {
    if (!db) return;
    db.execute(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name_th TEXT NOT NULL,
      name_mm TEXT DEFAULT '',
      name_en TEXT DEFAULT '',
      name_cn TEXT DEFAULT '',
      price_retail REAL DEFAULT 0,
      price_wholesale REAL DEFAULT 0,
      stock_kg REAL DEFAULT 0,
      unit TEXT DEFAULT 'kg',
      image_uri TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    )`);
    db.execute(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name_th TEXT NOT NULL,
      name_mm TEXT DEFAULT '',
      name_en TEXT DEFAULT '',
      name_cn TEXT DEFAULT '',
      owner_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      pin TEXT NOT NULL,
      credit_limit REAL DEFAULT 0,
      credit_used REAL DEFAULT 0,
      credit_status TEXT DEFAULT 'normal',
      has_delivery INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.execute(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL,
      customer_id TEXT DEFAULT NULL,
      customer_name TEXT DEFAULT '',
      order_name TEXT DEFAULT '',
      order_type TEXT DEFAULT 'walk_in',
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      total_amount REAL DEFAULT 0,
      total_items REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      pickup_time TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.execute(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      weight_kg REAL DEFAULT 0,
      price_per_kg REAL DEFAULT 0,
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'kg',
      subtotal REAL DEFAULT 0
    )`);
    db.execute(`CREATE TABLE IF NOT EXISTS credit_records (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_id TEXT DEFAULT '',
      amount REAL DEFAULT 0,
      type TEXT DEFAULT 'debit',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.execute(`CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  },

  async seedDefaultData() {
    if (!db) return;
    const check = db.execute(`SELECT COUNT(*) as cnt FROM products`);
    const cnt = check.rows?._array?.[0]?.cnt ?? 0;
    if (cnt > 0) return;

    const products = [
      { id:'p001', name_th:'พริกหวานเขียว',   name_mm:'ငရုတ်ချိုစိမ်း',    name_en:'Green Sweet Pepper',  name_cn:'青甜椒',   retail:80,  wholesale:60  },
      { id:'p002', name_th:'พริกหวานแดง',     name_mm:'ငရုတ်ချိုနီ',      name_en:'Red Sweet Pepper',    name_cn:'红甜椒',   retail:80,  wholesale:60  },
      { id:'p003', name_th:'พริกหวานเหลือง',  name_mm:'ငရုတ်ချိုဝါ',      name_en:'Yellow Sweet Pepper', name_cn:'黄甜椒',   retail:85,  wholesale:65  },
      { id:'p004', name_th:'พริกขี้หนู',       name_mm:'ငရုတ်သေး',         name_en:'Bird Eye Chili',      name_cn:'小米辣',   retail:120, wholesale:95  },
      { id:'p005', name_th:'พริกฮอทแดง',      name_mm:'ငရုတ်ဟော့နီ',     name_en:'Red Hot Chili',       name_cn:'红热辣椒', retail:100, wholesale:78  },
      { id:'p006', name_th:'พริกฮอทเขียว',    name_mm:'ငရုတ်ဟော့စိမ်း',  name_en:'Green Hot Chili',     name_cn:'绿热辣椒', retail:100, wholesale:78  },
      { id:'p007', name_th:'พริกเหลือง',      name_mm:'ငရုတ်ဝါ',          name_en:'Yellow Chili',        name_cn:'黄辣椒',   retail:90,  wholesale:70  },
      { id:'p008', name_th:'พริกยำขาว',       name_mm:'ငရုတ်ဖြူ',         name_en:'White Salad Chili',   name_cn:'白沙拉椒', retail:85,  wholesale:65  },
      { id:'p009', name_th:'พริกยำแดง',       name_mm:'ငရုတ်နီ(သုပ်)',    name_en:'Red Salad Chili',     name_cn:'红沙拉椒', retail:85,  wholesale:65  },
      { id:'p010', name_th:'พริกยำเขียว',     name_mm:'ငရုတ်စိမ်း(သုပ်)', name_en:'Green Salad Chili',   name_cn:'绿沙拉椒', retail:85,  wholesale:65  },
      { id:'p011', name_th:'ผักบุ้งจีน',      name_mm:'ဟင်းနုနွယ်တရုတ်', name_en:'Chinese Water Spinach',name_cn:'空心菜',  retail:40,  wholesale:30  },
      { id:'p012', name_th:'มะระหวาน',        name_mm:'ကြက်သွန်မြင်း',   name_en:'Sweet Bitter Gourd',  name_cn:'苦瓜',    retail:45,  wholesale:35  },
      { id:'p013', name_th:'มะเขือยาว',       name_mm:'ခရမ်းရှည်',        name_en:'Long Eggplant',       name_cn:'长茄子',   retail:40,  wholesale:30  },
      { id:'p014', name_th:'ข้าวโพด',         name_mm:'ပြောင်းဖူး',       name_en:'Corn',                name_cn:'玉米',    retail:35,  wholesale:25  },
      { id:'p015', name_th:'หอมใหญ่',         name_mm:'ကြက်သွန်ကြီး',    name_en:'Onion',               name_cn:'洋葱',    retail:50,  wholesale:38  },
      { id:'p016', name_th:'มันฝรั่ง',        name_mm:'အာလူး',            name_en:'Potato',              name_cn:'土豆',    retail:45,  wholesale:35  },
      { id:'p017', name_th:'แครอท',           name_mm:'မုန်လာဥနီ',       name_en:'Carrot',              name_cn:'胡萝卜',   retail:50,  wholesale:38  },
      { id:'p018', name_th:'แตงกวาญี่ปุ่น',   name_mm:'သခွားဂျပန်',      name_en:'Japanese Cucumber',   name_cn:'日本黄瓜', retail:55,  wholesale:42  },
      { id:'p019', name_th:'ต้นหอม',          name_mm:'မြိတ်',            name_en:'Spring Onion',        name_cn:'葱',      retail:60,  wholesale:45  },
      { id:'p020', name_th:'ผักชี',           name_mm:'နံနံပင်',          name_en:'Coriander',           name_cn:'香菜',    retail:70,  wholesale:55  },
      { id:'p021', name_th:'ผักหอมญี่ปุ่น',   name_mm:'ဂျပန်မွှေးရွက်',  name_en:'Japanese Parsley',    name_cn:'日本香菜', retail:75,  wholesale:58  },
      { id:'p022', name_th:'ตั้งโอ๋',         name_mm:'တန်အို',           name_en:'Chrysanthemum Green', name_cn:'茼蒿',    retail:55,  wholesale:42  },
    ];

    for (const p of products) {
      db.execute(
        `INSERT OR IGNORE INTO products
         (id,name_th,name_mm,name_en,name_cn,
          price_retail,price_wholesale,stock_kg,unit,is_active)
         VALUES (?,?,?,?,?,?,?,?,?,1)`,
        [p.id, p.name_th, p.name_mm, p.name_en, p.name_cn,
         p.retail, p.wholesale, 100, 'kg']
      );
    }

    const customers = [
      {
        id:'c001', name_th:'ร้าน JRUNG CHILLI (ทดสอบ)',
        name_mm:'JRUNG CHILLI ဆိုင်', name_en:'JRUNG CHILLI Test',
        name_cn:'JRUNG辣椒店',
        owner:'เจ้าของร้าน', phone:'0800000000',
        address:'ร้านเจริญชิลลี่', pin:'1234',
        credit:100000, delivery:1
      },
      {
        id:'c002', name_th:'ร้านค้าส่งแม่สอด A',
        name_mm:'မဲဆောက် A ဆိုင်', name_en:'Mae Sot Wholesale A',
        name_cn:'湄索批发A',
        owner:'สมชาย ใจดี', phone:'0812345678',
        address:'123 ถ.ใหญ่ แม่สอด ตาก 63110',
        pin:'2345', credit:50000, delivery:1
      },
      {
        id:'c003', name_th:'ร้านค้าส่งแม่สอด B',
        name_mm:'မဲဆောက် B ဆိုင်', name_en:'Mae Sot Wholesale B',
        name_cn:'湄索批发B',
        owner:'สุดา มีชัย', phone:'0823456789',
        address:'456 ตลาดสด แม่สอด ตาก 63110',
        pin:'3456', credit:30000, delivery:1
      },
      {
        id:'c004', name_th:'ร้านอาหารพม่าทองดี',
        name_mm:'ရွှေကောင်းမြန်မာဆိုင်', name_en:'Golden Myanmar Restaurant',
        name_cn:'金缅甸餐厅',
        owner:'Mg Kyaw', phone:'0834567890',
        address:'789 ชุมชนพม่า แม่สอด ตาก',
        pin:'4567', credit:20000, delivery:0
      },
      {
        id:'c005', name_th:'ร้านผักสดตลาดเช้า',
        name_mm:'နံနက်ဈေး လတ်ဆတ်သောဟင်းသီးဟင်းရွက်ဆိုင်',
        name_en:'Morning Market Fresh Veg',
        name_cn:'早市新鲜蔬菜店',
        owner:'วิไล สดใส', phone:'0845678901',
        address:'ตลาดเช้า แม่สอด ตาก',
        pin:'5678', credit:15000, delivery:0
      },
    ];

    for (const c of customers) {
      db.execute(
        `INSERT OR IGNORE INTO customers
         (id,name_th,name_mm,name_en,name_cn,owner_name,phone,address,
          pin,credit_limit,credit_used,credit_status,has_delivery,is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,0,'normal',?,1)`,
        [c.id, c.name_th, c.name_mm, c.name_en, c.name_cn,
         c.owner, c.phone, c.address, c.pin, c.credit, c.delivery]
      );
    }
  },

  async getAllProducts(): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM products WHERE is_active=1 ORDER BY name_th`
    );
    return r.rows?._array ?? [];
  },

  async upsertProduct(product: any): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT OR REPLACE INTO products
       (id,name_th,name_mm,name_en,name_cn,price_retail,price_wholesale,
        stock_kg,unit,image_uri,is_active,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,
      [
        product.id, product.name_th, product.name_mm ?? '',
        product.name_en ?? '', product.name_cn ?? '',
        product.price_retail ?? 0, product.price_wholesale ?? 0,
        product.stock_kg ?? 0, product.unit ?? 'kg',
        product.image_uri ?? '', product.is_active ?? 1,
      ]
    );
    await this.addToSyncQueue('products', product.id, 'upsert',
      JSON.stringify(product));
  },

  async updateProductPrice(id: string, retail: number, wholesale: number): Promise<void> {
    if (!db) return;
    db.execute(
      `UPDATE products SET price_retail=?, price_wholesale=?,
       updated_at=datetime('now') WHERE id=?`,
      [retail, wholesale, id]
    );
  },

  async getAllCustomers(): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM customers WHERE is_active=1 ORDER BY name_th`
    );
    return r.rows?._array ?? [];
  },

  async getCustomerByIdAndPin(id: string, pin: string): Promise<any | null> {
    if (!db) return null;
    const r = db.execute(
      `SELECT * FROM customers WHERE id=? AND pin=? AND is_active=1`,
      [id, pin]
    );
    return r.rows?._array?.[0] ?? null;
  },

  async upsertCustomer(customer: any): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT OR REPLACE INTO customers
       (id,name_th,name_mm,name_en,name_cn,owner_name,phone,address,
        pin,credit_limit,credit_used,credit_status,has_delivery,notes,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customer.id, customer.name_th, customer.name_mm ?? '',
        customer.name_en ?? '', customer.name_cn ?? '',
        customer.owner_name ?? '', customer.phone ?? '',
        customer.address ?? '', customer.pin,
        customer.credit_limit ?? 0, customer.credit_used ?? 0,
        customer.credit_status ?? 'normal',
        customer.has_delivery ?? 0, customer.notes ?? '',
        customer.is_active ?? 1,
      ]
    );
  },

  async updateCustomerCredit(id: string, creditUsed: number, status: string): Promise<void> {
    if (!db) return;
    db.execute(
      `UPDATE customers SET credit_used=?, credit_status=? WHERE id=?`,
      [creditUsed, status, id]
    );
  },

  async saveOrder(order: any, items: any[]): Promise<void> {
    if (!db) return;
    const totalItems = items.reduce(
      (s, i) => s + (i.quantity ?? i.weight_kg ?? 0), 0
    );
    db.execute(
      `INSERT OR REPLACE INTO orders
       (id,order_number,customer_id,customer_name,order_name,order_type,
        status,payment_status,total_amount,total_items,notes,pickup_time,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        order.id, order.order_number,
        order.customer_id ?? null, order.customer_name ?? '',
        order.order_name ?? '', order.order_type ?? 'walk_in',
        order.status ?? 'pending', order.payment_status ?? 'unpaid',
        order.total_amount ?? 0, totalItems,
        order.notes ?? '', order.pickup_time ?? '',
        order.created_at ?? new Date().toISOString(),
      ]
    );
    for (const item of items) {
      db.execute(
        `INSERT INTO order_items
         (order_id,product_id,product_name,weight_kg,
          price_per_kg,quantity,unit,subtotal)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          order.id, item.product_id, item.product_name ?? '',
          item.weight_kg ?? 0, item.price_per_kg ?? 0,
          item.quantity ?? item.weight_kg ?? 0,
          item.unit ?? 'kg', item.subtotal ?? 0,
        ]
      );
    }
    await this.addToSyncQueue('orders', order.id, 'create',
      JSON.stringify(order));
  },

  async getOrdersToday(): Promise<any[]> {
    if (!db) return [];
    const today = new Date().toISOString().slice(0, 10);
    const r = db.execute(
      `SELECT * FROM orders WHERE date(created_at)=?
       ORDER BY created_at DESC`,
      [today]
    );
    return r.rows?._array ?? [];
  },

  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM orders WHERE customer_id=?
       ORDER BY created_at DESC LIMIT 50`,
      [customerId]
    );
    return r.rows?._array ?? [];
  },

  async getOrderItems(orderId: string): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM order_items WHERE order_id=?`, [orderId]
    );
    return r.rows?._array ?? [];
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    if (!db) return;
    db.execute(
      `UPDATE orders SET status=? WHERE id=?`, [status, orderId]
    );
  },

  async updateOrderPayment(orderId: string, paymentStatus: string): Promise<void> {
    if (!db) return;
    db.execute(
      `UPDATE orders SET payment_status=? WHERE id=?`,
      [paymentStatus, orderId]
    );
  },

  async getMasterPickList(): Promise<any[]> {
    if (!db) return [];
    const today = new Date().toISOString().slice(0, 10);
    const r = db.execute(
      `SELECT oi.product_name as name,
              SUM(oi.weight_kg) as totalKg
       FROM order_items oi
       JOIN orders o ON oi.order_id=o.id
       WHERE date(o.created_at)=?
         AND o.status NOT IN ('cancelled')
       GROUP BY oi.product_id, oi.product_name
       ORDER BY totalKg DESC`,
      [today]
    );
    return r.rows?._array ?? [];
  },

  async saveCreditRecord(record: any): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT OR REPLACE INTO credit_records
       (id,customer_id,order_id,amount,type,note,created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [
        record.id, record.customer_id, record.order_id ?? '',
        record.amount ?? 0, record.type ?? 'debit',
        record.note ?? '',
        record.created_at ?? new Date().toISOString(),
      ]
    );
  },

  async getAllCreditRecords(): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT cr.*, c.name_th as customer_name
       FROM credit_records cr
       LEFT JOIN customers c ON cr.customer_id=c.id
       ORDER BY cr.created_at DESC`
    );
    return r.rows?._array ?? [];
  },

  async getCreditByCustomer(customerId: string): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM credit_records
       WHERE customer_id=? ORDER BY created_at DESC`,
      [customerId]
    );
    return r.rows?._array ?? [];
  },

  async getDashboardStats(): Promise<any> {
    if (!db) return {
      revenueToday:0, ordersToday:0, pendingOrders:0, overdueCredit:0
    };
    const today = new Date().toISOString().slice(0, 10);
    const rev  = db.execute(
      `SELECT COALESCE(SUM(total_amount),0) as total
       FROM orders WHERE date(created_at)=? AND payment_status='paid'`,
      [today]
    );
    const ord  = db.execute(
      `SELECT COUNT(*) as cnt FROM orders WHERE date(created_at)=?`,
      [today]
    );
    const pend = db.execute(
      `SELECT COUNT(*) as cnt FROM orders WHERE status='pending'`
    );
    const cred = db.execute(
      `SELECT COALESCE(SUM(credit_used),0) as total
       FROM customers WHERE credit_status='overdue'`
    );
    return {
      revenueToday:  rev.rows?._array?.[0]?.total  ?? 0,
      ordersToday:   ord.rows?._array?.[0]?.cnt    ?? 0,
      pendingOrders: pend.rows?._array?.[0]?.cnt   ?? 0,
      overdueCredit: cred.rows?._array?.[0]?.total ?? 0,
    };
  },

  async addToSyncQueue(
    tableName: string, recordId: string,
    action: string, data: string
  ): Promise<void> {
    if (!db) return;
    db.execute(
      `INSERT INTO sync_queue (table_name,record_id,action,data)
       VALUES (?,?,?,?)`,
      [tableName, recordId, action, data]
    );
  },

  async getSyncQueue(): Promise<any[]> {
    if (!db) return [];
    const r = db.execute(
      `SELECT * FROM sync_queue ORDER BY created_at ASC`
    );
    return r.rows?._array ?? [];
  },

  async deleteSyncQueueItem(id: number): Promise<void> {
    if (!db) return;
    db.execute(`DELETE FROM sync_queue WHERE id=?`, [id]);
  },
};

export default DatabaseService;