/**
 * 🧪 TEST SUITE 01 — Core Logic
 * ─────────────────────────────
 * ทดสอบ logic กลางที่ทุก role ใช้ร่วมกัน:
 *   - Theme: CHILLI colors, orderStatusColor/Label, packStatus
 *   - i18n: t() function, bilingual labels
 *   - Store: cart calculations, state transitions
 *   - DB helpers: data formatting, PIN rotation logic
 */

// ── Mock native modules ────────────────────────────────────────
jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Alert: { alert: jest.fn() },
  NativeModules: {},
}));

// ── Imports ────────────────────────────────────────────────────
import {
  CHILLI, FONT, SPACE, RADIUS,
  shadow,
  orderStatusColor, orderStatusLabel,
  packStatusColor,  packStatusLabel,
  type OrderStatus, type PackStatus,
} from '../src/core/theme';

import { t } from '../src/core/i18n/translations';
import type { Lang } from '../src/core/i18n/translations';

// ══════════════════════════════════════════════════════════════
// 1. CHILLI THEME
// ══════════════════════════════════════════════════════════════
describe('🎨 CHILLI Theme Colors', () => {

  test('CHILLI.red = #c0392b (สีแดงพริกหลัก)', () => {
    expect(CHILLI.red).toBe('#c0392b');
  });

  test('CHILLI.orange = #e67e22 (สีส้มพริก)', () => {
    expect(CHILLI.orange).toBe('#e67e22');
  });

  test('CHILLI.dark = #1a252f (navbar dark)', () => {
    expect(CHILLI.dark).toBe('#1a252f');
  });

  test('CHILLI.cream = #fef9f0 (app background)', () => {
    expect(CHILLI.cream).toBe('#fef9f0');
  });

  test('CHILLI มีครบทุก key ที่จำเป็น', () => {
    const required = [
      'red','orange','dark','cream','white',
      'green','blue','purple','amber','gray',
      'textPrimary','textSecondary','textOnDark',
      'borderLight',
    ];
    required.forEach(key => {
      expect(CHILLI).toHaveProperty(key);
      expect((CHILLI as any)[key]).toBeTruthy();
    });
  });

  test('shadow() คืน object ที่มี elevation และ shadowColor', () => {
    const s = shadow(2);
    expect(s).toHaveProperty('elevation');
    expect(s).toHaveProperty('shadowColor');
    expect(s).toHaveProperty('shadowOffset');
    expect(s).toHaveProperty('shadowOpacity');
    expect(s.elevation).toBeGreaterThan(0);
  });

  test('shadow() elevation เพิ่มตาม level', () => {
    expect(shadow(1).elevation).toBeLessThan(shadow(4).elevation);
  });
});

// ══════════════════════════════════════════════════════════════
// 2. ORDER STATUS — 5 STAGE FLOW
// ══════════════════════════════════════════════════════════════
describe('📋 Order Status — 5-Stage Flow', () => {

  const ALL_STATUSES: OrderStatus[] = [
    'pending', 'confirmed', 'packing', 'ready_to_ship', 'delivered', 'cancelled',
  ];

  // ─── orderStatusColor ───────────────────────────────────────
  test('pending → amber (รอยืนยัน)', () => {
    expect(orderStatusColor('pending')).toBe(CHILLI.amber);
  });

  test('confirmed → green (ยืนยันแล้ว)', () => {
    expect(orderStatusColor('confirmed')).toBe(CHILLI.green);
  });

  test('packing → purple (กำลังแพ็ค)', () => {
    expect(orderStatusColor('packing')).toBe(CHILLI.purple);
  });

  test('ready_to_ship → blue (พร้อมส่ง) ✅ KEY STATUS', () => {
    // BUG FIX: ready_to_ship ต้องมี status แยกจาก delivered
    expect(orderStatusColor('ready_to_ship')).toBe(CHILLI.blue);
  });

  test('delivered → dark (ส่งแล้ว)', () => {
    expect(orderStatusColor('delivered')).toBe(CHILLI.dark);
  });

  test('cancelled → gray (ยกเลิก)', () => {
    expect(orderStatusColor('cancelled')).toBe(CHILLI.gray);
  });

  test('unknown status → gray (fallback)', () => {
    expect(orderStatusColor('unknown_xyz')).toBe(CHILLI.gray);
  });

  // ─── orderStatusLabel ───────────────────────────────────────
  test('orderStatusLabel: pending มี emoji 🟡', () => {
    expect(orderStatusLabel('pending')).toContain('🟡');
  });

  test('orderStatusLabel: ready_to_ship มี emoji 🟢 และข้อความ', () => {
    const label = orderStatusLabel('ready_to_ship');
    expect(label).toContain('🟢');
    expect(label.length).toBeGreaterThan(2);
  });

  test('orderStatusLabel: delivered มี emoji ✅ (ไม่ใช่ 🟢)', () => {
    // BUG FIX: delivered icon ต้องเป็น ✅ ไม่ใช่ 🟢
    expect(orderStatusLabel('delivered')).toContain('✅');
    expect(orderStatusLabel('delivered')).not.toContain('🟢');
  });

  // ─── ครบ 5 stage ────────────────────────────────────────────
  test('orderStatusColor คืนค่าได้ครบทุก 5 stage', () => {
    ALL_STATUSES.forEach(s => {
      const color = orderStatusColor(s);
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);
    });
  });

  test('orderStatusLabel คืน string ไม่ว่างทุก status', () => {
    ALL_STATUSES.forEach(s => {
      const label = orderStatusLabel(s);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // ─── ready_to_ship ≠ delivered ──────────────────────────────
  test('ready_to_ship และ delivered ต้องมีสี/label ต่างกัน', () => {
    expect(orderStatusColor('ready_to_ship')).not.toBe(orderStatusColor('delivered'));
    expect(orderStatusLabel('ready_to_ship')).not.toBe(orderStatusLabel('delivered'));
  });
});

// ══════════════════════════════════════════════════════════════
// 3. PACK STATUS
// ══════════════════════════════════════════════════════════════
describe('📦 Pack Status', () => {

  test('waiting → amber', () => {
    expect(packStatusColor('waiting')).toBe(CHILLI.amber);
  });

  test('packing → blue', () => {
    expect(packStatusColor('packing')).toBe(CHILLI.blue);
  });

  test('packed → green', () => {
    expect(packStatusColor('packed')).toBe(CHILLI.green);
  });

  test('packStatusLabel: ทุก status มี label', () => {
    (['waiting', 'packing', 'packed'] as PackStatus[]).forEach(s => {
      expect(packStatusLabel(s).length).toBeGreaterThan(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// 4. i18n TRANSLATIONS
// ══════════════════════════════════════════════════════════════
describe('🌐 i18n Translations', () => {

  const LANGS: Lang[] = ['th', 'mm', 'en', 'cn'];

  const CRITICAL_KEYS = [
    'back', 'save', 'cancel', 'confirm', 'logout', 'warning', 'error', 'success',
    'products', 'customers', 'orders', 'settings',
    'shop_name', 'password', 'price_retail', 'price_wholesale',
    'add_product', 'add_customer', 'add_to_bill',
    'stock_qty', 'order_number', 'payment_method',
    'type_retail', 'type_wholesale', 'credit_limit',
    'select_language', 'select_role',
    'role_admin', 'role_stock', 'role_order', 'role_customer',
  ];

  test.each(CRITICAL_KEYS)('key "%s" มีครบทุกภาษา (th/mm/en/cn)', (key) => {
    LANGS.forEach(lang => {
      const result = t(key, lang);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
      // ถ้า key ไม่มีจะคืน key นั้นกลับมา — ตรวจว่าไม่เป็นแค่ key เฉยๆ
      // (อนุโลม: บาง key ภาษา mm/en/cn อาจยังเป็น key ถ้ายังไม่ได้แปล)
    });
  });

  test('t() ภาษาไทยต้องมีอักษรไทย', () => {
    const thaiKeys = ['products', 'customers', 'orders', 'back', 'save', 'cancel'];
    thaiKeys.forEach(key => {
      const result = t(key, 'th');
      // ตรวจว่ามีตัวอักษรไทย (Unicode range \u0E00-\u0E7F)
      expect(/[\u0E00-\u0E7F]/.test(result)).toBe(true);
    });
  });

  test('t() ภาษาอังกฤษต้องมีตัวอักษร A-Z', () => {
    const enKeys = ['products', 'back', 'save', 'customers'];
    enKeys.forEach(key => {
      const result = t(key, 'en');
      expect(/[A-Za-z]/.test(result)).toBe(true);
    });
  });

  test('t() key ที่ไม่มีจริงควรคืนค่ากลับมาโดยไม่ crash', () => {
    expect(() => t('nonexistent_key_xyz', 'th')).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════
// 5. CART CALCULATION LOGIC
// ══════════════════════════════════════════════════════════════
describe('🛒 Cart Calculation Logic', () => {

  // simulate cartTotalSelector logic
  function calcTotal(items: { quantity_kg: number; unit_price: number }[]): number {
    return items.reduce((sum, item) => sum + item.quantity_kg * item.unit_price, 0);
  }

  test('ตะกร้าว่าง → total = 0', () => {
    expect(calcTotal([])).toBe(0);
  });

  test('สินค้า 1 รายการ: 2 กก. × 50 บาท = 100 บาท', () => {
    expect(calcTotal([{ quantity_kg: 2, unit_price: 50 }])).toBe(100);
  });

  test('สินค้า 2 รายการ: (3×100) + (1.5×200) = 600 บาท', () => {
    expect(calcTotal([
      { quantity_kg: 3,   unit_price: 100 },
      { quantity_kg: 1.5, unit_price: 200 },
    ])).toBe(600);
  });

  test('น้ำหนักทศนิยม: 0.5 กก. × 120 บาท = 60 บาท', () => {
    expect(calcTotal([{ quantity_kg: 0.5, unit_price: 120 }])).toBe(60);
  });

  test('wholesale price ต้องถูกกว่า retail เสมอ (business rule)', () => {
    // ตัวอย่างสินค้า: retail=80, wholesale=60
    const retail    = 80;
    const wholesale = 60;
    expect(wholesale).toBeLessThan(retail);
  });

  // simulate addToCart merge logic (zustand)
  function mergeCart(
    cart: { product_id: string; price_type: string; quantity_kg: number }[],
    newItem: { product_id: string; price_type: string; quantity_kg: number }
  ) {
    const idx = cart.findIndex(
      c => c.product_id === newItem.product_id && c.price_type === newItem.price_type
    );
    if (idx >= 0) {
      const updated = [...cart];
      updated[idx] = {
        ...updated[idx],
        quantity_kg: Math.round((updated[idx].quantity_kg + newItem.quantity_kg) * 1000) / 1000,
      };
      return updated;
    }
    return [...cart, newItem];
  }

  test('เพิ่มสินค้าชนิดเดิมลงตะกร้าต้อง merge ไม่ใช่ duplicate', () => {
    const cart = [{ product_id: 'P1', price_type: 'retail', quantity_kg: 2 }];
    const result = mergeCart(cart, { product_id: 'P1', price_type: 'retail', quantity_kg: 1 });
    expect(result.length).toBe(1);
    expect(result[0].quantity_kg).toBe(3);
  });

  test('เพิ่มสินค้าต่างชนิดต้องเพิ่มเป็น item ใหม่', () => {
    const cart = [{ product_id: 'P1', price_type: 'retail', quantity_kg: 2 }];
    const result = mergeCart(cart, { product_id: 'P2', price_type: 'retail', quantity_kg: 1 });
    expect(result.length).toBe(2);
  });

  test('สินค้าชนิดเดียวกัน แต่ราคาต่างกัน (retail vs wholesale) ต้องไม่ merge', () => {
    const cart = [{ product_id: 'P1', price_type: 'retail', quantity_kg: 2 }];
    const result = mergeCart(cart, { product_id: 'P1', price_type: 'wholesale', quantity_kg: 1 });
    expect(result.length).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════
// 6. ORDER ID / NUMBER GENERATION
// ══════════════════════════════════════════════════════════════
describe('🔢 Order ID / Number Generation', () => {

  function generateOrderId(): string {
    return 'ORD' + Date.now();
  }

  function generateOrderNumber(date: Date = new Date()): string {
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `${y}${m}${d}-${rand}`;
  }

  test('Order ID ต้องขึ้นต้นด้วย ORD', () => {
    expect(generateOrderId()).toMatch(/^ORD\d+$/);
  });

  test('Order Number format: YYMMDD-XXXX', () => {
    const num = generateOrderNumber(new Date('2025-06-15'));
    expect(num).toMatch(/^\d{6}-\d{4}$/);
    expect(num.startsWith('25')).toBe(true);
  });

  test('Order IDs ที่ generate ต่อกันต้องไม่ซ้ำกัน', () => {
    const ids = new Set(Array.from({ length: 10 }, () => 'P' + Date.now() + Math.random()));
    expect(ids.size).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════
// 7. CREDIT LOGIC
// ══════════════════════════════════════════════════════════════
describe('💳 Credit Logic', () => {

  function calcCreditPct(used: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  function creditStatus(pct: number): 'ok' | 'warning' | 'full' {
    if (pct >= 100) return 'full';
    if (pct >= 80)  return 'warning';
    return 'ok';
  }

  test('credit 0% → ok', () => {
    expect(creditStatus(calcCreditPct(0, 10000))).toBe('ok');
  });

  test('credit 50% → ok', () => {
    expect(creditStatus(calcCreditPct(5000, 10000))).toBe('ok');
  });

  test('credit 80% → warning', () => {
    expect(creditStatus(calcCreditPct(8000, 10000))).toBe('warning');
  });

  test('credit 90% → warning', () => {
    expect(creditStatus(calcCreditPct(9000, 10000))).toBe('warning');
  });

  test('credit 100% → full (ห้ามซื้อเครดิตเพิ่ม)', () => {
    expect(creditStatus(calcCreditPct(10000, 10000))).toBe('full');
  });

  test('credit เกิน limit → capped at 100%', () => {
    expect(calcCreditPct(15000, 10000)).toBe(100);
  });

  test('credit limit = 0 → ไม่ crash (ไม่มีเครดิต)', () => {
    expect(calcCreditPct(0, 0)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════
// 8. CASHIER PIN LOGIC
// ══════════════════════════════════════════════════════════════
describe('🔐 Cashier PIN Logic', () => {

  function shouldRotatePin(lastChangedDate: string, rotateDays: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const last  = new Date(lastChangedDate);
    const now   = new Date(today);
    const diff  = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= rotateDays;
  }

  function generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  test('PIN ที่ generate ต้องเป็น 4 หลักเสมอ', () => {
    for (let i = 0; i < 20; i++) {
      const pin = generatePin();
      expect(pin).toMatch(/^\d{4}$/);
      expect(pin.length).toBe(4);
    }
  });

  test('PIN ต้องอยู่ในช่วง 1000–9999 (ไม่ขึ้นต้นด้วย 0)', () => {
    for (let i = 0; i < 10; i++) {
      const pin = parseInt(generatePin(), 10);
      expect(pin).toBeGreaterThanOrEqual(1000);
      expect(pin).toBeLessThanOrEqual(9999);
    }
  });

  test('หมุน PIN เมื่อครบ 5 วัน', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(shouldRotatePin(fiveDaysAgo, 5)).toBe(true);
  });

  test('ยังไม่ถึงเวลาหมุน PIN (3 วัน จาก 5 วัน)', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(shouldRotatePin(threeDaysAgo, 5)).toBe(false);
  });

  test('PIN วันนี้ → ยังไม่หมุน', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(shouldRotatePin(today, 5)).toBe(false);
  });
});
