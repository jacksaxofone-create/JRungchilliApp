import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StatusBar, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow, orderStatusColor } from "../../core/theme";

type PayMethod = 'credit' | 'transfer' | 'cash';
type TabType = 'order' | 'history';

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '🇹🇭' },
  { code: 'mm', flag: '🇲🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'cn', flag: '🇨🇳' },
];

const CATEGORIES = ['ทั้งหมด', 'พริก', 'ผัก', 'เครื่องเทศ', 'อื่นๆ'];

// ─── Status helpers (5-stage complete) ──────────────────────
function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending':       return '🟡';
    case 'confirmed':     return '🔵';
    case 'packing':       return '🟠';
    case 'ready_to_ship': return '🟢';   // ✅ fixed
    case 'delivered':     return '✅';   // ✅ fixed (was 🟢)
    case 'cancelled':     return '❌';
    default:              return '⚪';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':       return 'รอยืนยัน';
    case 'confirmed':     return 'ยืนยันแล้ว';
    case 'packing':       return 'กำลังแพค';
    case 'ready_to_ship': return 'พร้อมส่ง'; // ✅ new
    case 'delivered':     return 'ส่งแล้ว';
    case 'cancelled':     return 'ยกเลิก';
    default:              return status;
  }
}

// ─── Main Screen ─────────────────────────────────────────────
export default function CustomerDashboardScreen() {
  const { lang, setLang, logout, currentCustomer } = useAppStore();
  const [tab, setTab] = useState<TabType>('order');

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ─── Navbar ─── */}
      <View style={s.navbar}>
        {/* Logo ring */}
        <View style={s.logoRing}>
          <Text style={{ fontSize: 18 }}>🛒</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle} numberOfLines={1}>
            {currentCustomer?.shop_name || 'ลูกค้า'}
          </Text>
          {lang !== 'th' && <Text style={s.navSub}>{t('role_order', lang)}</Text>}
        </View>
        {/* Type badge */}
        {currentCustomer?.customer_type === 'wholesale' && (
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeTxt}>📦 ส่ง</Text>
          </View>
        )}
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity key={l.code}
              style={[s.langBtn, lang === l.code && s.langBtnOn]}
              onPress={() => setLang(l.code)}>
              <Text style={s.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() =>
          Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบ?', [
            { text: t('cancel', 'th'), style: 'cancel' },
            { text: t('confirm', 'th'), onPress: logout },
          ])}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Credit Banner ─── */}
      {currentCustomer && (
        <CreditBanner customer={currentCustomer} lang={lang} />
      )}

      {/* ─── Tab Bar ─── */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'order' && s.tabBtnActive]}
          onPress={() => setTab('order')}>
          <Text style={[s.tabTxt, tab === 'order' && s.tabTxtActive]}>
            🛒 สั่งสินค้า{lang !== 'th' ? `\n${t('role_order', lang)}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'history' && s.tabBtnActive]}
          onPress={() => setTab('history')}>
          <Text style={[s.tabTxt, tab === 'history' && s.tabTxtActive]}>
            📋 ประวัติ{lang !== 'th' ? `\n${t('orders', lang)}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'order'
        ? <OrderTab lang={lang} customer={currentCustomer} lbl={lbl} />
        : <HistoryTab lang={lang} customer={currentCustomer} lbl={lbl} />
      }
    </SafeAreaView>
  );
}

// ─── Credit Banner ───────────────────────────────────────────
function CreditBanner({ customer, lang }: { customer: any; lang: Lang }) {
  if (!customer || customer.credit_limit <= 0) return null;
  const creditUsed = DB.getTotalCreditUsed(customer.id) || customer.credit_used || 0;
  const creditLeft = customer.credit_limit - creditUsed;
  const pct = Math.min(100, Math.round((creditUsed / customer.credit_limit) * 100));
  const barColor = pct >= 100 ? CHILLI.red : pct >= 80 ? CHILLI.orange : CHILLI.green;

  return (
    <View style={cb.container}>
      <View style={cb.row}>
        <View>
          <Text style={cb.label}>
            💳 วงเงินเครดิต{lang !== 'th' ? ` / ${t('credit', lang)}` : ''}
          </Text>
          <Text style={cb.used}>
            ใช้: ฿{creditUsed.toLocaleString()} / ฿{customer.credit_limit.toLocaleString()}
          </Text>
        </View>
        <View style={[cb.leftBadge, { backgroundColor: pct >= 100 ? '#7b241c' : pct >= 80 ? '#784212' : '#1a5e38' }]}>
          <Text style={[cb.leftVal, { color: barColor }]}>฿{creditLeft.toLocaleString()}</Text>
          <Text style={cb.leftLbl}>คงเหลือ</Text>
        </View>
      </View>
      <View style={cb.barBg}>
        <View style={[cb.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      {pct >= 80 && (
        <View style={cb.warningRow}>
          <Text style={[cb.warning, { color: barColor }]}>
            {pct >= 100 ? '🔴 วงเงินเต็ม — ต้องโอนก่อนสั่ง' : '🟡 วงเงินใกล้เต็ม'}
          </Text>
        </View>
      )}
    </View>
  );
}
const cb = StyleSheet.create({
  container: {
    backgroundColor: CHILLI.darkMid, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: CHILLI.textOnDarkSub, fontWeight: '600' },
  used: { fontSize: 11, color: CHILLI.textOnDarkHint, marginTop: 2 },
  leftBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  leftVal: { fontSize: 16, fontWeight: '800' },
  leftLbl: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 1 },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  warningRow: { marginTop: 6 },
  warning: { fontSize: 11, fontWeight: '700' },
});

// ─── Order Tab ───────────────────────────────────────────────
function OrderTab({ lang, customer, lbl }: { lang: Lang; customer: any; lbl: (k: string) => string }) {
  const [products, setProducts]           = useState<any[]>([]);
  const [cart, setCart]                   = useState<Record<string, number>>({});
  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('ทั้งหมด');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [showCart, setShowCart]           = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [payMethod, setPayMethod]         = useState<PayMethod>('credit');
  const [orderNotes, setOrderNotes]       = useState('');
  const [itemNotes, setItemNotes]         = useState<Record<string, string>>({});
  const [subCustomerName, setSubCustomerName]         = useState('');
  const [subCustomerSuggests, setSubCustomerSuggests] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    try { setProducts(DB.getAllProducts().filter((p: any) => p.is_active === 1)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []));

  const isWholesale = customer?.customer_type === 'wholesale';
  const getPrice = (product: any) =>
    isWholesale ? product.price_wholesale : product.price_retail;
  const cartItems   = products.filter(p => (cart[p.id] || 0) > 0);
  const cartTotal   = cartItems.reduce((s, p) => s + (cart[p.id] || 0) * getPrice(p), 0);
  const cartWeight  = cartItems.reduce((s, p) => s + (cart[p.id] || 0), 0);
  const cartCount   = cartItems.length;

  const onSubCustomerChange = (text: string) => {
    setSubCustomerName(text);
    if (text.length >= 1 && customer?.id) {
      const results = DB.searchSubCustomers(customer.id, text);
      setSubCustomerSuggests(results.filter(r => r !== text));
    } else {
      setSubCustomerSuggests([]);
    }
  };

  const addQty = (id: string, delta: number) => {
    setCart(prev => {
      const cur  = prev[id] || 0;
      const next = Math.round((cur + delta) * 10) / 10;
      if (next <= 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  };

  const handleOrder = () => {
    if (cartCount === 0)    { Alert.alert(t('warning', 'th'), lbl('no_items')); return; }
    if (!scheduledDate)     { Alert.alert(t('warning', 'th'), 'กรุณาเลือกวันที่ต้องการรับสินค้า'); return; }
    if (customer && customer.credit_limit > 0 && payMethod === 'credit') {
      const creditUsed = DB.getTotalCreditUsed(customer.id) || customer.credit_used || 0;
      if (creditUsed + cartTotal > customer.credit_limit) {
        Alert.alert('🔴 วงเงินไม่พอ',
          `ยอดค้าง: ฿${creditUsed.toLocaleString()}\nออเดอร์ใหม่: ฿${cartTotal.toFixed(0)}\nวงเงิน: ฿${customer.credit_limit.toLocaleString()}\n\nกรุณาเลือกชำระโอนก่อนส่ง`
        ); return;
      }
    }
    setSaving(true);
    try {
      const id  = 'ORD' + Date.now();
      const now = new Date().toISOString();
      const items = cartItems.map((p, i) => ({
        id: `OI${Date.now()}${i}`,
        product_id: p.id,
        product_name_th: p.name_th || '',
        product_name_mm: p.name_mm || '',
        product_name_en: p.name_en || '',
        product_name_cn: p.name_cn || '',
        quantity_kg: cart[p.id] || 0,
        unit_price: getPrice(p),
        total_price: (cart[p.id] || 0) * getPrice(p),
        requested_kg: cart[p.id] || 0,
        actual_kg: 0,
        actual_weight_kg: 0,
        item_notes: itemNotes[p.id] || '',
      }));
      DB.saveOrder({
        id, order_number: id,
        customer_id: customer?.id || '',
        customer_name: customer?.shop_name || '',
        customer_phone: customer?.phone || '',
        subtotal: cartTotal, discount: 0, total: cartTotal,
        payment_method: payMethod,
        payment_status: 'pending',
        status: 'pending',
        order_type: 'pre_order',
        pack_status: 'waiting',
        scheduled_date: scheduledDate,
        notes: [subCustomerName.trim() ? `ส่งให้: ${subCustomerName.trim()}` : '', orderNotes.trim()].filter(Boolean).join(' | '),
        created_at: now, updated_at: now,
      }, items);
      if (subCustomerName.trim() && customer?.id) {
        DB.saveSubCustomer(customer.id, subCustomerName.trim());
      }
      setCart({}); setShowCart(false); setOrderNotes('');
      setItemNotes({}); setSubCustomerName(''); setSubCustomerSuggests([]);
      Alert.alert(
        '✅ ' + t('success', 'th'),
        `${t('confirm_order', 'th')}${lang !== 'th' ? '\n' + t('confirm_order', lang) : ''}\n\n` +
        `เลขออเดอร์: ${id}\n` +
        (subCustomerName.trim() ? `ส่งให้: ${subCustomerName.trim()}\n` : '') +
        `วันที่รับสินค้า: ${scheduledDate}\n` +
        `ยอดโดยประมาณ: ฿${cartTotal.toFixed(2)}\n\n` +
        `⚠️ ยอดสุดท้ายอาจต่างจากที่สั่ง เมื่อชั่งน้ำหนักจริง`
      );
    } catch (e: any) {
      Alert.alert('❌ ' + t('error', 'th'), String(e?.message || e));
    } finally { setSaving(false); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.name_th||'').toLowerCase().includes(q) ||
      (p.name_mm||'').toLowerCase().includes(q) ||
      (p.name_en||'').toLowerCase().includes(q) ||
      (p.name_cn||'').toLowerCase().includes(q);
    const matchCat = category === 'ทั้งหมด' || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Wholesale mode bar */}
      {isWholesale && (
        <View style={ot.wholesaleBar}>
          <Text style={ot.wholesaleBarTxt}>⚡ ราคาส่ง (Wholesale) — ลูกค้าประเภทส่ง</Text>
        </View>
      )}

      {/* Search */}
      <View style={ot.searchBox}>
        <TextInput style={ot.searchInput} value={search} onChangeText={setSearch}
          placeholder={`🔍 ${lbl('search')}...`} placeholderTextColor={CHILLI.textLight} />
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ot.catScroll}>
        <View style={ot.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat}
              style={[ot.catBtn, category === cat && ot.catBtnActive]}
              onPress={() => setCategory(cat)}>
              <Text style={[ot.catTxt, category === cat && ot.catTxtActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={CHILLI.red} size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={ot.listContent}
          ListEmptyComponent={
            <View style={ot.emptyBox}>
              <Text style={{ fontSize: 48, textAlign: 'center' }}>📦</Text>
              <Text style={ot.emptyTxt}>{lbl('no_products')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const qty  = cart[item.id] || 0;
            const price = getPrice(item);
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            return (
              <View style={[ot.productRow, qty > 0 && ot.productRowActive]}>
                {qty > 0 && <View style={[ot.rowAccent, { backgroundColor: isWholesale ? CHILLI.orange : CHILLI.red }]} />}
                <View style={ot.productInfo}>
                  <Text style={ot.productNameTh}>{item.name_th}</Text>
                  {!!secondary && <Text style={ot.productNameSub}>{secondary}</Text>}
                  <View style={ot.productMeta}>
                    <View style={[ot.priceBadge, { backgroundColor: isWholesale ? '#fff3e0' : '#fff0ee' }]}>
                      <Text style={[ot.priceTxt, { color: isWholesale ? CHILLI.orange : CHILLI.red }]}>
                        ฿{price}/กก. {isWholesale ? '📦' : '🛒'}
                      </Text>
                    </View>
                    <Text style={[ot.stockTxt, item.stock_kg < 5 && ot.lowStock]}>
                      {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                    </Text>
                  </View>
                </View>
                <View style={ot.qtyRow}>
                  <TouchableOpacity style={ot.qtyBtnMinus}
                    onPress={() => addQty(item.id, -0.5)} disabled={qty <= 0}>
                    <Text style={ot.qtyBtnTxt}>－</Text>
                  </TouchableOpacity>
                  <View style={ot.qtyValBox}>
                    <Text style={[ot.qtyVal, qty > 0 && { color: isWholesale ? CHILLI.orange : CHILLI.red }]}>
                      {qty > 0 ? qty.toFixed(1) : '0'}
                    </Text>
                    <Text style={ot.qtyUnit}>kg</Text>
                  </View>
                  <TouchableOpacity style={[ot.qtyBtnPlus, { backgroundColor: isWholesale ? '#fff3e0' : '#fff0ee' }]}
                    onPress={() => addQty(item.id, 0.5)}>
                    <Text style={[ot.qtyBtnTxt, { color: isWholesale ? CHILLI.orange : CHILLI.red }]}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity style={ot.cartBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={ot.cartIconWrap}>
            <Text style={ot.cartIcon}>🛒</Text>
            <View style={ot.cartBadge}>
              <Text style={ot.cartBadgeTxt}>{cartCount}</Text>
            </View>
          </View>
          <View style={ot.cartBarInfo}>
            <Text style={ot.cartBarTxt}>{lbl('bill_items')}</Text>
            <Text style={ot.cartBarSub}>{cartWeight.toFixed(1)} kg · {cartCount} รายการ</Text>
          </View>
          <View style={ot.cartBarRight}>
            <Text style={ot.cartBarTotal}>฿{cartTotal.toFixed(0)}</Text>
            <Text style={ot.cartBarArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ─── Cart Modal ─── */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={cm.overlay}>
          <View style={cm.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={cm.handle} />
              <View style={cm.header}>
                <View>
                  <Text style={cm.title}>🛒 {lbl('bill_items')}</Text>
                  <Text style={cm.titleSub}>{customer?.shop_name} · ยอดโดยประมาณ</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCart(false)} style={cm.closeBtn}>
                  <Text style={cm.closeTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Sub-customer (wholesale) */}
              {customer?.customer_type === 'wholesale' && (
                <>
                  <Text style={cm.lbl}>
                    👤 ส่งสินค้าให้ใคร (ลูกค้าของร้านท่าน){lang !== 'th' ? ' / End Customer' : ''}
                  </Text>
                  <TextInput
                    style={cm.input}
                    value={subCustomerName} onChangeText={onSubCustomerChange}
                    placeholder="พิมชื่อลูกค้า 1 ตัว ระบบแนะนำให้..."
                    placeholderTextColor={CHILLI.textLight}
                  />
                  {subCustomerSuggests.length > 0 && (
                    <View style={cm.suggestBox}>
                      {subCustomerSuggests.map(name => (
                        <TouchableOpacity key={name} style={cm.suggestItem}
                          onPress={() => { setSubCustomerName(name); setSubCustomerSuggests([]); }}>
                          <Text style={cm.suggestTxt}>👤 {name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Date picker */}
              <Text style={cm.lbl}>📅 วันที่ต้องการรับสินค้า{lang !== 'th' ? ' / Delivery Date' : ''}</Text>
              <View style={cm.datePicker}>
                <TouchableOpacity style={cm.dateArrowBtn}
                  onPress={() => {
                    const d = new Date(scheduledDate); d.setDate(d.getDate() - 1);
                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                    if (d >= tomorrow) setScheduledDate(d.toISOString().split('T')[0]);
                    else Alert.alert('⚠️', 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้\nกรุณาเลือกวันพรุ่งนี้ขึ้นไป');
                  }}>
                  <Text style={cm.dateArrowTxt}>◀</Text>
                </TouchableOpacity>
                <View style={cm.dateDisplay}>
                  <Text style={cm.dateTxt}>
                    {new Date(scheduledDate).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={cm.dateSubTxt}>
                    {(() => {
                      const today = new Date(); today.setHours(0,0,0,0);
                      const sel   = new Date(scheduledDate); sel.setHours(0,0,0,0);
                      const diff  = Math.round((sel.getTime() - today.getTime()) / 86400000);
                      if (diff === 1) return '(พรุ่งนี้)';
                      if (diff === 2) return '(มะรืนนี้)';
                      return `(อีก ${diff} วัน)`;
                    })()}
                  </Text>
                </View>
                <TouchableOpacity style={cm.dateArrowBtn}
                  onPress={() => {
                    const d = new Date(scheduledDate); d.setDate(d.getDate() + 1);
                    setScheduledDate(d.toISOString().split('T')[0]);
                  }}>
                  <Text style={cm.dateArrowTxt}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Payment method */}
              <Text style={cm.lbl}>💳 {lbl('confirm_pay')}</Text>
              <View style={cm.payRow}>
                {(['credit', 'transfer', 'cash'] as PayMethod[]).map(pm => (
                  <TouchableOpacity key={pm}
                    style={[cm.payBtn, payMethod === pm && cm.payBtnActive]}
                    onPress={() => setPayMethod(pm)}>
                    <Text style={cm.payBtnIcon}>{pm === 'cash' ? '💵' : pm === 'transfer' ? '🏦' : '💳'}</Text>
                    <Text style={[cm.payBtnTxt, payMethod === pm && cm.payBtnTxtActive]}>{t(pm, 'th')}</Text>
                    {lang !== 'th' && (
                      <Text style={[cm.payBtnSub, payMethod === pm && cm.payBtnTxtActive]}>{t(pm, lang)}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cart items */}
              <Text style={cm.lbl}>📋 รายการสินค้า</Text>
              {cartItems.map(item => {
                const qty   = cart[item.id] || 0;
                const price = getPrice(item);
                const secondary = lang !== 'th' ? getProductName(item, lang) : '';
                return (
                  <View key={item.id} style={cm.cartItem}>
                    <View style={[cm.cartAccent, { backgroundColor: isWholesale ? CHILLI.orange : CHILLI.red }]} />
                    <View style={cm.cartInfo}>
                      <Text style={cm.cartNameTh}>{item.name_th}</Text>
                      {!!secondary && <Text style={cm.cartNameSub}>{secondary}</Text>}
                      <Text style={cm.cartDetail}>
                        {qty.toFixed(1)} kg × ฿{price} =
                        <Text style={{ color: isWholesale ? CHILLI.orange : CHILLI.red, fontWeight: '700' }}>
                          {' '}฿{(qty * price).toFixed(2)}
                        </Text>
                      </Text>
                      <TextInput style={cm.itemNoteInput}
                        value={itemNotes[item.id] || ''}
                        onChangeText={v => setItemNotes(prev => ({ ...prev, [item.id]: v }))}
                        placeholder="หมายเหตุ (เช่น ขอเขียวล้วน)"
                        placeholderTextColor={CHILLI.textLight} />
                    </View>
                    <TouchableOpacity style={cm.cartDel}
                      onPress={() => setCart(prev => { const { [item.id]: _, ...rest } = prev; return rest; })}>
                      <Text style={cm.cartDelTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Notes */}
              <Text style={cm.lbl}>📝 {lbl('notes')}</Text>
              <TextInput style={cm.input} value={orderNotes} onChangeText={setOrderNotes}
                placeholder="หมายเหตุออเดอร์ (ไม่บังคับ)" placeholderTextColor={CHILLI.textLight}
                multiline numberOfLines={2} />

              {/* Summary */}
              <View style={cm.totalBox}>
                <View style={cm.totalRow}>
                  <Text style={cm.totalLbl}>{lbl('total')}</Text>
                  <Text style={cm.totalVal}>฿{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={cm.totalRow}>
                  <Text style={cm.totalLbl}>น้ำหนักรวม</Text>
                  <Text style={cm.totalVal}>{cartWeight.toFixed(1)} kg</Text>
                </View>
                <Text style={cm.noteWarning}>⚠️ ยอดโดยประมาณ — ยอดจริงคิดหลังชั่งน้ำหนัก</Text>
              </View>

              <View style={cm.btnRow}>
                <TouchableOpacity style={[cm.btn, cm.btnGrey]} onPress={() => setShowCart(false)}>
                  <Text style={cm.btnGreyTxt}>{t('cancel', 'th')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[cm.btn, cm.btnConfirm, saving && { opacity: 0.6 }]}
                  onPress={handleOrder} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> :
                    <Text style={cm.btnConfirmTxt}>✅ {lbl('confirm_order')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── History Tab ─────────────────────────────────────────────
function HistoryTab({ lang, customer, lbl }: { lang: Lang; customer: any; lbl: (k: string) => string }) {
  const [orders, setOrders]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems]     = useState<any[]>([]);
  const [refreshKey, setRefreshKey]     = useState(0);

  const loadOrders = useCallback(() => {
    setLoading(true);
    try {
      const list = customer?.id
        ? DB.getOrdersByCustomerId(customer.id)
        : DB.getOrdersByCustomer(customer?.shop_name || '');
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      setOrders(list.filter((o: any) => new Date(o.created_at) >= threeDaysAgo));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [refreshKey]);

  useFocusEffect(loadOrders);

  const handleCancelOrder = (order: any) => {
    Alert.alert(
      '❌ ยกเลิกออเดอร์',
      `ยืนยันยกเลิกออเดอร์ ${order.order_number}?\n\nออเดอร์จะถูกยกเลิกทันที`,
      [
        { text: 'ไม่ยกเลิก', style: 'cancel' },
        {
          text: '✅ ยืนยันยกเลิก', style: 'destructive',
          onPress: () => {
            try {
              DB.updateOrderStatus(order.id, 'cancelled');
              Alert.alert('✅', `ยกเลิกออเดอร์ ${order.order_number} แล้ว`);
              if (selectedOrder?.id === order.id) setSelectedOrder(null);
              setRefreshKey(k => k + 1);
            } catch { Alert.alert('❌', 'ยกเลิกไม่สำเร็จ กรุณาลองใหม่'); }
          },
        },
      ]
    );
  };

  // ─── Order Detail view ───
  if (selectedOrder) {
    const statusColor = orderStatusColor(selectedOrder.status);
    return (
      <ScrollView style={{ flex: 1, backgroundColor: CHILLI.cream }} contentContainerStyle={{ padding: 12 }}>
        <TouchableOpacity style={ht.backBtn} onPress={() => setSelectedOrder(null)}>
          <Text style={ht.backBtnTxt}>← {t('back', 'th')}</Text>
        </TouchableOpacity>

        {/* Order detail card */}
        <View style={[ht.detailCard, { borderTopColor: statusColor }]}>
          <View style={ht.detailHeader}>
            <View style={[ht.statusCircle, { backgroundColor: statusColor }]}>
              <Text style={ht.statusCircleIcon}>{getStatusIcon(selectedOrder.status)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={ht.detailNum}>{selectedOrder.order_number}</Text>
              <Text style={[ht.detailStatus, { color: statusColor }]}>
                {getStatusText(selectedOrder.status)}
              </Text>
            </View>
          </View>
          <View style={ht.detailInfoRow}>
            <Text style={ht.detailLabel}>📅 วันที่สั่ง</Text>
            <Text style={ht.detailValue}>{new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}</Text>
          </View>
          {selectedOrder.scheduled_date && (
            <View style={ht.detailInfoRow}>
              <Text style={ht.detailLabel}>🚚 กำหนดส่ง</Text>
              <Text style={ht.detailValue}>{selectedOrder.scheduled_date}</Text>
            </View>
          )}
          <View style={ht.detailInfoRow}>
            <Text style={ht.detailLabel}>💳 ชำระ</Text>
            <Text style={ht.detailValue}>{t(selectedOrder.payment_method, 'th')}</Text>
          </View>
        </View>

        {/* Items */}
        {orderItems.map(item => {
          const secondary = lang !== 'th' ? getProductName(item, lang) : '';
          const displayKg = item.actual_weight_kg > 0 ? item.actual_weight_kg : item.quantity_kg;
          return (
            <View key={item.id} style={ht.itemCard}>
              <Text style={ht.itemName}>{item.product_name_th}</Text>
              {!!secondary && <Text style={ht.itemSub}>{secondary}</Text>}
              <Text style={ht.itemDetail}>สั่ง: {item.quantity_kg} kg</Text>
              {item.actual_weight_kg > 0 && (
                <Text style={[ht.itemDetail, { color: CHILLI.green, fontWeight: '600' }]}>
                  ชั่งจริง: {item.actual_weight_kg} kg
                </Text>
              )}
              <Text style={ht.itemPrice}>฿{(displayKg * item.unit_price).toFixed(2)}</Text>
            </View>
          );
        })}

        {/* Total */}
        <View style={ht.totalBox}>
          <View style={ht.totalRow}>
            <Text style={ht.totalLbl}>ยอดรวม (โดยประมาณ)</Text>
            <Text style={ht.totalVal}>฿{selectedOrder.total.toFixed(2)}</Text>
          </View>
          <Text style={ht.noteWarning}>⚠️ ยอดสุดท้ายคิดหลังชั่งน้ำหนักจริง</Text>
        </View>

        {/* Cancel button */}
        {selectedOrder.status === 'pending' && (
          <TouchableOpacity style={ht.cancelBtn} onPress={() => handleCancelOrder(selectedOrder)} activeOpacity={0.8}>
            <Text style={ht.cancelBtnTxt}>❌ ยกเลิกออเดอร์นี้{lang !== 'th' ? ' / Cancel Order' : ''}</Text>
            <Text style={ht.cancelBtnSub}>ยกเลิกได้เฉพาะ "รอยืนยัน" เท่านั้น</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  if (loading) return <ActivityIndicator color={CHILLI.red} size="large" style={{ marginTop: 32 }} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 12, paddingBottom: 20, backgroundColor: CHILLI.cream }}
      ListHeaderComponent={
        <Text style={ht.histTitle}>
          ประวัติออเดอร์ (3 วัน){lang !== 'th' ? `\n${t('orders', lang)}` : ''}
        </Text>
      }
      ListEmptyComponent={
        <View style={ht.emptyBox}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>📭</Text>
          <Text style={ht.emptyTxt}>ไม่มีออเดอร์ใน 3 วันที่ผ่านมา</Text>
        </View>
      }
      renderItem={({ item }) => {
        const statusColor = orderStatusColor(item.status);
        return (
          <TouchableOpacity
            style={[ht.orderCard, item.status === 'cancelled' && ht.orderCardCancelled]}
            onPress={() => { setSelectedOrder(item); setOrderItems(DB.getOrderItems(item.id)); }}
            activeOpacity={0.87}>
            <View style={[ht.orderAccent, { backgroundColor: statusColor }]} />
            <View style={ht.orderCardHeader}>
              <Text style={ht.orderStatusIcon}>{getStatusIcon(item.status)}</Text>
              <View style={ht.orderCardInfo}>
                <Text style={ht.orderCardNum}>{item.order_number}</Text>
                <Text style={ht.orderCardDate}>{new Date(item.created_at).toLocaleDateString('th-TH')}</Text>
                {item.scheduled_date && (
                  <Text style={ht.orderCardSched}>🚚 {item.scheduled_date}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={ht.orderCardTotal}>฿{item.total.toFixed(0)}</Text>
                <View style={[ht.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={ht.statusBadgeTxt}>{getStatusText(item.status)}</Text>
                </View>
                {item.status === 'pending' && (
                  <TouchableOpacity style={ht.quickCancelBtn}
                    onPress={() => handleCancelOrder(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={ht.quickCancelTxt}>✕ ยกเลิก</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Main Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  navbar: {
    backgroundColor: CHILLI.dark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, ...shadow(3), gap: 8,
  },
  logoRing: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: CHILLI.red,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: CHILLI.orange,
  },
  navTitle: { fontSize: 14, fontWeight: '800', color: CHILLI.white },
  navSub: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 1 },
  typeBadge: {
    backgroundColor: '#ff8c00', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeTxt: { fontSize: 11, color: CHILLI.white, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: 3 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtnOn: { backgroundColor: CHILLI.orange },
  langFlag: { fontSize: 18 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  tabBar: { flexDirection: 'row', backgroundColor: CHILLI.white, ...shadow(1) },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: CHILLI.red },
  tabTxt: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '600', textAlign: 'center' },
  tabTxtActive: { color: CHILLI.red },
});

// ─── Order Tab Styles ─────────────────────────────────────────
const ot = StyleSheet.create({
  wholesaleBar: {
    backgroundColor: '#fff3e0', paddingHorizontal: 14, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#ffe0b0',
  },
  wholesaleBarTxt: { fontSize: 12, color: CHILLI.orange, fontWeight: '700' },
  searchBox: { backgroundColor: CHILLI.white, padding: 10, ...shadow(1) },
  searchInput: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    backgroundColor: CHILLI.cream, color: CHILLI.dark,
  },
  catScroll: { backgroundColor: CHILLI.white, maxHeight: 50 },
  catRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: CHILLI.cream, borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  catBtnActive: { backgroundColor: CHILLI.red, borderColor: CHILLI.red },
  catTxt: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '600' },
  catTxtActive: { color: CHILLI.white },
  listContent: { padding: 10, paddingBottom: 120 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: CHILLI.textSecondary, textAlign: 'center', marginTop: 8 },
  productRow: {
    backgroundColor: CHILLI.white, borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', ...shadow(1),
    borderWidth: 1.5, borderColor: CHILLI.borderLight, overflow: 'hidden',
  },
  productRowActive: { borderColor: CHILLI.red },
  rowAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  productInfo: { flex: 1, marginRight: 10 },
  productNameTh: { fontSize: 14, fontWeight: '700', color: CHILLI.dark },
  productNameSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  productMeta: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  priceBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  priceTxt: { fontSize: 12, fontWeight: '700' },
  stockTxt: { fontSize: 11, color: CHILLI.textSecondary },
  lowStock: { color: CHILLI.orange },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtnMinus: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnTxt: { fontSize: 18, fontWeight: '800', color: CHILLI.dark },
  qtyValBox: { alignItems: 'center', minWidth: 44 },
  qtyVal: { fontSize: 16, fontWeight: '800', color: CHILLI.dark },
  qtyUnit: { fontSize: 10, color: CHILLI.textSecondary },
  // Cart bar
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: CHILLI.red, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, ...shadow(4),
  },
  cartIconWrap: { position: 'relative', marginRight: 12 },
  cartIcon: { fontSize: 30 },
  cartBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: CHILLI.dark, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeTxt: { color: CHILLI.white, fontSize: 11, fontWeight: '800' },
  cartBarInfo: { flex: 1 },
  cartBarTxt: { fontSize: 13, fontWeight: '800', color: CHILLI.white },
  cartBarSub: { fontSize: 11, color: CHILLI.textOnDarkSub, marginTop: 1 },
  cartBarRight: { alignItems: 'flex-end' },
  cartBarTotal: { fontSize: 18, fontWeight: '800', color: CHILLI.white },
  cartBarArrow: { fontSize: 22, color: CHILLI.textOnDarkSub, fontWeight: '900' },
});

// ─── Cart Modal Styles ────────────────────────────────────────
const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: CHILLI.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '95%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: CHILLI.borderLight, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: CHILLI.dark },
  titleSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: CHILLI.cream, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 16, color: CHILLI.textSecondary, fontWeight: '700' },
  lbl: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
    color: CHILLI.dark, marginBottom: 4, backgroundColor: CHILLI.cream,
  },
  suggestBox: {
    backgroundColor: CHILLI.white, borderWidth: 1.5, borderColor: CHILLI.orange,
    borderRadius: 10, marginTop: 2, marginBottom: 4,
  },
  suggestItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  suggestTxt: { fontSize: 14, color: CHILLI.orange, fontWeight: '700' },
  datePicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff8f0', borderRadius: 10,
    borderWidth: 1.5, borderColor: CHILLI.red, marginBottom: 4, overflow: 'hidden',
  },
  dateArrowBtn: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: CHILLI.red },
  dateArrowTxt: { fontSize: 16, color: CHILLI.white, fontWeight: '700' },
  dateDisplay: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dateTxt: { fontSize: 14, fontWeight: '700', color: CHILLI.red },
  dateSubTxt: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 2 },
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  payBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: CHILLI.borderLight, backgroundColor: CHILLI.cream,
  },
  payBtnActive: { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  payBtnIcon: { fontSize: 20 },
  payBtnTxt: { fontSize: 11, color: CHILLI.textSecondary, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  payBtnSub: { fontSize: 10, color: CHILLI.textSecondary, marginTop: 1, textAlign: 'center' },
  payBtnTxtActive: { color: CHILLI.red },
  cartItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5',
    overflow: 'hidden',
  },
  cartAccent: { width: 3, alignSelf: 'stretch', marginRight: 8 },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: '700', color: CHILLI.dark },
  cartNameSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  cartDetail: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  itemNoteInput: {
    borderWidth: 1, borderColor: CHILLI.borderLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 5, fontSize: 12,
    marginTop: 4, color: CHILLI.textSecondary,
  },
  cartDel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 2,
  },
  cartDelTxt: { color: CHILLI.red, fontSize: 14, fontWeight: '800' },
  totalBox: {
    backgroundColor: CHILLI.cream, borderRadius: 12, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLbl: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
  totalVal: { fontSize: 15, fontWeight: '700', color: CHILLI.red },
  noteWarning: { fontSize: 11, color: CHILLI.orange, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnGrey: { backgroundColor: CHILLI.cream, borderWidth: 1, borderColor: CHILLI.borderLight },
  btnConfirm: { backgroundColor: CHILLI.red, flex: 2, ...shadow(2) },
  btnGreyTxt: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
  btnConfirmTxt: { fontSize: 14, color: CHILLI.white, fontWeight: '800' },
});

// ─── History Styles ───────────────────────────────────────────
const ht = StyleSheet.create({
  histTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.dark, marginBottom: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: CHILLI.textSecondary, textAlign: 'center', marginTop: 8 },
  backBtn: { paddingVertical: 8, marginBottom: 8 },
  backBtnTxt: { fontSize: 14, color: CHILLI.red, fontWeight: '700' },
  // Order card
  orderCard: {
    backgroundColor: CHILLI.white, borderRadius: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', ...shadow(2),
  },
  orderCardCancelled: { opacity: 0.55 },
  orderAccent: { width: 5 },
  orderCardHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 },
  orderStatusIcon: { fontSize: 24, marginRight: 10 },
  orderCardInfo: { flex: 1 },
  orderCardNum: { fontSize: 11, color: CHILLI.textSecondary, fontFamily: 'monospace' },
  orderCardDate: { fontSize: 13, fontWeight: '700', color: CHILLI.dark, marginTop: 2 },
  orderCardSched: { fontSize: 11, color: CHILLI.orange, marginTop: 1, fontWeight: '600' },
  orderCardTotal: { fontSize: 16, fontWeight: '800', color: CHILLI.red, textAlign: 'right' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusBadgeTxt: { color: CHILLI.white, fontSize: 10, fontWeight: '700' },
  quickCancelBtn: {
    marginTop: 5, backgroundColor: '#fee2e2', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  quickCancelTxt: { fontSize: 10, color: CHILLI.red, fontWeight: '800' },
  // Detail view
  detailCard: {
    backgroundColor: CHILLI.white, borderRadius: 14, padding: 14, marginBottom: 12,
    ...shadow(2), borderTopWidth: 4,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  statusCircleIcon: { fontSize: 20 },
  detailNum: { fontSize: 13, color: CHILLI.textSecondary, fontFamily: 'monospace' },
  detailStatus: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  detailInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderTopWidth: 1, borderColor: '#f5f5f5',
  },
  detailLabel: { fontSize: 13, color: CHILLI.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '700', color: CHILLI.dark },
  itemCard: {
    backgroundColor: CHILLI.white, borderRadius: 10, padding: 12, marginBottom: 6, ...shadow(1),
  },
  itemName: { fontSize: 14, fontWeight: '700', color: CHILLI.dark },
  itemSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  itemDetail: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 3 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: CHILLI.red, marginTop: 4 },
  totalBox: {
    backgroundColor: CHILLI.cream, borderRadius: 12, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLbl: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
  totalVal: { fontSize: 18, fontWeight: '800', color: CHILLI.red },
  noteWarning: { fontSize: 11, color: CHILLI.orange, marginTop: 4, fontWeight: '600' },
  cancelBtn: {
    marginTop: 16, backgroundColor: '#fee2e2', borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: CHILLI.red, alignItems: 'center', ...shadow(1),
  },
  cancelBtnTxt: { fontSize: 15, fontWeight: '800', color: CHILLI.red },
  cancelBtnSub: { fontSize: 11, color: CHILLI.red, marginTop: 4, opacity: 0.7 },
});
