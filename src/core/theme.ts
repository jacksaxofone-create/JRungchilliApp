/**
 * 🌶️ JRungChilli POS — Chilli Brand Theme
 * ─────────────────────────────────────────
 * ใช้ไฟล์นี้เป็น Single Source of Truth สำหรับสีและ Style Constants
 * import { CHILLI, T_STYLE, shadow } from '../core/theme';
 */

// ─── Color Palette ─────────────────────────────────────────
export const CHILLI = {
  // Primary — แดงพริก
  red:        '#c0392b',   // สีแดงหลัก (แดงพริกสด)
  redDark:    '#922b21',   // แดงเข้ม (hover/pressed)
  redDeep:    '#7b241c',   // แดงเข้มมาก (shadow)
  flame:      '#e74c3c',   // สีเปลวไฟ (accent)

  // Secondary — ส้มพริก
  orange:     '#e67e22',   // สีส้มพริก
  orangeLight:'#f39c12',   // ส้มอ่อน (highlight/gold)
  amber:      '#f0a500',   // อำพัน (warning)

  // Background & Surface
  dark:       '#1a252f',   // พื้นหลังเข้ม (navbar)
  darkMid:    '#2c3e50',   // พื้นหลังกลาง
  darkLight:  '#34495e',   // พื้นหลังอ่อน
  cream:      '#fef9f0',   // ครีมอ่อน (app background)
  creamCard:  '#fff8f0',   // ครีมการ์ด
  white:      '#ffffff',   // ขาวบริสุทธิ์

  // Status Colors
  green:      '#27ae60',   // สำเร็จ / confirmed
  greenLight: '#2ecc71',   // สำเร็จอ่อน
  blue:       '#2980b9',   // ข้อมูล / in progress
  blueLight:  '#3498db',   // ข้อมูลอ่อน
  purple:     '#8e44ad',   // packing
  yellow:     '#f1c40f',   // รอดำเนินการ
  gray:       '#95a5a6',   // ยกเลิก / inactive
  grayLight:  '#ecf0f1',   // พื้นหลังอ่อน

  // Text
  textPrimary:   '#1a252f',
  textSecondary: '#7f8c8d',
  textLight:     '#bdc3c7',
  textOnDark:    '#ffffff',
  textOnDarkSub: 'rgba(255,255,255,0.75)',
  textOnDarkHint:'rgba(255,255,255,0.5)',

  // Border
  borderLight:   '#ffe0d0',
  borderMid:     '#f0c0a0',
  borderDark:    '#c0392b',
};

// ─── Gradient Definitions (for LinearGradient or manual) ────
export const GRADIENTS = {
  header:     ['#c0392b', '#922b21'],        // แดงพริก header
  headerFull: ['#1a252f', '#c0392b', '#e67e22'],  // เข้ม→แดง→ส้ม
  cardRed:    ['#c0392b', '#e67e22'],         // การ์ดพริก
  cardDark:   ['#1a252f', '#2c3e50'],         // การ์ดเข้ม
  success:    ['#27ae60', '#2ecc71'],         // สำเร็จ
  warning:    ['#e67e22', '#f39c12'],         // เตือน
  background: ['#fef9f0', '#fff5e0'],         // พื้นหลัง cream
};

// ─── Typography ─────────────────────────────────────────────
export const FONT = {
  size: {
    xs:   10,
    sm:   12,
    md:   14,
    base: 15,
    lg:   16,
    xl:   18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    hero:  34,
  },
  weight: {
    normal:    '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
};

// ─── Spacing ────────────────────────────────────────────────
export const SPACE = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 14,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
};

// ─── Radius ─────────────────────────────────────────────────
export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  '2xl': 24,
  full: 999,
};

// ─── Shadow helper ──────────────────────────────────────────
export function shadow(level: 1 | 2 | 3 | 4 = 2) {
  const elevation = [0, 2, 4, 6, 10][level];
  return {
    elevation,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: level },
    shadowOpacity: 0.08 + level * 0.04,
    shadowRadius: level * 2,
  };
}

// ─── Common Shared Styles ───────────────────────────────────
export const T_STYLE = {
  // Safe Area
  safe: {
    flex: 1,
    backgroundColor: CHILLI.cream,
  },

  // Navbar
  navbar: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    ...shadow(3),
  },
  navTitle: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: CHILLI.textOnDark,
  },
  navSub: {
    fontSize: FONT.size.xs,
    color: CHILLI.textOnDarkSub,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: CHILLI.white,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    ...shadow(2),
  },
  cardChilli: {
    backgroundColor: CHILLI.red,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    ...shadow(2),
  },
  cardDark: {
    backgroundColor: CHILLI.dark,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    ...shadow(2),
  },

  // Section Title
  sectionTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: CHILLI.textPrimary,
    marginBottom: SPACE.sm,
  },
  sectionTitleLarge: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.extrabold,
    color: CHILLI.textPrimary,
  },

  // Buttons
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    ...shadow(1),
  },
  btnPrimary: {
    backgroundColor: CHILLI.red,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadow(2),
  },
  btnSecondary: {
    backgroundColor: CHILLI.dark,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadow(1),
  },
  btnOutline: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.sm + 2,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: CHILLI.red,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: FONT.size.base,
    fontWeight: FONT.weight.bold,
    color: CHILLI.white,
  },
  btnTextPrimary: {
    fontSize: FONT.size.base,
    fontWeight: FONT.weight.bold,
    color: CHILLI.white,
  },

  // Input
  input: {
    borderWidth: 1.5,
    borderColor: CHILLI.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm + 2,
    fontSize: FONT.size.base,
    color: CHILLI.textPrimary,
    backgroundColor: CHILLI.white,
  },
  inputFocused: {
    borderColor: CHILLI.red,
    backgroundColor: '#fff8f5',
  },

  // Lang Button
  langBtn: {
    padding: SPACE.sm - 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  langBtnOn: {
    backgroundColor: CHILLI.orangeLight,
  },
  langFlag: {
    fontSize: FONT.size.xl,
  },

  // Badge
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start' as const,
  },
  badgeTxt: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
    color: CHILLI.white,
  },

  // Bilingual Text patterns
  labelTh: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: CHILLI.textPrimary,
  },
  labelSub: {
    fontSize: FONT.size.sm,
    color: CHILLI.textSecondary,
    marginTop: 1,
  },
  labelOnDark: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: CHILLI.textOnDark,
  },
  labelSubOnDark: {
    fontSize: FONT.size.sm,
    color: CHILLI.textOnDarkSub,
    marginTop: 1,
  },
};

// ─── Status helpers ─────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'packing' | 'ready_to_ship' | 'delivered' | 'cancelled';
export type PackStatus  = 'waiting' | 'packing' | 'packed';

export function orderStatusColor(status: string): string {
  switch (status) {
    case 'pending':       return CHILLI.amber;
    case 'confirmed':     return CHILLI.green;
    case 'packing':       return CHILLI.purple;
    case 'ready_to_ship': return CHILLI.blue;
    case 'delivered':     return CHILLI.dark;
    case 'cancelled':     return CHILLI.gray;
    default:              return CHILLI.gray;
  }
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':       return '🟡 รอยืนยัน';
    case 'confirmed':     return '🔵 ยืนยันแล้ว';
    case 'packing':       return '🟠 กำลังแพ็ค';
    case 'ready_to_ship': return '🟢 พร้อมส่ง';
    case 'delivered':     return '✅ ส่งแล้ว';
    case 'cancelled':     return '❌ ยกเลิก';
    default:              return status;
  }
}

export function packStatusColor(status: string): string {
  switch (status) {
    case 'waiting': return CHILLI.amber;
    case 'packing': return CHILLI.blue;
    case 'packed':  return CHILLI.green;
    default:        return CHILLI.gray;
  }
}

export function packStatusLabel(status: string): string {
  switch (status) {
    case 'waiting': return '🟡 รอแพ็ค';
    case 'packing': return '🔵 กำลังแพ็ค';
    case 'packed':  return '🟢 แพ็คเสร็จ';
    default:        return '';
  }
}
