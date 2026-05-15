import { open } from '@op-engineering/op-sqlite';

let _db: any = null;

export function getDB() {
  if (!_db) {
    _db = open({ name: 'jrungchilli.db' });
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

// synchronous — ไม่ใช้ async เพราะ op-sqlite เป็น sync
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
    created_at TEXT
  )`);
  db.execute(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT, customer_id TEXT,
    customer_name TEXT, customer_phone TEXT,
    subtotal REAL, discount REAL, total REAL,
    payment_method TEXT, payment_status TEXT,
    status TEXT, notes TEXT,
    created_at TEXT, updated_at TEXT
  )`);
  db.execute(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT, product_id TEXT,
    product_name_th TEXT, product_name_mm TEXT,
    product_name_en TEXT, product_name_cn TEXT,
    quantity_kg REAL, unit_price REAL, total_price REAL,
    is_packed INTEGER DEFAULT 0
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

  // default settings
  const defaults: Record<string, string> = {
    admin_pin:    '0000',
    shop_name:    'เจรุ่งชิลลี่',
    shop_address: 'แม่สอด',
    language:     'th',
    change_fund:  '500',
  };
  for (const [k, v] of Object.entries(defaults)) {
    db.execute(`INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)`, [k, v]);
  }

  // เช็ค seeded
  const seedCheck = getRows(db.execute(`SELECT value FROM settings WHERE key='seeded'`));
  const isSeeded  = seedCheck.length > 0 && seedCheck[0]?.value === '1';

  if (!isSeeded) {
    // ลบของเก่าทั้งหมดก่อน seed ใหม่
    db.execute(`DELETE FROM products`);
    db.execute(`DELETE FROM customers`);

    const now = new Date().toISOString();

    const products: any[][] = [
      ['p001','พริกหวานเขียว','ငရုတ်သီးစိမ်း','Green Bell Pepper','青椒','พริก',45,38,50],
      ['p002','พริกหวานแดง','ငရုတ်သီးနီ','Red Bell Pepper','红椒','พริก',50,42,40],
      ['p003','พริกหวานเหลือง','ငရုတ်သီးဝါ','Yellow Bell Pepper','黄椒','พริก',55,46,30],
      ['p004','พริกขี้หนู','ငရုတ်သီးငယ်','Bird Eye Chili','小辣椒','พริก',80,68,25],
      ['p005','พริกฮอทแดง','ငရုတ်နီကြီး','Hot Red Chili','红辣椒','พริก',60,50,35],
      ['p006','พริกฮอทเขียว','ငရုတ်စိမ်းကြီး','Hot Green Chili','青辣椒','พริก',55,46,35],
      ['p007','พริกเหลือง','ငရုတ်သီးဝါငယ်','Yellow Chili','黄辣椒','พริก',50,42,20],
      ['p008','พริกยำขาว','ငရုတ်ဖြူ','White Chili','白辣椒','พริก',65,55,15],
      ['p009','พริกยำแดง','ငရုတ်နီရောင်','Red Yum Chili','红拌椒','พริก',65,55,15],
      ['p010','พริกยำเขียว','ငရုတ်စိမ်းရောင်','Green Yum Chili','绿拌椒','พริก',65,55,15],
      ['p011','ผักบุ้งจีน','ကန်စွန်းရွက်','Morning Glory','空心菜','ผัก',25,20,60],
      ['p012','มะระหวาน','ဆီးသီး','Bitter Gourd','苦瓜','ผัก',30,25,40],
      ['p013','มะเขือยาว','ခရမ်းသီး','Eggplant','茄子','ผัก',28,23,45],
      ['p014','ข้าวโพด','ပြောင်းဖူး','Corn','玉米','ผัก',20,16,80],
      ['p015','หอมใหญ่','ကြက်သွန်ဖြူကြီး','Onion','洋葱','ผัก',35,28,70],
      ['p016','มันฝรั่ง','အာလူး','Potato','土豆','ผัก',32,26,60],
      ['p017','แครอท','မုန်လာဥနီ','Carrot','胡萝卜','ผัก',30,24,55],
      ['p018','แตงกวาญี่ปุ่น','သခွားမွေးဂျပန်','Japanese Cucumber','日本黄瓜','ผัก',40,33,30],
      ['p019','ต้นหอม','မြိတ်','Spring Onion','葱','ผัก',20,16,50],
      ['p020','ผักชี','နံနံပင်','Coriander','香菜','ผัก',25,20,30],
      ['p021','ผักหอมญี่ปุ่น','ဂျပန်ကြက်သွန်မြိတ်','Japanese Leek','日本大葱','ผัก',45,37,20],
      ['p022','ตั้งโอ๋','တန်းအိုး','Crown Daisy','茼蒿','ผัก',22,18,35],
    ];

    for (const p of products) {
      db.execute(
        `INSERT INTO products
         (id,name_th,name_mm,name_en,name_cn,category,unit,
          price_retail,price_wholesale,stock_kg,min_stock_kg,image_uri,is_active,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p[0],p[1],p[2],p[3],p[4],p[5],'กก.',
         Number(p[6]),Number(p[7]),Number(p[8]),10,'',1,now]
      );
    }

    db.execute(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['c001','ร้านแม่สอดเจริญ','055-111-222','ลูกค้าประจำ','1234','wholesale',5000,0,1,now]
    );
    db.execute(
      `INSERT INTO customers
       (id,shop_name,phone,notes,password,customer_type,credit_limit,credit_used,is_active,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['c002','ร้านสมชาย','055-333-444','','5678','retail',2000,0,1,now]
    );

    db.execute(`INSERT OR REPLACE INTO settings (key,value) VALUES ('seeded','1')`);
    console.log('✅ Seeded 22 products + 2 customers');
  }
}