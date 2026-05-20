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

export function getRows(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.rows) {
    if (Array.isArray(result.rows)) return result.rows;
    if (result.rows._array) return result.rows._array;
    if (typeof result.rows.item === 'function') {
      const arr: any[] = [];
      for (let i = 0; i < result.rows.length; i++) arr.push(result.rows.item(i));
      return arr;
    }
  }
  if (result.rawData) return result.rawData;
  return [];
}

// synchronous โ€” เนเธกเนเนเธเน async เน€เธเธฃเธฒเธฐ op-sqlite เน€เธเนเธ sync
export function initDB(): void {
  const db = getDB();

  db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT
  )`);

  db.execute(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name_th TEXT, name_mm TEXT, name_en TEXT, name_cn TEXT,
    category TEXT, unit TEXT,
    price_retail REAL, price_wholesale REAL,
    stock_kg REAL, min_stock_kg REAL,
    image_uri TEXT,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT
  )`);

  db.execute(`CREATE TABLE IF NOT EXISTS customers (
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
  db.execute(`CREATE TABLE IF NOT EXISTS orders (
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
  db.execute(`CREATE TABLE IF NOT EXISTS order_items (
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

  db.execute(`CREATE TABLE IF NOT EXISTS credit_records (
    id TEXT PRIMARY KEY,
    customer_id TEXT, customer_name TEXT,
    order_id TEXT, order_number TEXT,
    amount REAL, amount_paid REAL,
    due_date TEXT, paid_date TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT
  )`);

  // sub_customers โ€” เธฃเธฒเธขเธเธทเนเธญเธฅเธนเธเธเนเธฒเธเธญเธเธเธนเนเธเนเธฒเธชเนเธ (เธฅเธนเธเธเนเธฒเธเธญเธเธฅเธนเธเธเนเธฒ)
  db.execute(`CREATE TABLE IF NOT EXISTS sub_customers (
    id TEXT PRIMARY KEY,
    owner_customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_customer_id, name)
  )`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_sub_customers_owner ON sub_customers(owner_customer_id)`);

  // Migrate existing tables โ€” add missing columns safely
  const safeAdd = (table: string, col: string, type: string, def: string = '') => {
    try {
      db.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}${def ? ' DEFAULT ' + def : ''}`);
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
    shop_name:      'เน€เธเธฃเธธเนเธเธเธดเธฅเธฅเธตเน',
    shop_address:   'เนเธกเนเธชเธญเธ”',
    language:       'th',
    change_fund:    '500',
    cashier_pin_rotate_days: '5',
    cashier_pin_last_changed: new Date().toISOString().split('T')[0],
  };
  for (const [k, v] of Object.entries(defaults)) {
    db.execute(`INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, [k, v]);
  }

  // เน€เธเนเธ seeded
  const seedCheck = getRows(db.execute(`SELECT value FROM settings WHERE key='seeded'`));
  const isSeeded  = seedCheck.length > 0 && seedCheck[0]?.value === '1';

  if (!isSeeded) {
    db.execute(`DELETE FROM products`);
    db.execute(`DELETE FROM customers`);

    const now = new Date().toISOString();

    const products: any[][] = [
      ['p001','เธเธฃเธดเธเธซเธงเธฒเธเน€เธเธตเธขเธง','แ€แ€แ€ฏแ€แ€บแ€แ€ฎแ€ธแ€…แ€ญแ€แ€บแ€ธ','Green Bell Pepper','้’ๆค’','เธเธฃเธดเธ',45,38,50],
      ['p002','เธเธฃเธดเธเธซเธงเธฒเธเนเธ”เธ','แ€แ€แ€ฏแ€แ€บแ€แ€ฎแ€ธแ€”แ€ฎ','Red Bell Pepper','็บขๆค’','เธเธฃเธดเธ',50,42,40],
      ['p003','เธเธฃเธดเธเธซเธงเธฒเธเน€เธซเธฅเธทเธญเธ','แ€แ€แ€ฏแ€แ€บแ€แ€ฎแ€ธแ€แ€ซ','Yellow Bell Pepper','้ปๆค’','เธเธฃเธดเธ',55,46,30],
      ['p004','เธเธฃเธดเธเธเธตเนเธซเธเธน','แ€แ€แ€ฏแ€แ€บแ€แ€ฎแ€ธแ€แ€แ€บ','Bird Eye Chili','ๅฐ่พฃๆค’','เธเธฃเธดเธ',80,68,25],
      ['p005','เธเธฃเธดเธเธฎเธญเธ—เนเธ”เธ','แ€แ€แ€ฏแ€แ€บแ€”แ€ฎแ€€แ€ผแ€ฎแ€ธ','Hot Red Chili','็บข่พฃๆค’','เธเธฃเธดเธ',60,50,35],
      ['p006','เธเธฃเธดเธเธฎเธญเธ—เน€เธเธตเธขเธง','แ€แ€แ€ฏแ€แ€บแ€…แ€ญแ€แ€บแ€ธแ€€แ€ผแ€ฎแ€ธ','Hot Green Chili','้’่พฃๆค’','เธเธฃเธดเธ',55,46,35],
      ['p007','เธเธฃเธดเธเน€เธซเธฅเธทเธญเธ','แ€แ€แ€ฏแ€แ€บแ€แ€ฎแ€ธแ€แ€ซแ€แ€แ€บ','Yellow Chili','้ป่พฃๆค’','เธเธฃเธดเธ',50,42,20],
      ['p008','เธเธฃเธดเธเธขเธณเธเธฒเธง','แ€แ€แ€ฏแ€แ€บแ€–แ€ผแ€ฐ','White Chili','็ฝ่พฃๆค’','เธเธฃเธดเธ',65,55,15],
      ['p009','เธเธฃเธดเธเธขเธณเนเธ”เธ','แ€แ€แ€ฏแ€แ€บแ€”แ€ฎแ€แ€ฑแ€ฌแ€แ€บ','Red Yum Chili','็บขๆๆค’','เธเธฃเธดเธ',65,55,15],
      ['p010','เธเธฃเธดเธเธขเธณเน€เธเธตเธขเธง','แ€แ€แ€ฏแ€แ€บแ€…แ€ญแ€แ€บแ€ธแ€แ€ฑแ€ฌแ€แ€บ','Green Yum Chili','็ปฟๆๆค’','เธเธฃเธดเธ',65,55,15],
      ['p011','เธเธฑเธเธเธธเนเธเธเธตเธ','แ€€แ€”แ€บแ€…แ€ฝแ€”แ€บแ€ธแ€แ€ฝแ€€แ€บ','Morning Glory','็ฉบๅฟ่','เธเธฑเธ',25,20,60],
      ['p012','เธกเธฐเธฃเธฐเธซเธงเธฒเธ','แ€แ€ฎแ€ธแ€แ€ฎแ€ธ','Bitter Gourd','่ฆ็“','เธเธฑเธ',30,25,40],
      ['p013','เธกเธฐเน€เธเธทเธญเธขเธฒเธง','แ€แ€แ€แ€บแ€ธแ€แ€ฎแ€ธ','Eggplant','่ๅญ','เธเธฑเธ',28,23,45],
      ['p014','เธเนเธฒเธงเนเธเธ”','แ€•แ€ผแ€ฑแ€ฌแ€แ€บแ€ธแ€–แ€ฐแ€ธ','Corn','็็ฑณ','เธเธฑเธ',20,16,80],
      ['p015','เธซเธญเธกเนเธซเธเน','แ€€แ€ผแ€€แ€บแ€แ€ฝแ€”แ€บแ€–แ€ผแ€ฐแ€€แ€ผแ€ฎแ€ธ','Onion','ๆด่‘ฑ','เธเธฑเธ',35,28,70],
      ['p016','เธกเธฑเธเธเธฃเธฑเนเธ','แ€กแ€ฌแ€แ€ฐแ€ธ','Potato','ๅ่ฑ','เธเธฑเธ',32,26,60],
      ['p017','เนเธเธฃเธญเธ—','แ€แ€ฏแ€”แ€บแ€แ€ฌแ€ฅแ€”แ€ฎ','Carrot','่ก่ๅ','เธเธฑเธ',30,24,55],
      ['p018','เนเธ•เธเธเธงเธฒเธเธตเนเธเธธเนเธ','แ€แ€แ€ฝแ€ฌแ€ธแ€แ€ฝแ€ฑแ€ธแ€แ€ปแ€•แ€”แ€บ','Japanese Cucumber','ๆ—ฅๆฌ้ป็“','เธเธฑเธ',40,33,30],
      ['p019','เธ•เนเธเธซเธญเธก','แ€แ€ผแ€ญแ€แ€บ','Spring Onion','่‘ฑ','เธเธฑเธ',20,16,50],
      ['p020','เธเธฑเธเธเธต','แ€”แ€ถแ€”แ€ถแ€•แ€แ€บ','Coriander','้ฆ่','เธเธฑเธ',25,20,30],
      ['p021','เธเธฑเธเธซเธญเธกเธเธตเนเธเธธเนเธ','แ€แ€ปแ€•แ€”แ€บแ€€แ€ผแ€€แ€บแ€แ€ฝแ€”แ€บแ€แ€ผแ€ญแ€แ€บ','Japanese Leek','ๆ—ฅๆฌๅคง่‘ฑ','เธเธฑเธ',45,37,20],
      ['p022','เธ•เธฑเนเธเนเธญเน','แ€แ€”แ€บแ€ธแ€กแ€ญแ€ฏแ€ธ','Crown Daisy','่ผ่’ฟ','เธเธฑเธ',22,18,35],
    ];

    for (const p of products) {
      db.execute(
        `INSERT INTO products
         (id,name_th,name_mm,name_en,name_cn,category,unit,
          price_retail,price_wholesale,stock_kg,min_stock_kg,image_uri,is_active,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p[0],p[1],p[2],p[3],p[4],p[5],'เธเธ.',
         Number(p[6]),Number(p[7]),Number(p[8]),10,'',1,now]
      );
    }

    db.execute(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at,image_uri)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['c001','เธฃเนเธฒเธเนเธกเนเธชเธญเธ”เน€เธเธฃเธดเธ','055-111-222','เธฅเธนเธเธเนเธฒเธเธฃเธฐเธเธณ','1234','wholesale',5000,0,1,now,'']
    );
    db.execute(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at,image_uri)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['c002','เธฃเนเธฒเธเธชเธกเธเธฒเธข','055-333-444','','5678','retail',2000,0,1,now,'']
    );

    db.execute(`INSERT OR REPLACE INTO settings (key,value) VALUES ('seeded','1')`);
    console.log('โ… Seeded 22 products + 2 customers');
  }
}


