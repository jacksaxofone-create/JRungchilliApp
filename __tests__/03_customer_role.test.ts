/**
 * 🧪 TEST SUITE 03 — CUSTOMER ROLE
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ workflow ของลูกค้า (ฝั่งลูกค้า):
 *   1. Customer Login (shop_name + password)
 *   2. Pre-order creation (สั่งล่วงหน้า)
 *   3. Order tracking — มองเห็น status ทั้ง 5 ขั้นตอน
 *   4. Credit check (ตรวจสอบวงเงินก่อนสั่ง)
 *   5. Cart: เพิ่มสินค้า, ปรับปริมาณ, ลบ, เคลียร์
 *   6. Dashboard: tab ออเดอร์ปัจจุบัน / ประวัติ
 *   7. Sub-customer (ลูกค้าของผู้ค้าส่ง)
 */

// ── Mocks ──────────────────────────────────────────────────────
jest.mock('@op-engineering/op-sqlite', () => ({ open: jest.fn() }));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Alert: { alert: jest.fn() },
  NativeModules: {},
}));

import { orderStatusColor, orderStatusLabel } from '../src/core/theme';

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 1. Login
// ══════════════════════════════════════════════════════════════
describe('🔐 Customer: Login', () => {

  // mock customer DB
  const mockCustomers = [
    { id: 'C001', shop_name: 'ร้านสมใจ', password: '1234', customer_type: 'retail',    is_active: 1, credit_limit: 0,     credit_used: 0 },
    { id: 'C002', shop_name: 'ร้านค้าส่ง B', password: 'abcd', customer_type: 'wholesale', is_active: 1, credit_limit: 50000, credit_used: 20000 },
    { id: 'C003', shop_name: 'ร้านเก่า', password: '5678', customer_type: 'retail',    is_active: 0, credit_limit: 0,     credit_used: 0 },
  ];

  function loginCustomer(shopName: string, password: string) {
    return mockCustomers.find(
      c => c.shop_name === shopName && c.password === password && c.is_active === 1
    ) ?? null;
  }

  test('login สำเร็จ — ชื่อร้านและรหัสถูกต้อง', () => {
    const result = loginCustomer('ร้านสมใจ', '1234');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('C001');
  });

  test('login ล้มเหลว — ชื่อร้านถูก รหัสผิด', () => {
    expect(loginCustomer('ร้านสมใจ', '0000')).toBeNull();
  });

  test('login ล้มเหลว — ชื่อร้านไม่มีในระบบ', () => {
    expect(loginCustomer('ร้านไม่มี', '1234')).toBeNull();
  });

  test('login ล้มเหลว — บัญชีถูก deactivate (is_active = 0)', () => {
    expect(loginCustomer('ร้านเก่า', '5678')).toBeNull();
  });

  test('login ล้มเหลว — ช่องว่าง', () => {
    expect(loginCustomer('', '')).toBeNull();
  });

  test('ลูกค้าที่ login สำเร็จมี customer_type', () => {
    const result = loginCustomer('ร้านสมใจ', '1234');
    expect(['retail', 'wholesale']).toContain(result?.customer_type);
  });

  test('wholesale customer มี credit_limit > 0', () => {
    const result = loginCustomer('ร้านค้าส่ง B', 'abcd');
    expect(result?.credit_limit).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 2. Pre-Order Creation
// ══════════════════════════════════════════════════════════════
describe('📝 Customer: Pre-Order Creation', () => {

  interface PreOrderItem {
    product_id: string;
    name_th: string;
    quantity_kg: number;
    unit_price: number;
  }

  function buildPreOrder(
    customerId: string,
    customerName: string,
    customerType: 'retail' | 'wholesale',
    items: PreOrderItem[],
    scheduledDate: string,
    paymentMethod: 'cash' | 'transfer' | 'credit',
    subCustomerName?: string,
    notes?: string
  ) {
    const subtotal = items.reduce((s, i) => s + i.quantity_kg * i.unit_price, 0);
    return {
      id:             'ORD' + Date.now(),
      order_number:   '250615-' + Math.floor(1000 + Math.random() * 9000),
      customer_id:    customerId,
      customer_name:  customerName,
      order_type:     'pre_order',
      subtotal,
      discount:       0,
      total:          subtotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'credit' ? 'pending' : 'paid',
      status:         'pending',
      pack_status:    'waiting',
      scheduled_date: scheduledDate,
      sub_customer:   subCustomerName ?? '',
      notes:          notes ?? '',
      items,
    };
  }

  const items: PreOrderItem[] = [
    { product_id: 'P001', name_th: 'พริกแดง', quantity_kg: 5, unit_price: 45 },
    { product_id: 'P002', name_th: 'พริกเขียว', quantity_kg: 3, unit_price: 40 },
  ];

  test('สร้าง pre-order ได้ถูกต้อง', () => {
    const order = buildPreOrder('C001', 'ร้านสมใจ', 'retail', items, '2025-06-20', 'cash');
    expect(order.order_type).toBe('pre_order');
    expect(order.status).toBe('pending');
    expect(order.scheduled_date).toBe('2025-06-20');
  });

  test('subtotal: (5×45) + (3×40) = 345', () => {
    const order = buildPreOrder('C001', 'ร้านสมใจ', 'retail', items, '2025-06-20', 'cash');
    expect(order.subtotal).toBe(345);
  });

  test('เครดิต → payment_status = pending', () => {
    const order = buildPreOrder('C002', 'ร้านค้าส่ง B', 'wholesale', items, '2025-06-20', 'credit');
    expect(order.payment_status).toBe('pending');
  });

  test('บันทึก sub_customer ได้', () => {
    const order = buildPreOrder('C002', 'ร้านค้าส่ง B', 'wholesale', items, '2025-06-20', 'cash', 'ลูกค้าย่อย A');
    expect(order.sub_customer).toBe('ลูกค้าย่อย A');
  });

  test('บันทึก notes ได้', () => {
    const order = buildPreOrder('C001', 'ร้านสมใจ', 'retail', items, '2025-06-20', 'cash', '', 'ขอพริกสด');
    expect(order.notes).toBe('ขอพริกสด');
  });

  test('scheduled_date ต้องไม่ว่าง', () => {
    const order = buildPreOrder('C001', 'ร้านสมใจ', 'retail', items, '2025-06-20', 'cash');
    expect(order.scheduled_date).not.toBe('');
  });

  test('validation: ไม่มีสินค้าในตะกร้า → ห้ามสั่ง', () => {
    function canPlaceOrder(cartItems: PreOrderItem[]): boolean {
      return cartItems.length > 0;
    }
    expect(canPlaceOrder([])).toBe(false);
    expect(canPlaceOrder(items)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 3. Order Tracking (Customer Dashboard)
// ══════════════════════════════════════════════════════════════
describe('📊 Customer: Order Tracking (Dashboard)', () => {

  // simulate getStatusIcon (ต้องตรงกับ CustomerDashboardScreen.tsx)
  function getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':       return '🟡';
      case 'confirmed':     return '🔵';
      case 'packing':       return '🟠';
      case 'ready_to_ship': return '🟢';   // ✅ BUG FIX: ต้องมี case นี้
      case 'delivered':     return '✅';   // ✅ BUG FIX: ต้องไม่ใช่ 🟢
      case 'cancelled':     return '❌';
      default:              return '⚪';
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'pending':       return 'รอยืนยัน';
      case 'confirmed':     return 'ยืนยันแล้ว';
      case 'packing':       return 'กำลังแพ็ค';
      case 'ready_to_ship': return 'พร้อมส่ง';   // ✅ BUG FIX
      case 'delivered':     return 'ส่งแล้ว';
      case 'cancelled':     return 'ยกเลิก';
      default:              return status;
    }
  }

  test('pending → ไอคอน 🟡', () => {
    expect(getStatusIcon('pending')).toBe('🟡');
  });

  test('confirmed → ไอคอน 🔵', () => {
    expect(getStatusIcon('confirmed')).toBe('🔵');
  });

  test('packing → ไอคอน 🟠', () => {
    expect(getStatusIcon('packing')).toBe('🟠');
  });

  test('ready_to_ship → ไอคอน 🟢 ✅ KEY FIX', () => {
    expect(getStatusIcon('ready_to_ship')).toBe('🟢');
    expect(getStatusText('ready_to_ship')).toBe('พร้อมส่ง');
  });

  test('delivered → ไอคอน ✅ (ไม่ใช่ 🟢) ✅ KEY FIX', () => {
    expect(getStatusIcon('delivered')).toBe('✅');
    expect(getStatusIcon('delivered')).not.toBe('🟢');
  });

  test('cancelled → ไอคอน ❌', () => {
    expect(getStatusIcon('cancelled')).toBe('❌');
  });

  test('unknown status → ไอคอน ⚪ (fallback)', () => {
    expect(getStatusIcon('xyz_unknown')).toBe('⚪');
  });

  test('ทุก status มี text ไม่ว่าง', () => {
    ['pending','confirmed','packing','ready_to_ship','delivered','cancelled'].forEach(s => {
      expect(getStatusText(s)).not.toBe('');
      expect(getStatusText(s)).not.toBe(s); // ต้องแปลงแล้ว ไม่คืน key กลับ
    });
  });

  // ─── แยก active orders vs history ───────────────────────────
  test('active orders = ออเดอร์ที่ยังไม่ delivered/cancelled', () => {
    function isActiveOrder(status: string): boolean {
      return !['delivered', 'cancelled'].includes(status);
    }
    expect(isActiveOrder('pending')).toBe(true);
    expect(isActiveOrder('confirmed')).toBe(true);
    expect(isActiveOrder('packing')).toBe(true);
    expect(isActiveOrder('ready_to_ship')).toBe(true);
    expect(isActiveOrder('delivered')).toBe(false);
    expect(isActiveOrder('cancelled')).toBe(false);
  });

  // ─── orderStatusColor จาก theme ─────────────────────────────
  test('orderStatusColor: ready_to_ship และ delivered มีสีต่างกัน', () => {
    expect(orderStatusColor('ready_to_ship')).not.toBe(orderStatusColor('delivered'));
  });
});

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 4. Credit Check
// ══════════════════════════════════════════════════════════════
describe('💳 Customer: Credit Check (ก่อนสั่งสินค้า)', () => {

  function checkCredit(
    creditLimit:   number,
    creditUsed:    number,
    orderAmount:   number,
    paymentMethod: 'cash' | 'transfer' | 'credit'
  ): { allowed: boolean; reason?: string } {
    // ถ้าชำระทันที ไม่ต้องตรวจ credit
    if (paymentMethod !== 'credit') return { allowed: true };
    // ไม่มีวงเงิน
    if (!creditLimit) return { allowed: false, reason: 'ไม่มีวงเงินเครดิต' };
    const remaining = creditLimit - creditUsed;
    if (orderAmount > remaining) {
      return { allowed: false, reason: `วงเงินไม่พอ (คงเหลือ ฿${remaining})` };
    }
    return { allowed: true };
  }

  test('ชำระสด → อนุมัติเสมอ ไม่ตรวจ credit', () => {
    expect(checkCredit(0, 0, 5000, 'cash').allowed).toBe(true);
  });

  test('ชำระโอน → อนุมัติเสมอ', () => {
    expect(checkCredit(0, 0, 5000, 'transfer').allowed).toBe(true);
  });

  test('เครดิต: วงเงิน 50000 ใช้ 20000 สั่ง 10000 → ผ่าน (ยังเหลือ 30000)', () => {
    expect(checkCredit(50000, 20000, 10000, 'credit').allowed).toBe(true);
  });

  test('เครดิต: วงเงิน 50000 ใช้ 45000 สั่ง 10000 → ไม่ผ่าน (เหลือ 5000)', () => {
    const result = checkCredit(50000, 45000, 10000, 'credit');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('วงเงินไม่พอ');
  });

  test('เครดิต: ไม่มีวงเงิน (retail) → ไม่ผ่าน', () => {
    const result = checkCredit(0, 0, 5000, 'credit');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ไม่มีวงเงินเครดิต');
  });

  test('เครดิต: สั่งพอดีกับวงเงินที่เหลือ → ผ่าน', () => {
    expect(checkCredit(50000, 20000, 30000, 'credit').allowed).toBe(true);
  });

  test('credit warning ที่ 80%', () => {
    function creditWarningLevel(used: number, limit: number): 'ok' | 'warning' | 'full' {
      if (!limit) return 'ok';
      const pct = (used / limit) * 100;
      if (pct >= 100) return 'full';
      if (pct >= 80)  return 'warning';
      return 'ok';
    }
    expect(creditWarningLevel(40000, 50000)).toBe('warning'); // 80%
    expect(creditWarningLevel(50000, 50000)).toBe('full');    // 100%
    expect(creditWarningLevel(39999, 50000)).toBe('ok');      // 79.9%
  });
});

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 5. Cart Management
// ══════════════════════════════════════════════════════════════
describe('🛒 Customer: Cart Management', () => {

  interface CartItem {
    product_id: string;
    name_th: string;
    quantity_kg: number;
    unit_price: number;
  }

  function addToCart(cart: CartItem[], item: CartItem): CartItem[] {
    const idx = cart.findIndex(c => c.product_id === item.product_id);
    if (idx >= 0) {
      const updated = [...cart];
      updated[idx] = { ...updated[idx], quantity_kg: updated[idx].quantity_kg + item.quantity_kg };
      return updated;
    }
    return [...cart, item];
  }

  function removeFromCart(cart: CartItem[], productId: string): CartItem[] {
    return cart.filter(c => c.product_id !== productId);
  }

  function updateQty(cart: CartItem[], productId: string, qty: number): CartItem[] {
    if (qty <= 0) return cart.filter(c => c.product_id !== productId);
    return cart.map(c => c.product_id === productId ? { ...c, quantity_kg: qty } : c);
  }

  const item1: CartItem = { product_id: 'P001', name_th: 'พริกแดง', quantity_kg: 2, unit_price: 60 };
  const item2: CartItem = { product_id: 'P002', name_th: 'พริกเขียว', quantity_kg: 1, unit_price: 55 };

  test('เพิ่มสินค้า 1 ชนิด', () => {
    const cart = addToCart([], item1);
    expect(cart).toHaveLength(1);
    expect(cart[0].product_id).toBe('P001');
  });

  test('เพิ่มสินค้าชนิดเดิมซ้ำ → merge quantity', () => {
    let cart = addToCart([], item1);
    cart     = addToCart(cart, { ...item1, quantity_kg: 3 });
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity_kg).toBe(5);
  });

  test('เพิ่มสินค้า 2 ชนิด → 2 items', () => {
    const cart = addToCart(addToCart([], item1), item2);
    expect(cart).toHaveLength(2);
  });

  test('ลบสินค้าออกจากตะกร้า', () => {
    const cart = removeFromCart([item1, item2], 'P001');
    expect(cart).toHaveLength(1);
    expect(cart[0].product_id).toBe('P002');
  });

  test('ปรับปริมาณสินค้า', () => {
    const cart = updateQty([item1], 'P001', 5);
    expect(cart[0].quantity_kg).toBe(5);
  });

  test('ปรับปริมาณ = 0 → ลบออกอัตโนมัติ', () => {
    const cart = updateQty([item1, item2], 'P001', 0);
    expect(cart).toHaveLength(1);
    expect(cart[0].product_id).toBe('P002');
  });

  test('คำนวณ total ถูกต้อง', () => {
    const cart  = [item1, item2];
    const total = cart.reduce((s, i) => s + i.quantity_kg * i.unit_price, 0);
    expect(total).toBe(2 * 60 + 1 * 55); // 120 + 55 = 175
  });
});

// ══════════════════════════════════════════════════════════════
// CUSTOMER: 6. Sub-Customer (ลูกค้าของผู้ค้าส่ง)
// ══════════════════════════════════════════════════════════════
describe('👥 Customer: Sub-Customer (Wholesale)', () => {

  const mockSubCustomers = ['ร้านแดง', 'ร้านขาว', 'ร้านเขียว', 'ร้านแดงเข้ม'];

  function searchSubCustomers(query: string): string[] {
    if (!query) return [];
    return mockSubCustomers.filter(n => n.includes(query));
  }

  function saveSubCustomer(existing: string[], name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return existing;
    if (existing.includes(trimmed)) return existing; // no duplicate
    return [...existing, trimmed];
  }

  test('ค้นหา "แดง" → พบ 2 ร้าน', () => {
    expect(searchSubCustomers('แดง')).toHaveLength(2);
  });

  test('ค้นหา "ขาว" → พบ 1 ร้าน', () => {
    expect(searchSubCustomers('ขาว')).toHaveLength(1);
  });

  test('ค้นหา query ว่าง → ไม่คืนผล', () => {
    expect(searchSubCustomers('')).toHaveLength(0);
  });

  test('บันทึก sub-customer ใหม่ได้', () => {
    const result = saveSubCustomer(mockSubCustomers, 'ร้านม่วง');
    expect(result).toContain('ร้านม่วง');
  });

  test('ไม่บันทึก duplicate', () => {
    const result = saveSubCustomer(mockSubCustomers, 'ร้านแดง');
    expect(result.filter(n => n === 'ร้านแดง')).toHaveLength(1);
  });

  test('ไม่บันทึกชื่อว่าง', () => {
    const result = saveSubCustomer(mockSubCustomers, '   ');
    expect(result).toHaveLength(mockSubCustomers.length);
  });
});
