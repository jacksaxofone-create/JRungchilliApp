import { open } from '@op-engineering/op-sqlite';

let _db: any = null;

export function getDB() {
  if (!_db) {
    console.log('[DB] Opening...');
      _db = open({ name: 'jrungchilli.db', location: 'default' });
      console.log('[DB] Opened OK');
  }
  return _db;
}

/**
 * getRows — รองรับทุก format ที่ op-sqlite v15+ อาจ return:
 *
 * op-sqlite v15.x:
 *   execute()     → { rows: any[], metadata: any[] }  (rows เป็น array โดยตรง)
 *   executeSync() → { rows: any[], metadata: any[] }  (เหมือนกัน)
 *
 * format เก่า (compat):
 *   rows._array   → SQLite plugin เก่า
 *   rows.item(i)  → expo-sqlite style
 *   rawData       → format พิเศษบางตัว
 *   Array         → return ตรง ๆ
 */
export function getRows(result: any): any[] {
  if (!result) return [];

  // 1. Result เป็น array โดยตรง
  if (Array.isArray(result)) return result;

  // 2. op-sqlite v15: { rows: any[], metadata: ... }
  if (result.rows !== undefined) {
    // rows เป็น plain array (op-sqlite v15 default)
    if (Array.isArray(result.rows)) return result.rows;
    // rows._array (SQLite plugin รุ่นเก่า)
    if (result.rows && Array.isArray(result.rows._array)) return result.rows._array;
    // rows.item() style (expo-sqlite)
    if (result.rows && typeof result.rows.item === 'function') {
      const arr: any[] = [];
      const len = result.rows.length ?? 0;
      for (let i = 0; i < len; i++) arr.push(result.rows.item(i));
      return arr;
    }
  }

  // 3. rawData format
  if (Array.isArray(result.rawData)) return result.rawData;

  // 4. op-sqlite อาจ return array ใน insertId/rowsAffected format
  if (result.insertId !== undefined) return [];

  return [];
}

// synchronous โ€” เนเธกเนเนเธเน async เน€เธเธฃเธฒเธฐ op-sqlite เน€เธเนเธ sync
export function initDB(): void {
  const db = getDB();

  db.executeSync(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT
  )`);

  db.executeSync(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name_th TEXT, name_mm TEXT, name_en TEXT, name_cn TEXT,
    category TEXT, unit TEXT,
    price_retail REAL, price_wholesale REAL,
    stock_kg REAL, min_stock_kg REAL,
    image_uri TEXT,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT
  )`);

  db.executeSync(`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    shop_name TEXT, phone TEXT, notes TEXT, password TEXT,
    customer_type TEXT DEFAULT 'retail',
    credit_limit REAL DEFAULT 0,
    credit_used REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    image_uri TEXT DEFAULT ''
  )`);

  // orders table โ€” full schema with pack fields + order_type
  db.executeSync(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT, customer_id TEXT,
    customer_name TEXT, customer_phone TEXT,
    subtotal REAL, discount REAL, total REAL,
    payment_method TEXT, payment_status TEXT,
    status TEXT, notes TEXT,
    order_type TEXT DEFAULT 'walk_in',
    pack_status TEXT DEFAULT 'waiting',
    scheduled_date TEXT DEFAULT '',
    confirmed_by TEXT DEFAULT '',
    confirmed_at TEXT DEFAULT '',
    packed_at TEXT DEFAULT '',
    created_at TEXT, updated_at TEXT
  )`);

  // order_items โ€” full schema with packing fields
  db.executeSync(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT, product_id TEXT,
    product_name_th TEXT, product_name_mm TEXT,
    product_name_en TEXT, product_name_cn TEXT,
    quantity_kg REAL, unit_price REAL, total_price REAL,
    requested_kg REAL DEFAULT 0,
    actual_kg REAL DEFAULT 0,
    actual_weight_kg REAL DEFAULT 0,
    item_notes TEXT DEFAULT '',
    is_packed INTEGER DEFAULT 0,
    packed_at TEXT DEFAULT ''
  )`);

  db.executeSync(`CREATE TABLE IF NOT EXISTS credit_records (
    id TEXT PRIMARY KEY,
    customer_id TEXT, customer_name TEXT,
    order_id TEXT, order_number TEXT,
    amount REAL, amount_paid REAL,
    due_date TEXT, paid_date TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT
  )`);

  // sub_customers โ€” เธฃเธฒเธขเธเธทเนเธญเธฅเธนเธเธเนเธฒเธเธญเธเธเธนเนเธเนเธฒเธชเนเธ (เธฅเธนเธเธเนเธฒเธเธญเธเธฅเธนเธเธเนเธฒ)
  db.executeSync(`CREATE TABLE IF NOT EXISTS sub_customers (
    id TEXT PRIMARY KEY,
    owner_customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_customer_id, name)
  )`);
  db.executeSync(`CREATE INDEX IF NOT EXISTS idx_sub_customers_owner ON sub_customers(owner_customer_id)`);

  // Migrate existing tables โ€” add missing columns safely
  const safeAdd = (table: string, col: string, type: string, def: string = '') => {
    try {
      db.executeSync(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}${def ? ' DEFAULT ' + def : ''}`);
    } catch (_) { /* column already exists โ€” ignore */ }
  };

  // orders migrations
  safeAdd('orders', 'order_type', 'TEXT', "'walk_in'");
  safeAdd('orders', 'pack_status', 'TEXT', "'waiting'");
  safeAdd('orders', 'scheduled_date', 'TEXT', "''");
  safeAdd('orders', 'confirmed_by', 'TEXT', "''");
  safeAdd('orders', 'confirmed_at', 'TEXT', "''");
  safeAdd('orders', 'packed_at', 'TEXT', "''");

  // order_items migrations
  safeAdd('order_items', 'requested_kg', 'REAL', '0');
  safeAdd('order_items', 'actual_kg', 'REAL', '0');
  safeAdd('order_items', 'actual_weight_kg', 'REAL', '0');
  safeAdd('order_items', 'item_notes', 'TEXT', "''");
  safeAdd('order_items', 'packed_at', 'TEXT', "''");

  // customers migrations
  safeAdd('customers', 'image_uri', 'TEXT', "''");

  // default settings
  const defaults: Record<string, string> = {
    admin_pin:      '4840402036',
    cashier_pin:    '1234',
    shop_name:      'เจรุ่งชิลลี่',
    shop_address:   'แม่สอด',
    language:       'th',
    change_fund:    '500',
    cashier_pin_rotate_days: '5',
    cashier_pin_last_changed: new Date().toISOString().split('T')[0],
  };
  for (const [k, v] of Object.entries(defaults)) {
    db.executeSync(`INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, [k, v]);
  }

  // เน€เธเนเธ seeded
  const seedCheck = getRows(db.executeSync(`SELECT value FROM settings WHERE key='seeded'`));
  const isSeeded  = seedCheck.length > 0 && seedCheck[0]?.value === '1';

  if (!isSeeded) {
    db.executeSync(`DELETE FROM products`);
    db.executeSync(`DELETE FROM customers`);

    const now = new Date().toISOString();

    const products: any[][] = [
      ['p001','พริกหวานเขียว','ငြိပ်သီးချိုစိမ်း','Green Bell Pepper','青椒','พริก',45,38,50],
      ['p002','พริกหวานแดง','ငြိပ်သီးချိုနီ','Red Bell Pepper','红椒','พริก',50,42,40],
      ['p003','พริกหวานเหลือง','ငြိပ်သီးချိုဝါ','Yellow Bell Pepper','黄椒','พริก',55,46,30],
      ['p004','พริกขี้หนู','ငြိပ်သီးငယ်','Bird Eye Chili','小辣椒','พริก',80,68,25],
      ['p005','พริกฮอทแดง','ငြိပ်သီးနီကြီး','Hot Red Chili','红辣椒','พริก',60,50,35],
      ['p006','พริกฮอทเขียว','ငြိပ်သီးစိမ်းကြီး','Hot Green Chili','青辣椒','พริก',55,46,35],
      ['p007','พริกเหลือง','ငြိပ်သီးဝါငယ်','Yellow Chili','黄辣椒','พริก',50,42,20],
      ['p008','พริกยำขาว','ငြိပ်သီးဖြူ','White Chili','白辣椒','พริก',65,55,15],
      ['p009','พริกยำแดง','ငြိပ်သီးနီမော့','Red Yum Chili','红拌椒','พริก',65,55,15],
      ['p010','พริกยำเขียว','ငြိပ်သီးစိမ်းမော့','Green Yum Chili','绿拌椒','พริก',65,55,15],
      ['p011','ผักบุ้งจีน','ကန်စွန်းတောင်','Morning Glory','空心菜','ผัก',25,20,60],
      ['p012','มะระหวาน','ဆိတ်ကြိုး','Bitter Gourd','苦瓜','ผัก',30,25,40],
      ['p013','มะเขือยาว','ခရမ်းကြိုး','Eggplant','茄子','ผัก',28,23,45],
      ['p014','ข้าวโพด','ပြောင်းဖူး','Corn','玉米','ผัก',20,16,80],
      ['p015','หอมแห้ง','ကြက်သွန်ဖြူကြီး','Onion','洋葱','ผัก',35,28,70],
      ['p016','มันฝรั่ง','အာလူး','Potato','土豆','ผัก',32,26,60],
      ['p017','แครอท','ကာရုန်းနီ','Carrot','胡萝卜','ผัก',30,24,55],
      ['p018','แตงกวาญี่ปุ่น','သခွားတောင်ပြည်','Japanese Cucumber','日本黄瓜','ผัก',40,33,30],
      ['p019','ต้นหอม','ကြက်သွန်','Spring Onion','葱','ผัก',20,16,50],
      ['p020','ผักชี','နံနံပင်','Coriander','香菜','ผัก',25,20,30],
      ['p021','ผักหอมญี่ปุ่น','ကြဲပင်ကြက်သွန်ကြိုး','Japanese Leek','日本大葱','ผัก',45,37,20],
      ['p022','ตั๋งโอ','တန်းအိုး','Crown Daisy','茼蒿','ผัก',22,18,35],
    ];

    for (const p of products) {
      db.executeSync(
        `INSERT INTO products
         (id,name_th,name_mm,name_en,name_cn,category,unit,
          price_retail,price_wholesale,stock_kg,min_stock_kg,image_uri,is_active,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p[0],p[1],p[2],p[3],p[4],p[5],'เธเธ.',
         Number(p[6]),Number(p[7]),Number(p[8]),10,'',1,now]
      );
    }

    db.executeSync(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at,image_uri)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['c001','ร้านแม่สอดเจริญ','055-111-222','ลูกค้าประจำ','1234','wholesale',5000,0,1,now,'']
    );
    db.executeSync(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at,image_uri)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['c002','ร้านสมสมาย','055-333-444','','5678','retail',2000,0,1,now,'']
    );

    db.executeSync(`INSERT OR REPLACE INTO settings (key,value) VALUES ('seeded','1')`);
    console.log('โ… Seeded 22 products + 2 customers');
  }
}


