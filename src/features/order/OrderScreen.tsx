import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Alert, SafeAreaView, StatusBar, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";

interface CartItem {
  product: any;
  quantity_kg: number;
  unit_price: number;
  price_type: 'retail' | 'wholesale';
}

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '🇹🇭' },
  { code: 'mm', flag: '🇲🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'cn', flag: '🇨🇳' },
];

export default function OrderScreen() {
  const { lang, setLang, logout, settings } = useAppStore();
  const [products, setProducts]       = useState<any[]>([]);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showCart, setShowCart]       = useState(false);
  const [customerName, setCustomerName] = useState('');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    try {
      const rows = DB.getAllProducts();
      setProducts(rows.filter((p: any) => p.is_active === 1));
    } catch (e) {
      console.error('Load products error:', e);
    } finally {
      setLoading(false);
    }
  }, []));

  // label helper: Thai / SecondLang
  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const getQty = (id: string) =>
    cart.find(c => c.product.id === id)?.quantity_kg || 0;

  const cartCount = cart.reduce((s, c) => s + c.quantity_kg, 0);
  const cartTotal = cart.reduce((s, c) => s + c.quantity_kg * c.unit_price, 0);

  const addQty = (product: any, delta: number) => {
    const price = product.price_retail;
    setCart(prev => {
      const idx = prev.findIndex(c => c.product.id === product.id);
      const current = idx >= 0 ? prev[idx].quantity_kg : 0;
      const next = Math.round((current + delta) * 10) / 10;
      if (next <= 0) return prev.filter(c => c.product.id !== product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity_kg: next };
        return updated;
      }
      return [...prev, { product, quantity_kg: next, unit_price: price, price_type: 'retail' }];
    });
  };

  const handleOrder = () => {
    if (!customerName.trim()) {
      Alert.alert(t('warning','th'), lbl('my_shop')); return;
    }
    if (cart.length === 0) {
      Alert.alert(t('warning','th'), lbl('no_items')); return;
    }
    setSaving(true);
    try {
      const id  = 'ORD' + Date.now();
      const now = new Date().toISOString();
      DB.saveOrder(
        {
          id, order_number: id,
          customer_name: customerName.trim(),
          customer_phone: '',
          subtotal: cartTotal, discount: 0, total: cartTotal,
          payment_method: 'credit',
          payment_status: 'pending',
          status: 'pending',
          notes: '',
          created_at: now, updated_at: now,
        },
        cart.map((c, i) => ({
          id: `OI${Date.now()}${i}`,
          product_id: c.product.id,
          product_name_th: c.product.name_th || '',
          product_name_mm: c.product.name_mm || '',
          product_name_en: c.product.name_en || '',
          product_name_cn: c.product.name_cn || '',
          quantity_kg: c.quantity_kg,
          unit_price: c.unit_price,
          total_price: c.quantity_kg * c.unit_price,
        }))
      );
      setCart([]);
      setShowCart(false);
      setCustomerName('');
      Alert.alert(
        '✅ ' + t('success','th'),
        `${t('confirm_order','th')}${lang !== 'th' ? '\n' + t('confirm_order', lang) : ''}\n\n` +
        `${t('order_number','th')}: ${id}`
      );
    } catch (e: any) {
      Alert.alert('❌ ' + t('error','th'), String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name_th || '').toLowerCase().includes(q) ||
      (p.name_mm || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.name_cn || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />

      {/* ── Navbar ── */}
      <View style={s.navbar}>
        <Text style={s.navTitle}>🛒 {t('role_order','th')}</Text>
        {/* Language switcher */}
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[s.langBtn, lang === l.code && s.langBtnOn]}
              onPress={() => setLang(l.code)}
            >
              <Text style={s.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.homeBtn} onPress={() =>
          Alert.alert('ออกจากระบบ', 'ต้องการออก?', [
            { text: t('cancel','th'), style: 'cancel' },
            { text: t('confirm','th'), onPress: logout },
          ])
        }>
          <Text style={s.homeBtnTxt}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`🔍 ${lbl('search')}...`}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* ── Product List ── */}
      {loading ? (
        <ActivityIndicator color="#27ae60" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyTxt}>{lbl('no_products')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const qty = getQty(item.id);
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            return (
              <View style={[s.productRow, qty > 0 && s.productRowActive]}>
                {/* ชื่อสินค้า */}
                <View style={s.productInfo}>
                  <Text style={s.productNameTh} numberOfLines={2}>{item.name_th}</Text>
                  {!!secondary && (
                    <Text style={s.productNameSub} numberOfLines={1}>{secondary}</Text>
                  )}
                  <View style={s.productMeta}>
                    <Text style={s.productPrice}>฿{item.price_retail}/กก.</Text>
                    <Text style={[s.productStock, item.stock_kg < 5 && s.lowStock]}>
                      {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                    </Text>
                  </View>
                </View>

                {/* ± ปุ่มเพิ่ม/ลด */}
                <View style={s.qtyRow}>
                  <TouchableOpacity
                    style={[s.qtyBtn, s.qtyBtnMinus]}
                    onPress={() => addQty(item, -0.5)}
                    disabled={qty <= 0}
                  >
                    <Text style={s.qtyBtnTxt}>－</Text>
                  </TouchableOpacity>
                  <View style={s.qtyValBox}>
                    <Text style={s.qtyVal}>{qty > 0 ? qty.toFixed(1) : '0'}</Text>
                    <Text style={s.qtyUnit}>kg</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.qtyBtn, s.qtyBtnPlus]}
                    onPress={() => addQty(item, 0.5)}
                  >
                    <Text style={s.qtyBtnTxt}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Cart Bar (bottom) ── */}
      {cart.length > 0 && (
        <TouchableOpacity style={s.cartBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          {/* Cart icon + badge */}
          <View style={s.cartIconWrap}>
            <Text style={s.cartIcon}>🛒</Text>
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeTxt}>{cart.length}</Text>
            </View>
          </View>
          <View style={s.cartBarInfo}>
            <Text style={s.cartBarTxt}>
              {t('bill_items','th')}{lang !== 'th' ? ` / ${t('bill_items',lang)}` : ''}
            </Text>
            <Text style={s.cartBarSub}>{cartCount.toFixed(1)} kg · {cart.length} รายการ</Text>
          </View>
          <View style={s.cartBarRight}>
            <Text style={s.cartBarTotal}>฿{cartTotal.toFixed(2)}</Text>
            <Text style={s.cartBarArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ─── Cart Modal ─── */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Header */}
              <View style={m.header}>
                <View>
                  <Text style={m.title}>🛒 {t('bill_items','th')}</Text>
                  {lang !== 'th' && <Text style={m.titleSub}>{t('bill_items', lang)}</Text>}
                </View>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Text style={m.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ชื่อร้าน / Shop Name */}
              <Text style={m.lbl}>
                🏪 {t('my_shop','th')}{lang !== 'th' ? ` / ${t('my_shop',lang)}` : ''}
              </Text>
              <TextInput
                style={m.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder={`${t('shop_name','th')} / ${t('shop_name','en')}`}
                placeholderTextColor="#9ca3af"
              />

              {/* รายการสินค้า */}
              <Text style={m.lbl}>
                📋 {t('order_number','th')}{lang !== 'th' ? ` / ${t('order_number',lang)}` : ''}
              </Text>
              {cart.map(item => {
                const secondary = lang !== 'th' ? getProductName(item.product, lang) : '';
                return (
                  <View key={item.product.id} style={m.cartItem}>
                    <View style={m.cartInfo}>
                      <Text style={m.cartNameTh} numberOfLines={1}>{item.product.name_th}</Text>
                      {!!secondary && (
                        <Text style={m.cartNameSub} numberOfLines={1}>{secondary}</Text>
                      )}
                      <Text style={m.cartDetail}>
                        {item.quantity_kg.toFixed(1)} kg × ฿{item.unit_price} = ฿{(item.quantity_kg * item.unit_price).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={m.cartDel}
                      onPress={() => setCart(prev => prev.filter(c => c.product.id !== item.product.id))}
                    >
                      <Text style={m.cartDelTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* สรุปยอด */}
              <View style={m.totalBox}>
                <View style={m.totalRow}>
                  <Text style={m.totalLbl}>
                    {t('total','th')}{lang !== 'th' ? ` / ${t('total',lang)}` : ''}
                  </Text>
                  <Text style={m.totalVal}>฿{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={m.totalRow}>
                  <Text style={m.totalLbl}>น้ำหนักรวม / Total Weight</Text>
                  <Text style={m.totalVal}>{cartCount.toFixed(1)} kg</Text>
                </View>
              </View>

              {/* ปุ่ม */}
              <View style={m.btnRow}>
                <TouchableOpacity style={[m.btn, m.btnGrey]} onPress={() => setShowCart(false)}>
                  <Text style={m.btnGreyTxt}>{t('cancel','th')}</Text>
                  {lang !== 'th' && <Text style={m.btnGreySub}>{t('cancel', lang)}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[m.btn, m.btnGreen, saving && { opacity: 0.6 }]}
                  onPress={handleOrder}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Text style={m.btnGreenTxt}>✅ {t('confirm_order','th')}</Text>
                        {lang !== 'th' && <Text style={m.btnGreenSub}>{t('confirm_order', lang)}</Text>}
                      </>
                  }
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: { backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, elevation: 4, gap: 6 },
  navTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', flex: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnOn: { backgroundColor: '#fff' },
  langFlag: { fontSize: 18 },
  homeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  homeBtnTxt: { fontSize: 18 },
  searchBox: { backgroundColor: '#fff', padding: 10, elevation: 2 },
  searchInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa' },
  listContent: { padding: 10, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: '#aaa', textAlign: 'center' },
  productRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, borderWidth: 1.5, borderColor: '#e0e0e0' },
  productRowActive: { borderColor: '#27ae60', backgroundColor: '#f0faf5' },
  productInfo: { flex: 1, marginRight: 10 },
  productNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  productNameSub: { fontSize: 12, color: '#888', marginTop: 2 },
  productMeta: { flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'center' },
  productPrice: { fontSize: 13, color: '#27ae60', fontWeight: '700' },
  productStock: { fontSize: 11, color: '#888' },
  lowStock: { color: '#e67e22' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  qtyBtnMinus: { backgroundColor: '#fee2e2' },
  qtyBtnPlus: { backgroundColor: '#dcfce7' },
  qtyBtnTxt: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  qtyValBox: { alignItems: 'center', minWidth: 44 },
  qtyVal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  qtyUnit: { fontSize: 10, color: '#888' },
  // Cart bar
  cartBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, elevation: 10 },
  cartIconWrap: { position: 'relative', marginRight: 12 },
  cartIcon: { fontSize: 30 },
  cartBadge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#c0392b', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cartBarInfo: { flex: 1 },
  cartBarTxt: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  cartBarSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  cartBarRight: { alignItems: 'flex-end' },
  cartBarTotal: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cartBarArrow: { fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  titleSub: { fontSize: 13, color: '#888', marginTop: 2 },
  closeBtn: { fontSize: 20, color: '#aaa', fontWeight: 'bold', padding: 4 },
  lbl: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#222', marginBottom: 4 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cartNameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  cartDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  cartDel: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cartDelTxt: { color: '#c0392b', fontSize: 14, fontWeight: 'bold' },
  totalBox: { backgroundColor: '#f0faf5', borderRadius: 10, padding: 14, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLbl: { fontSize: 14, color: '#555', fontWeight: '600' },
  totalVal: { fontSize: 15, fontWeight: 'bold', color: '#27ae60' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnGrey: { backgroundColor: '#f0f0f0' },
  btnGreen: { backgroundColor: '#27ae60', flex: 2 },
  btnGreyTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
  btnGreySub: { fontSize: 10, color: '#888', marginTop: 2 },
  btnGreenTxt: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
  btnGreenSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});