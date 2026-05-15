export type Lang = 'th' | 'mm' | 'en' | 'cn';

export const T: Record<string, Record<Lang, string>> = {
  // ── App ──
  app_name:          { th:'เจรุ่งชิลลี่', mm:'ဂျေရောင်ချီလီ', en:'J.Rung Chilli', cn:'辣椒店' },
  select_role:       { th:'เลือกบทบาท', mm:'အခန်းကဏ္ဍ ရွေးပါ', en:'Select Role', cn:'选择角色' },
  select_language:   { th:'เลือกภาษา', mm:'ဘာသာစကား', en:'Language', cn:'语言' },
  version:           { th:'เวอร์ชัน', mm:'ဗားရှင်း', en:'Version', cn:'版本' },

  // ── Roles ──
  role_admin:        { th:'แอดมิน', mm:'အက်ဒမင်', en:'Admin', cn:'管理员' },
  role_stock:        { th:'คัดของ / แคชเชียร์', mm:'အရောင်းစာရင်း', en:'Stock & Cashier', cn:'收银员' },
  role_order:        { th:'สั่งสินค้า', mm:'အော်ဒါတင်', en:'Order', cn:'订货' },
  enter_pin:         { th:'ใส่รหัสผ่าน Admin', mm:'PIN ထည့်ပါ', en:'Enter Admin PIN', cn:'输入密码' },
  wrong_pin:         { th:'รหัสผ่านไม่ถูกต้อง', mm:'PIN မှားသည်', en:'Wrong PIN', cn:'密码错误' },

  // ── POS ──
  pos_title:         { th:'ขายสินค้า', mm:'ရောင်းချမှု', en:'POS Sale', cn:'销售' },
  select_product:    { th:'เลือกสินค้า', mm:'ကုန်ပစ္စည်း ရွေးပါ', en:'Select Product', cn:'选择商品' },
  weight_kg:         { th:'น้ำหนัก (กก.)', mm:'အလေးချိန် (ကီလို)', en:'Weight (kg)', cn:'重量(公斤)' },
  enter_weight:      { th:'กรอกน้ำหนัก', mm:'အလေးချိန် ထည့်ပါ', en:'Enter Weight', cn:'输入重量' },
  add_to_bill:       { th:'เพิ่มในบิล', mm:'ဘီလ်တွင် ထည့်', en:'Add to Bill', cn:'加入账单' },
  print_sticker:     { th:'พิมพ์สติกเกอร์', mm:'စတစ်ကာ ပုံနှိပ်', en:'Print Sticker', cn:'打印标签' },
  bill_items:        { th:'รายการในบิล', mm:'ဘီလ်ရှိ အရာများ', en:'Bill Items', cn:'账单项目' },
  clear_bill:        { th:'ล้างบิล', mm:'ဘီလ် ရှင်းရန်', en:'Clear Bill', cn:'清空账单' },
  checkout:          { th:'ชำระเงิน', mm:'ငွေပေးချေ', en:'Checkout', cn:'结账' },
  total:             { th:'ยอดรวม', mm:'စုစုပေါင်း', en:'Total', cn:'合计' },
  discount:          { th:'ส่วนลด', mm:'လျှော့စျေး', en:'Discount', cn:'折扣' },
  net_total:         { th:'ยอดสุทธิ', mm:'သားဆင် စုစုပေါင်း', en:'Net Total', cn:'净额' },
  cash:              { th:'เงินสด', mm:'ငွေသား', en:'Cash', cn:'现金' },
  transfer:          { th:'โอนเงิน', mm:'ငွေလွှဲ', en:'Transfer', cn:'转账' },
  credit:            { th:'เครดิต', mm:'ကရက်ဒစ်', en:'Credit', cn:'信用' },
  received:          { th:'รับมา', mm:'ရရှိသည်', en:'Received', cn:'收到' },
  change:            { th:'เงินทอน', mm:'ငွေအမ်း', en:'Change', cn:'找零' },
  confirm_pay:       { th:'ยืนยันชำระเงิน', mm:'ငွေပေးချေမှု အတည်ပြု', en:'Confirm Payment', cn:'确认付款' },
  payment_success:   { th:'ชำระเงินสำเร็จ', mm:'ငွေပေးချေမှု အောင်မြင်', en:'Payment Success', cn:'付款成功' },
  no_items:          { th:'ยังไม่มีสินค้าในบิล', mm:'ဘီလ်တွင် ကုန်မရှိ', en:'No items in bill', cn:'账单为空' },

  // ── Scale & Printer ──
  scale_connect:     { th:'เชื่อมเครื่องชั่ง', mm:'ချိန်ခွင် ချိတ်ဆက်', en:'Connect Scale', cn:'连接秤' },
  scale_connected:   { th:'เชื่อมต่อแล้ว', mm:'ချိတ်ဆက်ပြီး', en:'Connected', cn:'已连接' },
  scale_reading:     { th:'กำลังชั่ง...', mm:'ချိန်နေသည်...', en:'Weighing...', cn:'称重中...' },
  printer_connect:   { th:'เชื่อมเครื่องพิมพ์', mm:'ပရင်တာ ချိတ်ဆက်', en:'Connect Printer', cn:'连接打印机' },
  scan_bt:           { th:'สแกน Bluetooth', mm:'Bluetooth ရှာ', en:'Scan Bluetooth', cn:'扫描蓝牙' },
  manual_weight:     { th:'กรอกน้ำหนักเอง', mm:'ကိုယ်တိုင် ထည့်', en:'Manual Weight', cn:'手动输入' },

  // ── Products ──
  products:          { th:'สินค้า', mm:'ကုန်ပစ္စည်းများ', en:'Products', cn:'商品' },
  add_product:       { th:'เพิ่มสินค้า', mm:'ကုန်ပစ္စည်း ထည့်', en:'Add Product', cn:'添加商品' },
  product_name_th:   { th:'ชื่อสินค้า (ไทย)', mm:'ကုန်အမည် (ထိုင်း)', en:'Name (Thai)', cn:'名称(泰)' },
  product_name_mm:   { th:'ชื่อ (พม่า)', mm:'အမည် (မြန်မာ)', en:'Name (Myanmar)', cn:'名称(缅)' },
  product_name_en:   { th:'ชื่อ (อังกฤษ)', mm:'အမည် (အင်္ဂလိပ်)', en:'Name (English)', cn:'名称(英)' },
  product_name_cn:   { th:'ชื่อ (จีน)', mm:'အမည် (တရုတ်)', en:'Name (Chinese)', cn:'名称(中)' },
  price_retail:      { th:'ราคาปลีก', mm:'လက်လီစျေး', en:'Retail Price', cn:'零售价' },
  price_wholesale:   { th:'ราคาส่ง', mm:'လက်ကားစျေး', en:'Wholesale Price', cn:'批发价' },
  stock_qty:         { th:'สต็อก (กก.)', mm:'စတော့ (ကီလို)', en:'Stock (kg)', cn:'库存(公斤)' },
  per_kg:            { th:'/กก.', mm:'/ကီလို', en:'/kg', cn:'/公斤' },
  save:              { th:'บันทึก', mm:'သိမ်းဆည်း', en:'Save', cn:'保存' },
  cancel:            { th:'ยกเลิก', mm:'ပယ်ဖျက်', en:'Cancel', cn:'取消' },
  delete:            { th:'ลบ', mm:'ဖျက်', en:'Delete', cn:'删除' },
  edit:              { th:'แก้ไข', mm:'တည်းဖြတ်', en:'Edit', cn:'编辑' },
  search:            { th:'ค้นหา', mm:'ရှာဖွေ', en:'Search', cn:'搜索' },
  no_products:       { th:'ไม่พบสินค้า', mm:'ကုန်မတွေ့', en:'No products', cn:'无商品' },

  // ── Customers ──
  customers:         { th:'ลูกค้า', mm:'ဖောက်သည်များ', en:'Customers', cn:'客户' },
  add_customer:      { th:'เพิ่มลูกค้า', mm:'ဖောက်သည် ထည့်', en:'Add Customer', cn:'添加客户' },
  shop_name:         { th:'ชื่อร้าน', mm:'ဆိုင်အမည်', en:'Shop Name', cn:'店名' },
  phone:             { th:'เบอร์โทร', mm:'ဖုန်းနံပါတ်', en:'Phone', cn:'电话' },
  notes:             { th:'หมายเหตุ', mm:'မှတ်ချက်', en:'Notes', cn:'备注' },
  password:          { th:'รหัสผ่าน', mm:'စကားဝှက်', en:'Password', cn:'密码' },

  // ── Orders ──
  orders:            { th:'ออเดอร์', mm:'အော်ဒါများ', en:'Orders', cn:'订单' },
  order_number:      { th:'เลขออเดอร์', mm:'အော်ဒါနံပါတ်', en:'Order No.', cn:'订单号' },
  order_history:     { th:'ประวัติสั่งซื้อ', mm:'အော်ဒါသမိုင်း', en:'Order History', cn:'订单历史' },
  my_shop:           { th:'ชื่อร้านของฉัน', mm:'ကျွန်ုပ်ဆိုင်', en:'My Shop Name', cn:'我的店名' },
  confirm_order:     { th:'ยืนยันสั่งสินค้า', mm:'အော်ဒါ အတည်ပြု', en:'Confirm Order', cn:'确认订单' },

  // ── Dashboard ──
  dashboard:         { th:'แดชบอร์ด', mm:'ဒိုင်ခွက်', en:'Dashboard', cn:'仪表板' },
  revenue_today:     { th:'รายได้วันนี้', mm:'ယနေ့ ဝင်ငွေ', en:"Today's Revenue", cn:'今日收入' },
  orders_today:      { th:'ออเดอร์วันนี้', mm:'ယနေ့ အော်ဒါ', en:"Today's Orders", cn:'今日订单' },
  pending_orders:    { th:'รอดำเนินการ', mm:'ဆောင်ရွက်ဆဲ', en:'Pending', cn:'待处理' },
  overdue_credit:    { th:'เครดิตค้างชำระ', mm:'ကြွေးကျန်', en:'Overdue Credit', cn:'逾期信用' },
  manage_system:     { th:'จัดการระบบ', mm:'စနစ် စီမံ', en:'Management', cn:'系统管理' },

  // ── Settings ──
  settings:          { th:'ตั้งค่า', mm:'ဆက်တင်', en:'Settings', cn:'设置' },
  change_pin:        { th:'เปลี่ยน PIN', mm:'PIN ပြောင်း', en:'Change PIN', cn:'更改密码' },
  shop_settings:     { th:'ตั้งค่าร้าน', mm:'ဆိုင် ဆက်တင်', en:'Shop Settings', cn:'店铺设置' },
  change_fund:       { th:'ต้นทุนเงินทอน', mm:'အကြွေပြောင်း', en:'Change Fund', cn:'备用金' },

  // ── Navigation ──
  back:              { th:'กลับ', mm:'နောက်သို့', en:'Back', cn:'返回' },
  home:              { th:'หน้าหลัก', mm:'မူလစာမျက်နှာ', en:'Home', cn:'主页' },
  loading:           { th:'กำลังโหลด...', mm:'တင်နေသည်...', en:'Loading...', cn:'加载中...' },

  // ── Alerts ──
  confirm:           { th:'ยืนยัน', mm:'အတည်ပြု', en:'Confirm', cn:'确认' },
  success:           { th:'สำเร็จ', mm:'အောင်မြင်', en:'Success', cn:'成功' },
  error:             { th:'ผิดพลาด', mm:'အမှား', en:'Error', cn:'错误' },
  warning:           { th:'แจ้งเตือน', mm:'သတိပေးချက်', en:'Warning', cn:'警告' },
  saved:             { th:'บันทึกแล้ว', mm:'သိမ်းဆည်းပြီး', en:'Saved', cn:'已保存' },
  deleted:           { th:'ลบแล้ว', mm:'ဖျက်ပြီး', en:'Deleted', cn:'已删除' },
};

export function t(key: string, lang: Lang): string {
  return T[key]?.[lang] ?? T[key]?.['th'] ?? key;
}

export function getProductName(product: any, lang: Lang): string {
  if (lang === 'mm' && product.name_mm) return product.name_mm;
  if (lang === 'en' && product.name_en) return product.name_en;
  if (lang === 'cn' && product.name_cn) return product.name_cn;
  return product.name_th;
}