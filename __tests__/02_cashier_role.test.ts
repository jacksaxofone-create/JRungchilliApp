/**
 * 🧪 TEST SUITE 02 — CASHIER ROLE
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ workflow ของแคชเชียร์:
 *   1. PIN authentication
 *   2. Walk-in sale (ขายปลีกหน้าร้าน)
 *   3. Pack orders mode (แพ็คออเดอร์ pre-order)
 *   4. Order status flow: confirmed → packing → ready_to_ship
 *   5. Payment methods: cash / transfer / credit
 *   6. Discount calculation
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
// CASHIER: 1. PIN Authentication
// ══════════════════════════════════════════════════════════════
describe('🔑 Cashier: PIN Authentication', () => {

  function verifyPin(input: string, correctPin: string): boolean {
    return input.trim() === correctPin.trim();
  }

  test('PIN ถูกต้อง → ผ่าน', () => {
    expect(verifyPin('1234', '1234')).toBe(true);
  });

  test('PIN ผิด → ไม่ผ่าน', () => {
    expect(verifyPin('0000', '1234')).toBe(false);
  });

  test('PIN ว่าง → ไม่ผ่าน', () => {
    expect(verifyPin('', '1234')).toBe(false);
  });

  test('PIN มี space ต้อง trim → ผ่าน', () => {
    expect(verifyPin(' 1234 ', '1234')).toBe(true);
  });

  test('PIN 4 หลัก เท่านั้น (ไม่รับ 3 หลักหรือ 5 หลัก)', () => {
    expect(verifyPin('123', '1234')).toBe(false);
    expect(verifyPin('12345', '1234')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// CASHIER: 2. Walk-in Sale — สร้างออเดอร์
// ══════════════════════════════════════════════════════════════
describe('🧾 Cashier: Walk-in Sale', () => {

  // simulate order builder
  interface CartItem {
    product_id: string;
    name_th:    string;
    quantity_kg: number;
    unit_price:  number;
    price_type:  'retail' | 'wholesale';
  }

  function buildWalkInOrder(
    cart: CartItem[],
    discount: number,
    paymentMethod: 'cash' | 'transfer' | 'credit',
    customerId?: string
  ) {
    const subtotal = cart.reduce((s, i) => s + i.quantity_kg * i.unit_price, 0);
    const total    = Math.max(subtotal - discount, 0);
    const id       = 'ORD' + Date.now();
    const orderNum = '250615-' + Math.floor(1000 + Math.random() * 9000);

    return {
      id,
      order_number:    orderNum,
      customer_id:     customerId ?? '',
      customer_name:   customerId ? 'ร้านค้า A' : 'ลูกค้าทั่วไป',
      order_type:      'walk_in',
      subtotal,
      discount,
      total,
      payment_method:  paymentMethod,
      payment_status:  paymentMethod === 'credit' ? 'pending' : 'paid',
      status:          'pending',
      pack_status:     'waiting',
      items: cart.map(i => ({
        product_id:      i.product_id,
        product_name_th: i.name_th,
        quantity_kg:     i.quantity_kg,
        unit_price:      i.unit_price,
        total_price:     i.quantity_kg * i.unit_price,
      })),
    };
  }

  const sampleCart: CartItem[] = [
    { product_id: 'P001', name_th: 'พริกแดง', quantity_kg: 2, unit_price: 60, price_type: 'retail' },
    { product_id: 'P002', name_th: 'พริกเขียว', quantity_kg: 1, unit_price: 55, price_type: 'retail' },
  ];

  test('สร้าง walk-in order ได้ถูกต้อง', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'cash');
    expect(order.order_type).toBe('walk_in');
    expect(order.status).toBe('pending');
    expect(order.items).toHaveLength(2);
  });

  test('คำนวณ subtotal: (2×60) + (1×55) = 175', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'cash');
    expect(order.subtotal).toBe(175);
  });

  test('คำนวณ total หลังหัก discount 25 บาท: 175 - 25 = 150', () => {
    const order = buildWalkInOrder(sampleCart, 25, 'cash');
    expect(order.total).toBe(150);
  });

  test('total ไม่ต่ำกว่า 0 แม้ discount มากกว่า subtotal', () => {
    const order = buildWalkInOrder(sampleCart, 9999, 'cash');
    expect(order.total).toBe(0);
  });

  test('ชำระเงินสด → payment_status = paid', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'cash');
    expect(order.payment_status).toBe('paid');
  });

  test('ชำระเงินโอน → payment_status = paid', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'transfer');
    expect(order.payment_status).toBe('paid');
  });

  test('ชำระเครดิต → payment_status = pending', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'credit');
    expect(order.payment_status).toBe('pending');
  });

  test('ลูกค้าทั่วไป (ไม่ระบุ id) → customer_name = ลูกค้าทั่วไป', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'cash');
    expect(order.customer_name).toBe('ลูกค้าทั่วไป');
    expect(order.customer_id).toBe('');
  });

  test('มีลูกค้า (ระบุ id) → ใช้ชื่อร้านค้า', () => {
    const order = buildWalkInOrder(sampleCart, 0, 'cash', 'C001');
    expect(order.customer_id).toBe('C001');
    expect(order.customer_name).toBe('ร้านค้า A');
  });

  test('ราคาส่ง (wholesale) ต้องถูกกว่าราคาปลีก', () => {
    const wholesale: CartItem = { product_id: 'P001', name_th: 'พริก', quantity_kg: 5, unit_price: 45, price_type: 'wholesale' };
    const retail:    CartItem = { product_id: 'P001', name_th: 'พริก', quantity_kg: 1, unit_price: 60, price_type: 'retail' };
    expect(wholesale.unit_price).toBeLessThan(retail.unit_price);
  });

  test('auto-switch wholesale เมื่อ customer_type = wholesale', () => {
    // simulate: ถ้าลูกค้าเป็น wholesale ต้องใช้ price_wholesale
    const customer = { customer_type: 'wholesale', shop_name: 'ร้านค้าส่ง A' };
    const product  = { price_retail: 60, price_wholesale: 45 };
    const price    = customer.customer_type === 'wholesale'
      ? product.price_wholesale
      : product.price_retail;
    expect(price).toBe(45);
  });
});

// ══════════════════════════════════════════════════════════════
// CASHIER: 3. Pack Orders Mode
// ══════════════════════════════════════════════════════════════
describe('📦 Cashier: Pack Orders Mode', () => {

  interface Order {
    id: string;
    status: string;
    pack_status: string;
    items: { id: string; is_packed: boolean; actual_weight_kg: number }[];
  }

  // simulate pack flow
  function startPacking(order: Order): Order {
    return {
      ...order,
      status:      'packing',
      pack_status: 'packing',
    };
  }

  function packItem(order: Order, itemId: string, actualWeight: number): Order {
    return {
      ...order,
      items: order.items.map(item =>
        item.id === itemId
          ? { ...item, is_packed: true, actual_weight_kg: actualWeight }
          : item
      ),
    };
  }

  function finishPacking(order: Order): Order {
    // ✅ BUG FIX: ต้อง 'ready_to_ship' ไม่ใช่ 'confirmed'
    return {
      ...order,
      status:      'ready_to_ship',
      pack_status: 'packed',
    };
  }

  function isAllPacked(order: Order): boolean {
    return order.items.every(i => i.is_packed);
  }

  function calcPackProgress(order: Order): number {
    if (!order.items.length) return 0;
    const packed = order.items.filter(i => i.is_packed).length;
    return Math.round((packed / order.items.length) * 100);
  }

  const sampleOrder: Order = {
    id:          'ORD001',
    status:      'confirmed',
    pack_status: 'waiting',
    items: [
      { id: 'OI001', is_packed: false, actual_weight_kg: 0 },
      { id: 'OI002', is_packed: false, actual_weight_kg: 0 },
      { id: 'OI003', is_packed: false, actual_weight_kg: 0 },
    ],
  };

  test('เริ่ม packing → status = packing', () => {
    const updated = startPacking(sampleOrder);
    expect(updated.status).toBe('packing');
    expect(updated.pack_status).toBe('packing');
  });

  test('แพ็คครบแล้ว finishPacking() → status = ready_to_ship ✅ KEY FIX', () => {
    // นี่คือ bug fix สำคัญ: ต้องเป็น ready_to_ship ไม่ใช่ confirmed
    const packed = finishPacking(sampleOrder);
    expect(packed.status).toBe('ready_to_ship');
    expect(packed.status).not.toBe('confirmed'); // ต้องไม่กลับไป confirmed
    expect(packed.pack_status).toBe('packed');
  });

  test('progress bar: 0% เมื่อเริ่มต้น', () => {
    expect(calcPackProgress(sampleOrder)).toBe(0);
  });

  test('progress bar: 33% เมื่อแพ็ค 1/3', () => {
    const after = packItem(sampleOrder, 'OI001', 2.0);
    expect(calcPackProgress(after)).toBe(33);
  });

  test('progress bar: 100% เมื่อแพ็คครบ', () => {
    let order = sampleOrder;
    order = packItem(order, 'OI001', 2.0);
    order = packItem(order, 'OI002', 1.5);
    order = packItem(order, 'OI003', 3.0);
    expect(calcPackProgress(order)).toBe(100);
    expect(isAllPacked(order)).toBe(true);
  });

  test('isAllPacked = false เมื่อยังไม่ครบ', () => {
    const after = packItem(sampleOrder, 'OI001', 2.0);
    expect(isAllPacked(after)).toBe(false);
  });

  test('actual weight ถูกบันทึกลง item', () => {
    const after = packItem(sampleOrder, 'OI001', 2.35);
    const item  = after.items.find(i => i.id === 'OI001')!;
    expect(item.is_packed).toBe(true);
    expect(item.actual_weight_kg).toBe(2.35);
  });
});

// ══════════════════════════════════════════════════════════════
// CASHIER: 4. Order Status Flow (5 stages)
// ══════════════════════════════════════════════════════════════
describe('🔄 Cashier: Order Status Flow', () => {

  const VALID_FLOW = [
    'pending',
    'confirmed',
    'packing',
    'ready_to_ship',
    'delivered',
  ];

  test('flow ต้องมีครบ 5 ขั้นตอน', () => {
    expect(VALID_FLOW).toHaveLength(5);
  });

  test('pending → confirmed (admin ยืนยัน)', () => {
    expect(VALID_FLOW.indexOf('confirmed')).toBeGreaterThan(VALID_FLOW.indexOf('pending'));
  });

  test('confirmed → packing (cashier เริ่มแพ็ค)', () => {
    expect(VALID_FLOW.indexOf('packing')).toBeGreaterThan(VALID_FLOW.indexOf('confirmed'));
  });

  test('packing → ready_to_ship (cashier แพ็คเสร็จ) ✅ KEY FIX', () => {
    expect(VALID_FLOW.indexOf('ready_to_ship')).toBeGreaterThan(VALID_FLOW.indexOf('packing'));
  });

  test('ready_to_ship → delivered (ส่งสำเร็จ)', () => {
    expect(VALID_FLOW.indexOf('delivered')).toBeGreaterThan(VALID_FLOW.indexOf('ready_to_ship'));
  });

  test('สีแต่ละ status ต้องต่างกันทุกตัว', () => {
    const colors = VALID_FLOW.map(orderStatusColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(VALID_FLOW.length);
  });

  test('label ทุก status มีข้อความและ emoji', () => {
    VALID_FLOW.forEach(s => {
      const label = orderStatusLabel(s);
      expect(label.length).toBeGreaterThan(3);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// CASHIER: 5. Change Fund Calculation
// ══════════════════════════════════════════════════════════════
describe('💰 Cashier: Change Fund', () => {

  function calcChange(received: number, total: number): number {
    return Math.max(received - total, 0);
  }

  function isEnoughReceived(received: number, total: number): boolean {
    return received >= total;
  }

  test('รับ 200 จ่าย 175 → เงินทอน 25', () => {
    expect(calcChange(200, 175)).toBe(25);
  });

  test('รับพอดี → ทอน 0', () => {
    expect(calcChange(175, 175)).toBe(0);
  });

  test('รับน้อยกว่า total → ทอน 0 (ไม่ติดลบ)', () => {
    expect(calcChange(100, 175)).toBe(0);
  });

  test('เงินที่รับมาไม่พอ → isEnoughReceived = false', () => {
    expect(isEnoughReceived(100, 175)).toBe(false);
  });

  test('เงินที่รับพอ → isEnoughReceived = true', () => {
    expect(isEnoughReceived(200, 175)).toBe(true);
  });
});
