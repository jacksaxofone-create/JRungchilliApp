export type Lang = 'th' | 'mm' | 'en' | 'cn';

const T: Record<string, Record<Lang, string>> = {
  // ─── Auth / Role ──────────────────────────────────────────
  select_language:    { th:'เลือกภาษา',              mm:'ဘာသာစကား',           en:'Select Language',       cn:'选择语言' },
  select_role:        { th:'เลือกบทบาท',              mm:'အခန်းကဏ္ဍ',           en:'Select Role',           cn:'选择角色' },
  role_admin:         { th:'ผู้ดูแลระบบ',              mm:'စီမံခန့်ခွဲသူ',        en:'Administrator',         cn:'管理员' },
  role_stock:         { th:'พนักงานขาย/คลัง',          mm:'ရောင်းသူ',             en:'Cashier/Stock',         cn:'收银员' },
  role_order:         { th:'สั่งสินค้าออนไลน์',        mm:'အော်ဒါ',               en:'Order Online',          cn:'在线订单' },
  role_customer:      { th:'ลูกค้า/ร้านค้าส่ง',        mm:'ဖောက်သည်',             en:'Customer/Dealer',       cn:'客户/批发商' },
  enter_pin:          { th:'กรอก PIN',                 mm:'PIN ထည့်ပါ',           en:'Enter PIN',             cn:'输入密码' },
  wrong_pin:          { th:'PIN ไม่ถูกต้อง',           mm:'PIN မှားသည်',          en:'Wrong PIN',             cn:'密码错误' },
  enter_cashier_pin:  { th:'กรอกรหัสแคชเชียร์',        mm:'ကက်ရှီယာ PIN ထည့်ပါ',   en:'Enter Cashier PIN',     cn:'输入收银员密码' },
  cashier_pin_card:   { th:'รหัสแคชเชียร์วันนี้',       mm:'ဒီနေ့ ကက်ရှီယာ PIN',   en:'Cashier PIN Today',     cn:'今日收银员密码' },
  pin_rotates:        { th:'หมุนใหม่ทุก 5 วัน',        mm:'၅ ရက်တိုင်း ပြောင်း',   en:'Rotates every 5 days',  cn:'每5天轮换' },

  // ─── Navigation ──────────────────────────────────────────
  back:               { th:'กลับ',                    mm:'နောက်သို့',            en:'Back',                  cn:'返回' },
  home:               { th:'หน้าหลัก',                 mm:'ပင်မ',                 en:'Home',                  cn:'主页' },
  dashboard:          { th:'แดชบอร์ด',                 mm:'ဒက်ရှ်ဘုတ်',          en:'Dashboard',             cn:'仪表板' },
  settings:           { th:'ตั้งค่า',                  mm:'ဆက်တင်',               en:'Settings',              cn:'设置' },
  logout:             { th:'ออกจากระบบ',               mm:'ထွက်ရန်',              en:'Logout',                cn:'退出' },
  confirm_logout:     { th:'ต้องการออกจากระบบ?',       mm:'ထွက်မှာလား?',          en:'Confirm logout?',       cn:'确认退出?' },

  // ─── Products ────────────────────────────────────────────
  products:           { th:'สินค้า',                  mm:'ကုန်ပစ္စည်း',          en:'Products',              cn:'产品' },
  add_product:        { th:'เพิ่มสินค้า',              mm:'ကုန်ပစ္စည်းထည့်',      en:'Add Product',           cn:'添加产品' },
  product_name_th:    { th:'ชื่อสินค้า (ไทย)',         mm:'ထုတ်ကုန်အမည် (ไทย)',   en:'Product Name (TH)',     cn:'产品名称(泰文)' },
  product_name_mm:    { th:'ชื่อสินค้า (พม่า)',        mm:'ထုတ်ကုန်အမည်',         en:'Product Name (MM)',     cn:'产品名称(缅文)' },
  product_name_en:    { th:'ชื่อสินค้า (อังกฤษ)',      mm:'ထုတ်ကုန်အမည် (EN)',    en:'Product Name (EN)',     cn:'产品名称(英文)' },
  product_name_cn:    { th:'ชื่อสินค้า (จีน)',         mm:'ထုတ်ကုန်အမည် (CN)',    en:'Product Name (CN)',     cn:'产品名称(中文)' },
  no_products:        { th:'ไม่มีสินค้า',              mm:'ကုန်မရှိ',             en:'No Products',           cn:'无产品' },
  select_product:     { th:'เลือกสินค้า',              mm:'ကုန်ရွေးပါ',           en:'Select Product',        cn:'选择产品' },
  stock_qty:          { th:'จำนวนสต็อก',               mm:'စတော့',                en:'Stock Qty',             cn:'库存' },
  stock_low:          { th:'สต็อกต่ำ',                 mm:'စတော့နည်း',           en:'Low Stock',             cn:'库存不足' },
  category:           { th:'หมวดหมู่',                 mm:'အမျိုးအစား',           en:'Category',              cn:'类别' },
  unit:               { th:'หน่วย',                   mm:'ယူနစ်',               en:'Unit',                  cn:'单位' },
  retail_price:       { th:'ราคาปลีก',                 mm:'လက်လီဈေး',            en:'Retail Price',          cn:'零售价' },
  wholesale_price:    { th:'ราคาส่ง',                  mm:'လက်ကား',              en:'Wholesale Price',       cn:'批发价' },
  price_per_kg:       { th:'บาท/กก.',                  mm:'ကျပ်/ကီလို',          en:'THB/kg',                cn:'铢/公斤' },
  upload_image:       { th:'อัปโหลดรูป',               mm:'ပုံတင်ပါ',             en:'Upload Image',          cn:'上传图片' },
  from_camera:        { th:'ถ่ายจากกล้อง',             mm:'ကင်မရာ',              en:'Camera',                cn:'相机' },
  from_gallery:       { th:'จากคลังรูป',               mm:'ဓာတ်ပုံ',             en:'Gallery',               cn:'相册' },

  // ─── Customers ───────────────────────────────────────────
  customers:          { th:'ลูกค้า',                  mm:'ဖောက်သည်',            en:'Customers',             cn:'客户' },
  add_customer:       { th:'เพิ่มลูกค้า',              mm:'ဖောက်သည်ထည့်',        en:'Add Customer',          cn:'添加客户' },
  shop_name:          { th:'ชื่อร้าน',                 mm:'ဆိုင်အမည်',            en:'Shop Name',             cn:'店名' },
  phone:              { th:'เบอร์โทร',                 mm:'ဖုန်းနံပါတ်',          en:'Phone',                 cn:'电话' },
  password:           { th:'รหัสผ่าน',                 mm:'စကားဝှက်',            en:'Password',              cn:'密码' },
  my_shop:            { th:'ชื่อร้านฉัน',              mm:'ငါ့ဆိုင်',             en:'My Shop',               cn:'我的店' },
  overdue_credit:     { th:'เครดิตค้างชำระ',            mm:'အကြွေးကျော်',          en:'Overdue Credit',        cn:'超期信用' },
  customer_type:      { th:'ประเภทลูกค้า',              mm:'ဖောက်သည်အမျိုး',       en:'Customer Type',         cn:'客户类型' },
  type_retail:        { th:'ปลีก',                    mm:'လက်လီ',               en:'Retail',                cn:'零售' },
  type_wholesale:     { th:'ส่ง',                     mm:'လက်ကား',              en:'Wholesale',             cn:'批发' },
  credit_limit:       { th:'วงเงินเครดิต',              mm:'အကြွေးကန့်သတ်',       en:'Credit Limit',          cn:'信用额度' },
  credit_used:        { th:'ใช้ไปแล้ว',               mm:'သုံးပြီး',             en:'Used',                  cn:'已用' },
  credit_remaining:   { th:'คงเหลือ',                 mm:'ကျန်',                en:'Remaining',             cn:'剩余' },
  credit_warning_80:  { th:'เครดิตใกล้เต็ม (80%)',     mm:'အကြွေး ၈၀% ဆဲ',      en:'Credit near limit (80%)',cn:'信用额度即将用完 (80%)' },
  credit_full:        { th:'เครดิตเต็มแล้ว!',          mm:'အကြွေးပြည့်',          en:'Credit limit reached!', cn:'信用额度已满!' },
  sub_customer:       { th:'ชื่อลูกค้า',               mm:'ဖောက်သည်အမည်',        en:'Customer Name',         cn:'客户名称' },
  sub_customer_hint:  { th:'พิมพ์ชื่อหรืออักษรตัวหน้า',mm:'အမည်ရိုက်ပါ',         en:'Type name or first char',cn:'输入名称或首字母' },
  general_customer:   { th:'ลูกค้าทั่วไป',             mm:'ဖောက်သည်ทั่วไป',      en:'Walk-in Customer',      cn:'散客' },

  // ─── Orders ──────────────────────────────────────────────
  orders:             { th:'ออเดอร์',                 mm:'အော်ဒါများ',           en:'Orders',                cn:'订单' },
  orders_today:       { th:'ออเดอร์วันนี้',            mm:'ဒီနေ့ အော်ဒါ',        en:'Orders Today',          cn:'今日订单' },
  order_number:       { th:'เลขออเดอร์',               mm:'အော်ဒါနံပါတ်',         en:'Order No.',             cn:'订单号' },
  order_history:      { th:'ประวัติออเดอร์',            mm:'အော်ဒါမှတ်တမ်း',      en:'Order History',         cn:'订单历史' },
  order_detail:       { th:'รายละเอียดออเดอร์',         mm:'အော်ဒါ အသေးစိတ်',     en:'Order Detail',          cn:'订单详情' },
  pending_orders:     { th:'รอดำเนินการ',              mm:'စောင့်ဆိုင်း',          en:'Pending',               cn:'待处理' },
  no_pending_orders:  { th:'ไม่มีออเดอร์รอแพ็ค',       mm:'အော်ဒါမရှိ',           en:'No pending orders',     cn:'无待处理订单' },
  confirm_order:      { th:'ยืนยันออเดอร์',            mm:'အော်ဒါအတည်ပြု',       en:'Confirm Order',         cn:'确认订单' },
  cancel_order:       { th:'ยกเลิกออเดอร์',            mm:'အော်ဒါပယ်ဖျက်',       en:'Cancel Order',          cn:'取消订单' },
  new_order:          { th:'สั่งสินค้าใหม่',           mm:'အော်ဒါသစ်',           en:'New Order',             cn:'新订单' },
  bill_items:         { th:'รายการในบิล',              mm:'ဘီလ်ထဲမှာ',            en:'Bill Items',            cn:'账单项目' },
  no_items:           { th:'ไม่มีสินค้าในบิล',         mm:'ဘီလ်မရှိ',             en:'No Items in Bill',      cn:'账单为空' },
  clear_bill:         { th:'ล้างบิล',                  mm:'ဘီလ်ရှင်းပါ',          en:'Clear Bill',            cn:'清空账单' },
  add_to_bill:        { th:'เพิ่มในบิล',               mm:'ဘီလ်ထည့်',             en:'Add to Bill',           cn:'加入账单' },
  scheduled_date:     { th:'วันกำหนดรับ',              mm:'ရက်နေ့',               en:'Scheduled Date',        cn:'预定日期' },
  order_type_walkin:  { th:'ขายหน้าร้าน',              mm:'ဆိုင်ထဲရောင်းချ',      en:'Walk-in Sale',          cn:'到店销售' },
  order_type_preorder:{ th:'สั่งล่วงหน้า',             mm:'ကြိုတင်အော်ဒါ',        en:'Pre-order',             cn:'预订' },

  // ─── Order Status (5 ขั้น) ────────────────────────────────
  status_pending:       { th:'รอยืนยัน',               mm:'အတည်ပြုဆိုင်း',       en:'Pending',               cn:'待确认' },
  status_confirmed:     { th:'ยืนยันแล้ว',             mm:'အတည်ပြုပြီး',          en:'Confirmed',             cn:'已确认' },
  status_packing:       { th:'กำลังแพ็ค',              mm:'ထုပ်ပိုးနေ',           en:'Packing',               cn:'打包中' },
  status_ready_to_ship: { th:'พร้อมส่ง',               mm:'ပို့ဖို့အဆင်သင့်',      en:'Ready to Ship',         cn:'待发货' },
  status_delivered:     { th:'ส่งแล้ว',                mm:'ပြီးသွားပြီ',           en:'Delivered',             cn:'已送达' },
  status_cancelled:     { th:'ยกเลิก',                 mm:'ပယ်ဖျက်',              en:'Cancelled',             cn:'已取消' },

  // ─── Pack Status (3 ขั้น) ─────────────────────────────────
  pack_status:          { th:'สถานะแพ็ค',              mm:'ပတ်ကေ့ဆ်',             en:'Pack Status',           cn:'打包状态' },
  pack_waiting:         { th:'รอแพ็ค',                 mm:'ထုပ်ဖို့စောင့်',        en:'Waiting to Pack',       cn:'等待打包' },
  pack_packing:         { th:'กำลังแพ็ค',              mm:'ထုပ်ပိုးနေ',           en:'Packing',               cn:'打包中' },
  pack_packed:          { th:'แพ็คเสร็จ',              mm:'ထုပ်ပိုးပြီး',          en:'Packed',                cn:'已打包' },

  // ─── Walk-in Sale / Cashier Modes ────────────────────────
  walk_in_sale:       { th:'ขายหน้าร้าน',              mm:'ဆိုင်ထဲရောင်းချ',      en:'Walk-in Sale',          cn:'到店销售' },
  pack_orders:        { th:'แพ็คออเดอร์',              mm:'ထုပ်ပိုးမည်',           en:'Pack Orders',           cn:'打包订单' },
  pack_summary:       { th:'สรุปแพ็ค',                 mm:'ထုပ်ပိုးနှုန်း',        en:'Pack Summary',          cn:'打包汇总' },
  orders_date:        { th:'ออเดอร์วันที่',             mm:'ရက်နေ့ အော်ဒါ',        en:'Orders for Date',       cn:'该日订单' },
  finish_packing:     { th:'แพ็คเสร็จแล้ว',            mm:'ထုပ်ပိုးပြီး',          en:'Packing Done',          cn:'打包完成' },
  select_customer:    { th:'เลือกลูกค้า',              mm:'ဖောက်သည်ရွေးပါ',       en:'Select Customer',       cn:'选择客户' },
  search_customer:    { th:'ค้นหาชื่อร้านลูกค้า',      mm:'ဆိုင်အမည်ရှာပါ',        en:'Search customer shop',  cn:'搜索客户' },

  // ─── Payment ─────────────────────────────────────────────
  checkout:           { th:'ชำระเงิน',                 mm:'ငွေပေးချေ',            en:'Checkout',              cn:'结账' },
  confirm_pay:        { th:'ยืนยันชำระ',               mm:'ငွေပေးချေ',            en:'Confirm Pay',           cn:'确认付款' },
  payment_success:    { th:'ชำระเงินสำเร็จ',            mm:'ငွေပေးချေပြီး',        en:'Payment Success',       cn:'付款成功' },
  payment_method:     { th:'วิธีชำระเงิน',              mm:'ငွေပေးချေပုံ',         en:'Payment Method',        cn:'支付方式' },
  cash:               { th:'เงินสด',                  mm:'နဂွေ',                 en:'Cash',                  cn:'现金' },
  transfer:           { th:'โอนเงิน',                  mm:'ငွေလွှဲ',              en:'Transfer',              cn:'转账' },
  credit:             { th:'เครดิต',                  mm:'အကြွေး',               en:'Credit',                cn:'赊账' },
  received:           { th:'รับเงิน',                  mm:'ငွေရ',                 en:'Received',              cn:'收到金额' },
  change:             { th:'เงินทอน',                  mm:'ငွေအမ်း',              en:'Change',                cn:'找零' },
  discount:           { th:'ส่วนลด',                  mm:'လျှော့ဈေး',            en:'Discount',              cn:'折扣' },
  total:              { th:'รวม',                     mm:'စုစုပေါင်း',            en:'Total',                 cn:'合计' },
  net_total:          { th:'ยอดสุทธิ',                 mm:'စုစုပေါင်း',            en:'Net Total',             cn:'净额' },
  price_retail:       { th:'ราคาปลีก',                 mm:'လက်လီဈေး',            en:'Retail Price',          cn:'零售价' },
  price_wholesale:    { th:'ราคาส่ง',                  mm:'လက်ကားဈေး',            en:'Wholesale Price',       cn:'批发价' },
  transfer_required:  { th:'เครดิตเต็ม — ต้องโอนก่อน', mm:'ကြိုတင်လွှဲပါ',        en:'Credit full – transfer first',cn:'信用额度满，请先转账' },

  // ─── Printer / Sticker ───────────────────────────────────
  print_sticker:      { th:'พิมพ์สติกเกอร์',           mm:'ဆိုင်းဘုတ်ပုံနှိပ်',    en:'Print Sticker',         cn:'打印标签' },
  printer_settings:   { th:'ตั้งค่าเครื่องพิมพ์',       mm:'ပရင်တာ ဆက်တင်',       en:'Printer Settings',      cn:'打印机设置' },
  test_print:         { th:'ทดสอบพิมพ์',               mm:'စမ်းသပ်နှိပ်',          en:'Test Print',            cn:'测试打印' },
  printer_ip:         { th:'IP เครื่องพิมพ์',           mm:'ပရင်တာ IP',            en:'Printer IP',            cn:'打印机IP' },
  printer_mac:        { th:'MAC Address',              mm:'MAC လိပ်စာ',           en:'MAC Address',           cn:'MAC地址' },

  // ─── Common ──────────────────────────────────────────────
  search:             { th:'ค้นหา',                   mm:'ရှာဖွေ',                en:'Search',                cn:'搜索' },
  save:               { th:'บันทึก',                  mm:'သိမ်းဆည်း',             en:'Save',                  cn:'保存' },
  saved:              { th:'บันทึกแล้ว',               mm:'သိမ်းပြီး',             en:'Saved',                 cn:'已保存' },
  delete:             { th:'ลบ',                      mm:'ဖျက်',                 en:'Delete',                cn:'删除' },
  cancel:             { th:'ยกเลิก',                  mm:'မလုပ်တော့',            en:'Cancel',                cn:'取消' },
  confirm:            { th:'ยืนยัน',                  mm:'အတည်ပြု',              en:'Confirm',               cn:'确认' },
  warning:            { th:'คำเตือน',                 mm:'သတိပြု',               en:'Warning',               cn:'警告' },
  error:              { th:'ข้อผิดพลาด',              mm:'အမှား',                en:'Error',                 cn:'错误' },
  success:            { th:'สำเร็จ',                  mm:'အောင်မြင်',             en:'Success',               cn:'成功' },
  notes:              { th:'หมายเหตุ',                 mm:'မှတ်ချက်',              en:'Notes',                 cn:'备注' },
  weight_kg:          { th:'น้ำหนัก (กก.)',            mm:'အလေးချိန် (kg)',        en:'Weight (kg)',           cn:'重量(公斤)' },
  enter_weight:       { th:'กรอกน้ำหนัก',              mm:'အလေးချိန်ထည့်',        en:'Enter Weight',          cn:'输入重量' },
  actual_weight:      { th:'น้ำหนักจริง',              mm:'တကယ်အလေးချိန်',        en:'Actual Weight',         cn:'实际重量' },
  manage_system:      { th:'จัดการระบบ',               mm:'စီမံခန့်ခွဲ',           en:'Manage System',         cn:'系统管理' },
  revenue_today:      { th:'รายรับวันนี้',             mm:'ဒီနေ့ဝင်ငွေ',          en:'Revenue Today',         cn:'今日收入' },
  all_filter:         { th:'ทั้งหมด',                 mm:'အားလုံး',               en:'All',                   cn:'全部' },
  today:              { th:'วันนี้',                  mm:'ဒီနေ့',                en:'Today',                 cn:'今天' },
  yesterday:          { th:'เมื่อวาน',                mm:'မနေ့က',                en:'Yesterday',             cn:'昨天' },
  copy:               { th:'คัดลอก',                  mm:'ကူးယူ',                en:'Copy',                  cn:'复制' },
  copied:             { th:'คัดลอกแล้ว',              mm:'ကူးယူပြီး',             en:'Copied',                cn:'已复制' },
  show:               { th:'แสดง',                   mm:'ပြရန်',                en:'Show',                  cn:'显示' },
  hide:               { th:'ซ่อน',                   mm:'ဝှက်ရန်',               en:'Hide',                  cn:'隐藏' },
  close:              { th:'ปิด',                     mm:'ပိတ်',                 en:'Close',                 cn:'关闭' },
  loading:            { th:'กำลังโหลด',               mm:'တင်နေ',                en:'Loading',               cn:'加载中' },
  no_data:            { th:'ไม่มีข้อมูล',              mm:'ဒေတာမရှိ',             en:'No data',               cn:'无数据' },
  retry:              { th:'ลองใหม่',                 mm:'ထပ်ကြိုးစား',          en:'Retry',                 cn:'重试' },
  required_field:     { th:'กรุณากรอก',               mm:'ထည့်ပါ',               en:'Required',              cn:'必填' },

  // ─── Stats / Admin ────────────────────────────────────────
  stats_revenue:      { th:'รายรับ',                  mm:'ဝင်ငွေ',               en:'Revenue',               cn:'收入' },
  stats_orders:       { th:'ออเดอร์',                 mm:'အော်ဒါ',               en:'Orders',                cn:'订单' },
  stats_pending:      { th:'รอดำเนินการ',             mm:'စောင့်ဆိုင်း',          en:'Pending',               cn:'待处理' },
  stats_credit:       { th:'เครดิตค้าง',              mm:'အကြွေး',               en:'Credit Due',            cn:'欠款' },

  // ─── Customer Dashboard ──────────────────────────────────
  greeting:           { th:'สวัสดี',                  mm:'မင်္ဂလာပါ',            en:'Hello',                 cn:'您好' },
  order_tab:          { th:'สั่งสินค้า',              mm:'အော်ဒါ',               en:'Order',                 cn:'下单' },
  history_tab:        { th:'ประวัติ',                  mm:'မှတ်တမ်း',              en:'History',               cn:'历史' },
  cancel_pending:     { th:'ยกเลิกคำสั่ง',            mm:'ပယ်ဖျက်',              en:'Cancel Order',          cn:'取消订单' },
  order_3days:        { th:'ออเดอร์ย้อนหลัง 3 วัน',   mm:'၃ ရက်မှတ်တမ်း',       en:'3-day order history',   cn:'近3日订单' },
  confirm_cancel:     { th:'ยืนยันยกเลิกออเดอร์?',    mm:'အော်ဒါပယ်ဖျက်မလား?',  en:'Confirm cancel order?', cn:'确认取消订单?' },
  welcome_shop:       { th:'ยินดีต้อนรับ',             mm:'ကြိုဆိုပါ',            en:'Welcome',               cn:'欢迎' },

  // ─── CustomerEntry / CustomerEntryScreen ─────────────────
  choose_customer_type: { th:'เลือกประเภทลูกค้า',       mm:'ဖောက်သည်အမျိုး ရွေးပါ', en:'Select Customer Type',  cn:'选择客户类型' },
  member_login:         { th:'สมาชิก',                  mm:'အဖွဲ့ဝင်',              en:'Member',                cn:'会员' },
  member_login_title:   { th:'เข้าสู่ระบบสมาชิก',       mm:'အဖွဲ့ဝင် လော့အင်',      en:'Member Login',          cn:'会员登录' },
  walkin_customer:      { th:'ลูกค้าทั่วไป',             mm:'ဖောက်သည်ทั่วไป',       en:'Walk-in Customer',      cn:'散客' },
  walkin_desc:          { th:'ชำระเงินสด · ราคาปลีก',   mm:'ငွေသားပေး · လက်လီ',    en:'Cash payment · Retail', cn:'现金支付 · 零售价' },
  member_desc:          { th:'ราคาส่ง · เครดิต · สั่งล่วงหน้า', mm:'လက်ကားဈေး · အကြွေး', en:'Wholesale · Credit · Pre-order', cn:'批发价 · 信用 · 预订' },

  // ─── WholesaleOrderScreen ────────────────────────────────
  wholesale_order:      { th:'สั่งสินค้าราคาส่ง',        mm:'လက်ကားအော်ဒါ',         en:'Wholesale Order',       cn:'批发订单' },
  wholesale_order_title:{ th:'สั่งสินค้า (ส่ง)',         mm:'ကုန်ပစ္စည်း မှာ',        en:'Order (Wholesale)',     cn:'订货(批发)' },
  enter_qty_kg:         { th:'กรอกจำนวน (กก.)',          mm:'အရေအတွက် ထည့်ပါ (kg)',  en:'Enter qty (kg)',        cn:'输入数量(公斤)' },
  order_summary:        { th:'สรุปออเดอร์',              mm:'အော်ဒါ အနှစ်ချုပ်',     en:'Order Summary',         cn:'订单汇总' },
  items_count:          { th:'รายการ',                   mm:'ကုန်ပစ္စည်း',          en:'items',                 cn:'项' },
  back_to_home:         { th:'กลับหน้าหลัก',             mm:'ပင်မသို့ပြန်',          en:'Back to Home',          cn:'回主页' },
  generate_password:    { th:'สร้างรหัสผ่านใหม่',        mm:'စကားဝှက်သစ် ပြုလုပ်',  en:'Generate Password',     cn:'生成新密码' },
};

// ─── Main Translation Function ──────────────────────────────
export function t(key: string, lang: Lang): string {
  return T[key]?.[lang] ?? T[key]?.['th'] ?? key;
}

// ─── Bilingual Text Helper ───────────────────────────────────
// ใช้สำหรับแสดง "ข้อความไทย / ข้อความภาษาเลือก" หรือแค่ไทยถ้าเลือก th
export function tBi(key: string, lang: Lang): string {
  if (lang === 'th') return t(key, 'th');
  return `${t(key, 'th')} / ${t(key, lang)}`;
}

// ─── Product Name Bilingual ──────────────────────────────────
export function getProductName(product: any, lang: Lang): string {
  if (!product) return '';
  switch (lang) {
    case 'mm': return product.name_mm || product.name_th || '';
    case 'en': return product.name_en || product.name_th || '';
    case 'cn': return product.name_cn || product.name_th || '';
    default:   return product.name_th || '';
  }
}

// ─── Product Name Secondary (ภาษาที่เลือก) ──────────────────
export function getProductNameSecondary(product: any, lang: Lang): string | null {
  if (!product || lang === 'th') return null;
  switch (lang) {
    case 'mm': return product.name_mm || null;
    case 'en': return product.name_en || null;
    case 'cn': return product.name_cn || null;
    default:   return null;
  }
}
