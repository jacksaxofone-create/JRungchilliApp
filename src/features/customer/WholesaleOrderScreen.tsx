/**
 * 🌶️ WholesaleOrderScreen — สั่งสินค้าราคาส่ง (สมาชิก)
 * ──────────────────────────────────────────────────────
 * ฟีเจอร์:
 *  - แสดงรายการสินค้าพร้อมราคา price_wholesale
 *  - กรอกจำนวน (กก.) ต่อสินค้า
 *  - รองรับหลายร้านค้าใน 1 session
 *  - ปุ่ม "ยืนยันออเดอร์" → DB.saveOrder()
 *  - Bilingual (ไทย + ภาษาเลือก)
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StatusBar, StyleSheet, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

interface CartItem {
  product_id: string;
  product_name_th: string;
  product_name_mm: string;
  product_name_en: string;
  product_name_cn: string;
  unit_price: number;
  quantity_kg: string; // string for TextInput
  unit: string;
}

export default function WholesaleOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lang, products, currentCustomer } = useAppStore();

  // ลูกค้า — มาจาก route params หรือ store
  const customer = route.params?.customer ?? currentCustomer;

  const [cart, setCart]             = useState<Record<string, string>>({});  // product_id → qty string
  const [saving, setSaving]         = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ทั้งหมด');

  // โหลดสินค้าสดจาก store
  const allProducts = products ?? [];

  // หมวดหมู่ทั้งหมด
  const categories = ['ทั้งหมด', ...Array.from(new Set(allProducts.map((p: any) => p.category).filter(Boolean)))];

  const filtered = activeCategory === 'ทั้งหมด'
    ? allProducts
    : allProducts.filter((p: any) => p.category === activeCategory);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  // ── คำนวณยอดรวม ──
  const cartTotal = () => {
    let total = 0;
    for (const [pid, qtyStr] of Object.entries(cart)) {
      const qty = parseFloat(qtyStr) || 0;
      if (qty > 0) {
        const prod = allProducts.find((p: any) => p.id === pid);
        if (prod) total += qty * (prod.price_wholesale || 0);
      }
    }
    return total;
  };

  // ── จำนวนรายการ ──
  const cartItemCount = () =>
    Object.values(cart).filter(v => parseFloat(v) > 0).length;

  // ── ยืนยันออเดอร์ ──
  const handleConfirm = () => {
    const items = Object.entries(cart)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([pid, qtyStr]) => {
        const prod = allProducts.find((p: any) => p.id === pid);
        const qty = parseFloat(qtyStr) || 0;
        return {
          id: `OI${Date.now()}_${pid}`,
          product_id: pid,
          product_name_th: prod?.name_th ?? '',
          product_name_mm: prod?.name_mm ?? '',
          product_name_en: prod?.name_en ?? '',
          product_name_cn: prod?.name_cn ?? '',
          quantity_kg: qty,
          unit_price: prod?.price_wholesale ?? 0,
          total_price: qty * (prod?.price_wholesale ?? 0),
          requested_kg: qty,
          actual_kg: 0,
          actual_weight_kg: 0,
          item_notes: '',
        };
      });

    if (items.length === 0) {
      Alert.alert(t('warning', 'th'), 'กรุณาใส่จำนวนสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    const total = cartTotal();
    const shopLabel = customer ? customer.shop_name : 'ลูกค้าทั่วไป';

    Alert.alert(
      `✅ ${t('confirm_order', 'th')}`,
      `ร้าน: ${shopLabel}\nจำนวน: ${items.length} รายการ\nยอดรวม: ฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      [
        { text: t('cancel', 'th'), style: 'cancel' },
        {
          text: `✅ ${t('confirm', 'th')}`,
          onPress: () => doSaveOrder(items, total, shopLabel),
        },
      ]
    );
  };

  const doSaveOrder = (items: any[], total: number, shopLabel: string) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const orderId = 'ORD' + Date.now();
      const orderNumber = 'WS' + Date.now().toString().slice(-6);

      DB.saveOrder(
        {
          id: orderId,
          order_number: orderNumber,
          customer_id: customer?.id ?? '',
          customer_name: shopLabel,
          customer_phone: customer?.phone ?? '',
          subtotal: total,
          discount: 0,
          total: total,
          payment_method: 'credit',
          payment_status: 'pending',
          status: 'pending',
          notes: '',
          order_type: 'pre_order',
          pack_status: 'waiting',
          scheduled_date: '',
          confirmed_by: '',
          confirmed_at: '',
          packed_at: '',
          created_at: now,
          updated_at: now,
        },
        items
      );

      setSaving(false);
      setCart({});
      Alert.alert(
        `✅ ${t('success', 'th')}`,
        `บันทึกออเดอร์ #${orderNumber} สำเร็จ\nยอดรวม: ฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
        [
          { text: 'สั่งเพิ่ม / New Order', onPress: () => setCart({}) },
          { text: '🏠 กลับ / Back', onPress: () => navigation.goBack() },
        ]
      );
    } catch (e: any) {
      setSaving(false);
      Alert.alert('❌ ' + t('error', 'th'), String(e?.message || e));
    }
  };

  // ── render รายการสินค้า ──
  const renderProduct = ({ item }: { item: any }) => {
    const qty = cart[item.id] ?? '';
    const hasQty = parseFloat(qty) > 0;
    const subTotal = (parseFloat(qty) || 0) * (item.price_wholesale || 0);

    return (
      <View style={[s.productRow, hasQty && s.productRowActive]}>
        <View style={s.productInfo}>
          <Text style={s.productName}>{getProductName(item, lang)}</Text>
          {lang !== 'th' && item.name_th ? (
            <Text style={s.productNameSub}>{item.name_th}</Text>
          ) : null}
          <View style={s.priceRow}>
            <Text style={s.priceWholesale}>
              ฿{(item.price_wholesale ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={s.priceUnit}>/{item.unit ?? 'กก.'}</Text>
          </View>
        </View>

        <View style={s.qtySection}>
          <TextInput
            style={[s.qtyInput, hasQty && s.qtyInputActive]}
            value={qty}
            onChangeText={v => {
              const cleaned = v.replace(/[^0-9.]/g, '');
              setCart(prev => ({ ...prev, [item.id]: cleaned }));
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#bbb"
          />
          <Text style={s.qtyUnit}>{item.unit ?? 'กก.'}</Text>
          {hasQty && (
            <Text style={s.qtySubTotal}>
              ฿{subTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>🏠 BACK</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>📦 {t('order_tab', 'th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('order_tab', lang)}</Text>}
          {customer && (
            <Text style={s.headerShop}>🏪 {customer.shop_name}</Text>
          )}
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* ── Summary bar ── */}
      {cartItemCount() > 0 && (
        <View style={s.summaryBar}>
          <Text style={s.summaryTxt}>
            🛒 {cartItemCount()} {lbl('products')} · ฿{cartTotal().toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      {/* ── Category filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.catChip, activeCategory === cat && s.catChipOn]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.75}
          >
            <Text style={[s.catChipTxt, activeCategory === cat && s.catChipTxtOn]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Product list ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyTxt}>{t('no_products', 'th')}</Text>
          </View>
        }
      />

      {/* ── Footer: ยืนยันออเดอร์ ── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.confirmBtn, (cartItemCount() === 0 || saving) && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={cartItemCount() === 0 || saving}
          activeOpacity={0.85}
        >
          <Text style={s.confirmBtnTxt}>
            ✅ {t('confirm_order', 'th')}
          </Text>
          {lang !== 'th' && (
            <Text style={s.confirmBtnSub}>{t('confirm_order', lang)}</Text>
          )}
          {cartItemCount() > 0 && (
            <Text style={s.confirmBtnTotal}>
              ฿{cartTotal().toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  // Header
  header: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadow(4),
  },
  backBtn:     { width: 70, paddingVertical: 6 },
  backTxt:     { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerShop:  { fontSize: 12, color: CHILLI.orange, fontWeight: '700', marginTop: 3 },

  // Summary bar
  summaryBar: {
    backgroundColor: CHILLI.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Category chips
  catScroll:   { maxHeight: 48, flexGrow: 0 },
  catContent:  { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#f9f6f3',
  },
  catChipOn:    { borderColor: CHILLI.orange, backgroundColor: '#fff3e0' },
  catChipTxt:   { fontSize: 13, color: '#666', fontWeight: '600' },
  catChipTxtOn: { color: CHILLI.orange, fontWeight: 'bold' },

  // Product list
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 100 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e8d5c4',
    ...shadow(1),
  },
  productRowActive: {
    borderColor: CHILLI.orange,
    backgroundColor: '#fff8f0',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  productNameSub: { fontSize: 11, color: '#888', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 2 },
  priceWholesale: { fontSize: 14, fontWeight: 'bold', color: CHILLI.orange },
  priceUnit: { fontSize: 11, color: '#888' },

  // Qty input
  qtySection: { alignItems: 'flex-end', gap: 4 },
  qtyInput: {
    width: 72,
    borderWidth: 1.5,
    borderColor: '#e0d0c0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: CHILLI.dark,
    backgroundColor: CHILLI.cream,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  qtyInputActive: {
    borderColor: CHILLI.orange,
    backgroundColor: '#fff3e0',
    color: CHILLI.orange,
  },
  qtyUnit: { fontSize: 11, color: '#888', textAlign: 'center' },
  qtySubTotal: { fontSize: 12, fontWeight: 'bold', color: CHILLI.orange, textAlign: 'center' },

  // Empty
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52 },
  emptyTxt: { fontSize: 16, color: '#888', marginTop: 12 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CHILLI.cream,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8d5c4',
    ...shadow(4),
  },
  confirmBtn: {
    backgroundColor: CHILLI.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow(3),
  },
  confirmBtnDisabled: {
    backgroundColor: '#bbb',
  },
  confirmBtnTxt:   { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  confirmBtnSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  confirmBtnTotal: { color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 4 },
});
