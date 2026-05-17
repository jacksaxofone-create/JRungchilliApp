export type Lang = 'th' | 'mm' | 'en' | 'cn';

const T: Record<string, Record<Lang, string>> = {
  // Auth / Role
  select_language:   { th:'เลือกภาษา',          mm:'ဘာသာစကား',       en:'Select Language',    cn:'选择语言' },
  select_role:       { th:'เลือกบทบาท',          mm:'အခန်းကဏ္ဍ',       en:'Select Role',        cn:'选择角色' },
  role_admin:        { th:'ผู้ดูแลระบบ',          mm:'စီမံခန့်ခွဲသူ',    en:'Administrator',      cn:'管理员' },
  role_stock:        { th:'พนักงานขาย/คลัง',      mm:'ရောင်းသူ',         en:'Cashier/Stock',      cn:'收银员' },
  role_order:        { th:'สั่งสินค้าออนไลน์',    mm:'အော်ဒါ',           en:'Order Online',       cn:'在线订单' },
  enter_pin:         { th:'กรอก PIN',             mm:'PIN ထည့်ပါ',       en:'Enter PIN',          cn:'输入密码' },
  wrong_pin:         { th:'PIN ไม่ถูกต้อง',       mm:'PIN မှားသည်',      en:'Wrong PIN',          cn:'密码错误' },

  // Navigation
  back:              { th:'กลับ',                 mm:'နောက်သို့',        en:'Back',               cn:'返回' },
  home:              { th:'หน้าหลัก',             mm:'ပင်မ',             en:'Home',               cn:'主页' },
  dashboard:         { th:'แดชบอร์ด',             mm:'ဒက်ရှ်ဘုတ်',      en:'Dashboard',          cn:'仪表板' },
  settings:          { th:'ตั้งค่า',              mm:'ဆက်တင်',           en:'Settings',           cn:'设置' },

  // Products
  products:          { th:'สินค้า',               mm:'ကုန်ပစ္စည်း',      en:'Products',           cn:'产品' },
  add_product:       { th:'เพิ่มสินค้า',          mm:'ကုန်ပစ္စည်းထည့်', en:'Add Product',        cn:'添加产品' },
  product_name_th:   { th:'ชื่อสินค้า (ไทย)',     mm:'ထုတ်ကုန်အမည် (ไทย)',en:'Product Name (TH)', cn:'产品名称(泰文)' },
  product_name_mm:   { th:'ชื่อสินค้า (พม่า)',    mm:'ထုတ်ကုန်အမည်',    en:'Product Name (MM)',  cn:'产品名称(缅文)' },
  product_name_en:   { th:'ชื่อสินค้า (อังกฤษ)',  mm:'ထုတ်ကုန်အမည် (EN)',en:'Product Name (EN)', cn:'产品名称(英文)' },
  product_name_cn:   { th:'ชื่อสินค้า (จีน)',     mm:'ထုတ်ကုန်အမည် (CN)',en:'Product Name (CN)', cn:'产品名称(中文)' },
  no_products:       { th:'ไม่มีสินค้า',          mm:'ကုန်မရှိ',         en:'No Products',        cn:'无产品' },
  select_product:    { th:'เลือกสินค้า',          mm:'ကုန်ရွေးပါ',       en:'Select Product',     cn:'选择产品' },
  stock_qty:         { th:'จำนวนสต็อก',           mm:'စတော့',            en:'Stock Qty',          cn:'库存' },

  // Customers
  customers:         { th:'ลูกค้า',               mm:'ဖောက်သည်',         en:'Customers',          cn:'客户' },
  add_customer:      { th:'เพิ่มลูกค้า',          mm:'ဖောက်သည်ထည့်',    en:'Add Customer',       cn:'添加客户' },
  shop_name:         { th:'ชื่อร้าน',             mm:'ဆိုင်အမည်',        en:'Shop Name',          cn:'店名' },
  phone:             { th:'เบอร์โทร',             mm:'ဖုန်းနံပါတ်',      en:'Phone',              cn:'电话' },
  password:          { th:'รหัสผ่าน',             mm:'စကားဝှက်',         en:'Password',           cn:'密码' },
  my_shop:           { th:'ชื่อร้านฉัน',          mm:'ငါ့ဆိုင်',         en:'My Shop',            cn:'我的店' },
  overdue_credit:    { th:'เครดิตเกินกำหนด',      mm:'အကြွေးကျော်',      en:'Overdue Credit',     cn:'超期信用' },

  // Orders
  orders:            { th:'ออเดอร์',              mm:'အော်ဒါများ',        en:'Orders',             cn:'订单' },
  orders_today:      { th:'ออเดอร์วันนี้',        mm:'ဒီနေ့ အော်ဒါ',    en:'Orders Today',       cn:'今日订单' },
  order_number:      { th:'เลขออเดอร์',           mm:'အော်ဒါနံပါတ်',     en:'Order No.',          cn:'订单号' },
  pending_orders:    { th:'รอดำเนินการ',          mm:'စောင့်ဆိုင်း',      en:'Pending',            cn:'待处理' },
  confirm_order:     { th:'ยืนยันออเดอร์',        mm:'အော်ဒါအတည်ပြု',   en:'Confirm Order',      cn:'确认订单' },
  bill_items:        { th:'รายการในบิล',          mm:'ဘီလ်ထဲမှာ',        en:'Bill Items',         cn:'账单项目' },
  no_items:          { th:'ไม่มีสินค้าในบิล',     mm:'ဘီလ်မရှိ',         en:'No Items in Bill',   cn:'账单为空' },
  clear_bill:        { th:'ล้างบิล',              mm:'ဘီလ်ရှင်းပါ',      en:'Clear Bill',         cn:'清空账单' },
  add_to_bill:       { th:'เพิ่มในบิล',           mm:'ဘီလ်ထည့်',         en:'Add to Bill',        cn:'加入账单' },

  // Payment
  checkout:          { th:'ชำระเงิน',             mm:'ငွေပေးချေ',        en:'Checkout',           cn:'结账' },
  confirm_pay:       { th:'ยืนยันชำระ',           mm:'ငွေပေးချေ',        en:'Confirm Pay',        cn:'确认付款' },
  payment_success:   { th:'ชำระเงินสำเร็จ',       mm:'ငွေပေးချေပြီး',   en:'Payment Success',    cn:'付款成功' },
  cash:              { th:'เงินสด',               mm:'နဂွေ',             en:'Cash',               cn:'现金' },
  transfer:          { th:'โอนเงิน',              mm:'ငွေလွှဲ',          en:'Transfer',           cn:'转账' },
  credit:            { th:'เครดิต',               mm:'အကြွေး',           en:'Credit',             cn:'赊账' },
  received:          { th:'รับเงิน',              mm:'ငွေရ',             en:'Received',           cn:'收到金额' },
  change:            { th:'เงินทอน',              mm:'ငွေအမ်း',          en:'Change',             cn:'找零' },
  discount:          { th:'ส่วนลด',               mm:'လျှော့ဈေး',        en:'Discount',           cn:'折扣' },
  total:             { th:'รวม',                  mm:'စုစုပေါင်း',       en:'Total',              cn:'合计' },
  net_total:         { th:'ยอดสุทธิ',             mm:'စုစုပေါင်း',       en:'Net Total',          cn:'净额' },
  price_retail:      { th:'ราคาปลีก',             mm:'လက်လီဈေး',         en:'Retail Price',       cn:'零售价' },
  price_wholesale:   { th:'ราคาส่ง',              mm:'လက်ကား',           en:'Wholesale Price',    cn:'批发价' },

  // Printer / Sticker
  print_sticker:     { th:'พิมพ์สติกเกอร์',      mm:'ဆိုင်းဘုတ်ပုံနှိပ်', en:'Print Sticker',    cn:'打印标签' },

  // Common
  search:            { th:'ค้นหา',               mm:'ရှာဖွေ',            en:'Search',             cn:'搜索' },
  save:              { th:'บันทึก',               mm:'သိမ်းဆည်း',         en:'Save',               cn:'保存' },
  saved:             { th:'บันทึกแล้ว',           mm:'သိမ်းပြီး',         en:'Saved',              cn:'已保存' },
  delete:            { th:'ลบ',                   mm:'ဖျက်',             en:'Delete',             cn:'删除' },
  cancel:            { th:'ยกเลิก',               mm:'မလုပ်တော့',        en:'Cancel',             cn:'取消' },
  confirm:           { th:'ยืนยัน',               mm:'အတည်ပြု',          en:'Confirm',            cn:'确认' },
  warning:           { th:'คำเตือน',              mm:'သတိပြု',           en:'Warning',            cn:'警告' },
  error:             { th:'ข้อผิดพลาด',           mm:'အမှား',            en:'Error',              cn:'错误' },
  success:           { th:'สำเร็จ',               mm:'အောင်မြင်',        en:'Success',            cn:'成功' },
  notes:             { th:'หมายเหตุ',             mm:'မှတ်ချက်',          en:'Notes',              cn:'备注' },
  weight_kg:         { th:'น้ำหนัก (กก.)',        mm:'အလေးချိန် (kg)',   en:'Weight (kg)',        cn:'重量(公斤)' },
  enter_weight:      { th:'กรอกน้ำหนัก',          mm:'အလေးချိန်ထည့်',   en:'Enter Weight',       cn:'输入重量' },
  manage_system:     { th:'จัดการระบบ',           mm:'စီမံခန့်ခွဲ',       en:'Manage System',      cn:'系统管理' },
  revenue_today:     { th:'รายรับวันนี้',          mm:'ဒီနေ့ဝင်ငွေ',     en:'Revenue Today',      cn:'今日收入' },
};

export function t(key: string, lang: Lang): string {
  return T[key]?.[lang] ?? T[key]?.['th'] ?? key;
}

export function getProductName(product: any, lang: Lang): string {
  if (!product) return '';
  switch (lang) {
    case 'mm': return product.name_mm || product.name_th || '';
    case 'en': return product.name_en || product.name_th || '';
    case 'cn': return product.name_cn || product.name_th || '';
    default:   return product.name_th || '';
  }
}