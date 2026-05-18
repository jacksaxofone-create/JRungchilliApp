import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, SafeAreaView, StatusBar, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";

type PayMethod = 'credit' | 'transfer' | 'cash';
type TabType = 'order' | 'history';

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '🇹🇭' },
  { code: 'mm', flag: '🇲🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'cn', flag: '🇨🇳' },
];

const CATEGORIES = ['ทั้งหมด', 'พริก', 'ผัก', 'เครื่องเทศ', 'อื่นๆ'];

export default function CustomerDashboardScreen() {
  const { lang, setLang, logout, currentCustomer } = useAppStore();
  const [tab, setTab] = useState<TabType>('order');

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />
      {/* Navbar */}
      <View style={s.navbar}>
        <View style={s.navLeft}>
          <Text style={s.navTitle}>🛒 {currentCustomer?.shop_name || 'ลูกค้า'}</Text>
          {lang !== 'th' && <Text style={s.navSub}>{t('role_order', lang)}</Text>}
        </View>
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
          Alert.alert('ออกจากระบบ', 'ต้องการออก?', [
            { text: t('cancel','th'), style: 'cancel' },
            { text: t('confirm','th'), onPress: logout },
          ])}>
          <Text style={s.logoutTxt}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Credit Banner */}
      {currentCustomer && (
        <CreditBanner customer={currentCustomer} lang={lang} />
      )}

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, tab === 'order' && s.tabBtnActive]} onPress={() => setTab('order')}>
          <Text style={[s.tabTxt, tab === 'order' && s.tabTxtActive]}>
            🛒 สั่งสินค้า{lang !== 'th' ? `\n${t('role_order', lang)}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'history' && s.tabBtnActive]} onPress={() => setTab('history')}>
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
  const color = pct >= 100 ? '#c0392b' : pct >= 80 ? '#e67e22' : '#27ae60';

  return (
    <View style={cb.container}>
      <View style={cb.row}>
        <View>
          <Text style={cb.label}>💳 วงเงินเครดิต{lang !== 'th' ? ` / ${t('credit', lang)}` : ''}</Text>
          <Text style={cb.used}>ใช้: ฿{creditUsed.toLocaleString()} / ฿{customer.credit_limit.toLocaleString()}</Text>
        </View>
        <Text style={[cb.left, { color }]}>คงเหลือ ฿{creditLeft.toLocaleString()}</Text>
      </View>
      <View style={cb.barBg}>
        <View style={[cb.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      {pct >= 80 && (
        <Text style={[cb.warning, { color }]}>
          {pct >= 100 ? '🔴 วงเงินเต็ม — ต้องโอนก่อนสั่ง' : '🟡 วงเงินใกล้เต็ม'}
        </Text>
      )}
    </View>
  );
}
const cb = StyleSheet.create({
  container: { backgroundColor: '#1a252f', paddingHorizontal: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  used: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  left: { fontSize: 14, fontWeight: 'bold' },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  warning: { fontSize: 11, fontWeight: '600', marginTop: 6 },
});

// ─── Order Tab ───────────────────────────────────────────────
function OrderTab({ lang, customer, lbl }: { lang: Lang; customer: any; lbl: (k: string) => string }) {
  const [products, setProducts]       = useState<any[]>([]);
  const [cart, setCart]               = useState<Record<string, number>>({});
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('ทั้งหมด');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showCart, setShowCart]       = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [payMethod, setPayMethod]     = useState<PayMethod>('credit');
  const [orderNotes, setOrderNotes]   = useState('');
  const [itemNotes, setItemNotes]     = useState<Record<string, string>>({});
  // sub-customer (ชื่อลูกค้าของผู้ค้าส่ง)
  const [subCustomerName, setSubCustomerName]       = useState('');
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

  const cartItems = products.filter(p => (cart[p.id] || 0) > 0);

  // sub-customer search autocomplete
  const onSubCustomerChange = (text: string) => {
    setSubCustomerName(text);
    if (text.length >= 1 && customer?.id) {
      const results = DB.searchSubCustomers(customer.id, text);
      setSubCustomerSuggests(results.filter(r => r !== text));
    } else {
      setSubCustomerSuggests([]);
    }
  };
  const cartTotal = cartItems.reduce((s, p) => s + (cart[p.id] || 0) * getPrice(p), 0);
  const cartWeight = cartItems.reduce((s, p) => s + (cart[p.id] || 0), 0);
  const cartCount = cartItems.length;

  const addQty = (id: string, delta: number) => {
    setCart(prev => {
      const cur = prev[id] || 0;
      const next = Math.round((cur + delta) * 10) / 10;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleOrder = () => {
    if (cartCount === 0) { Alert.alert(t('warning','th'), lbl('no_items')); return; }
    if (!scheduledDate) { Alert.alert(t('warning','th'), 'กรุณาเลือกวันที่ต้องการรับสินค้า'); return; }

    // Credit check
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

      // บันทึกชื่อ sub-customer ลงฐานข้อมูลเพื่อ autocomplete ครั้งต่อไป
      if (subCustomerName.trim() && customer?.id) {
        DB.saveSubCustomer(customer.id, subCustomerName.trim());
      }

      setCart({});
      setShowCart(false);
      setOrderNotes('');
      setItemNotes({});
      setSubCustomerName('');
      setSubCustomerSuggests([]);

      Alert.alert(
        '✅ ' + t('success','th'),
        `${t('confirm_order','th')}${lang !== 'th' ? '\n' + t('confirm_order', lang) : ''}\n\n` +
        `เลขออเดอร์: ${id}\n` +
        (subCustomerName.trim() ? `ส่งให้: ${subCustomerName.trim()}\n` : '') +
        `วันที่รับสินค้า: ${scheduledDate}\n` +
        `ยอดโดยประมาณ: ฿${cartTotal.toFixed(2)}\n\n` +
        `⚠️ ยอดสุดท้ายอาจต่างจากที่สั่ง เมื่อชั่งน้ำหนักจริง`
      );
    } catch (e: any) {
      Alert.alert('❌ ' + t('error','th'), String(e?.message || e));
    } finally {
      setSaving(false);
    }
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
      {/* Search */}
      <View style={s.searchBox}>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder={`🔍 ${lbl('search')}...`} placeholderTextColor="#9ca3af" />
      </View>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat}
            style={[s.catBtn, category === cat && s.catBtnActive]}
            onPress={() => setCategory(cat)}>
            <Text style={[s.catTxt, category === cat && s.catTxtActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator color="#27ae60" size="large" style={{ marginTop: 32 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48, textAlign: 'center' }}>📦</Text>
              <Text style={s.emptyTxt}>{lbl('no_products')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const qty = cart[item.id] || 0;
            const price = getPrice(item);
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            return (
              <View style={[s.productRow, qty > 0 && s.productRowActive]}>
                <View style={s.productInfo}>
                  <Text style={s.productNameTh}>{item.name_th}</Text>
                  {!!secondary && <Text style={s.productNameSub}>{secondary}</Text>}
                  <View style={s.productMeta}>
                    <Text style={s.productPrice}>
                      ฿{price}/กก. {isWholesale ? '📦ส่ง' : '🛒ปลีก'}
                    </Text>
                    <Text style={[s.productStock, item.stock_kg < 5 && s.lowStock]}>
                      {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                    </Text>
                  </View>
                </View>
                <View style={s.qtyRow}>
                  <TouchableOpacity style={[s.qtyBtn, s.qtyBtnMinus]}
                    onPress={() => addQty(item.id, -0.5)} disabled={qty <= 0}>
                    <Text style={s.qtyBtnTxt}>－</Text>
                  </TouchableOpacity>
                  <View style={s.qtyValBox}>
                    <Text style={s.qtyVal}>{qty > 0 ? qty.toFixed(1) : '0'}</Text>
                    <Text style={s.qtyUnit}>kg</Text>
                  </View>
                  <TouchableOpacity style={[s.qtyBtn, s.qtyBtnPlus]}
                    onPress={() => addQty(item.id, 0.5)}>
                    <Text style={s.qtyBtnTxt}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity style={s.cartBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={s.cartIconWrap}>
            <Text style={s.cartIcon}>🛒</Text>
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeTxt}>{cartCount}</Text>
            </View>
          </View>
          <View style={s.cartBarInfo}>
            <Text style={s.cartBarTxt}>{lbl('bill_items')}</Text>
            <Text style={s.cartBarSub}>{cartWeight.toFixed(1)} kg · {cartCount} รายการ</Text>
          </View>
          <View style={s.cartBarRight}>
            <Text style={s.cartBarTotal}>฿{cartTotal.toFixed(0)}</Text>
            <Text style={s.cartBarArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} transparent animationType="slide">
        <View style={mo.overlay}>
          <View style={mo.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={mo.header}>
                <View>
                  <Text style={mo.title}>🛒 {lbl('bill_items')}</Text>
                  <Text style={mo.titleSub}>{customer?.shop_name} · ยอดโดยประมาณ</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Text style={mo.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ชื่อลูกค้าของร้านผู้ค้าส่ง — sub-customer autocomplete */}
              {customer?.customer_type === 'wholesale' && (
                <>
                  <Text style={mo.lbl}>👤 ส่งสินค้าให้ใคร (ลูกค้าของร้านท่าน){lang !== 'th' ? ' / End Customer' : ''}</Text>
                  <TextInput
                    style={mo.input}
                    value={subCustomerName}
                    onChangeText={onSubCustomerChange}
                    placeholder="พิมชื่อลูกค้า 1 ตัว ระบบแนะนำให้..."
                    placeholderTextColor="#9ca3af"
                  />
                  {subCustomerSuggests.length > 0 && (
                    <View style={mo.subSuggestBox}>
                      {subCustomerSuggests.map(name => (
                        <TouchableOpacity
                          key={name}
                          style={mo.subSuggestItem}
                          onPress={() => { setSubCustomerName(name); setSubCustomerSuggests([]); }}
                        >
                          <Text style={mo.subSuggestTxt}>👤 {name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* วันที่รับสินค้า — DatePicker แบบ native ไม่ต้องใช้ library */}
              <Text style={mo.lbl}>📅 วันที่ต้องการรับสินค้า{lang !== 'th' ? ' / Delivery Date' : ''}</Text>
              <View style={mo.datePicker}>
                <TouchableOpacity
                  style={mo.dateArrowBtn}
                  onPress={() => {
                    const d = new Date(scheduledDate);
                    d.setDate(d.getDate() - 1);
                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                    if (d >= tomorrow) setScheduledDate(d.toISOString().split('T')[0]);
                    else Alert.alert('⚠️', 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้\nกรุณาเลือกวันพรุ่งนี้ขึ้นไป');
                  }}
                >
                  <Text style={mo.dateArrowTxt}>◀</Text>
                </TouchableOpacity>
                <View style={mo.dateDisplay}>
                  <Text style={mo.dateTxt}>
                    {new Date(scheduledDate).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={mo.dateSubTxt}>
                    {(() => {
                      const today = new Date(); today.setHours(0,0,0,0);
                      const sel = new Date(scheduledDate); sel.setHours(0,0,0,0);
                      const diff = Math.round((sel.getTime() - today.getTime()) / 86400000);
                      if (diff === 1) return '(พรุ่งนี้)';
                      if (diff === 2) return '(มะรืนนี้)';
                      return `(อีก ${diff} วัน)`;
                    })()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={mo.dateArrowBtn}
                  onPress={() => {
                    const d = new Date(scheduledDate);
                    d.setDate(d.getDate() + 1);
                    setScheduledDate(d.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={mo.dateArrowTxt}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* วิธีชำระ */}
              <Text style={mo.lbl}>💳 {lbl('confirm_pay')}</Text>
              <View style={mo.payRow}>
                {(['credit','transfer','cash'] as PayMethod[]).map(pm => (
                  <TouchableOpacity key={pm}
                    style={[mo.payBtn, payMethod === pm && mo.payBtnActive]}
                    onPress={() => setPayMethod(pm)}>
                    <Text style={mo.payBtnIcon}>{pm === 'cash' ? '💵' : pm === 'transfer' ? '🏦' : '💳'}</Text>
                    <Text style={[mo.payBtnTxt, payMethod === pm && mo.payBtnTxtActive]}>
                      {t(pm,'th')}
                    </Text>
                    {lang !== 'th' && (
                      <Text style={[mo.payBtnSub, payMethod === pm && mo.payBtnTxtActive]}>
                        {t(pm, lang)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* รายการสินค้า */}
              <Text style={mo.lbl}>📋 รายการสินค้า</Text>
              {cartItems.map(item => {
                const qty = cart[item.id] || 0;
                const price = getPrice(item);
                const secondary = lang !== 'th' ? getProductName(item, lang) : '';
                return (
                  <View key={item.id} style={mo.cartItem}>
                    <View style={mo.cartInfo}>
                      <Text style={mo.cartNameTh}>{item.name_th}</Text>
                      {!!secondary && <Text style={mo.cartNameSub}>{secondary}</Text>}
                      <Text style={mo.cartDetail}>
                        {qty.toFixed(1)} kg × ฿{price} = ฿{(qty * price).toFixed(2)}
                      </Text>
                      <TextInput style={mo.itemNoteInput}
                        value={itemNotes[item.id] || ''}
                        onChangeText={v => setItemNotes(prev => ({ ...prev, [item.id]: v }))}
                        placeholder="หมายเหตุ (เช่น ขอเขียวล้วน)"
                        placeholderTextColor="#bbb"
                      />
                    </View>
                    <TouchableOpacity style={mo.cartDel}
                      onPress={() => setCart(prev => { const {[item.id]: _, ...rest} = prev; return rest; })}>
                      <Text style={mo.cartDelTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* หมายเหตุ */}
              <Text style={mo.lbl}>📝 {lbl('notes')}</Text>
              <TextInput style={mo.input} value={orderNotes} onChangeText={setOrderNotes}
                placeholder="หมายเหตุออเดอร์ (ไม่บังคับ)" placeholderTextColor="#9ca3af"
                multiline numberOfLines={2} />

              {/* สรุป */}
              <View style={mo.totalBox}>
                <View style={mo.totalRow}>
                  <Text style={mo.totalLbl}>{lbl('total')}</Text>
                  <Text style={mo.totalVal}>฿{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={mo.totalRow}>
                  <Text style={mo.totalLbl}>น้ำหนักรวม</Text>
                  <Text style={mo.totalVal}>{cartWeight.toFixed(1)} kg</Text>
                </View>
                <Text style={mo.noteWarning}>
                  ⚠️ ยอดโดยประมาณ — ยอดจริงคิดหลังชั่งน้ำหนัก
                </Text>
              </View>

              <View style={mo.btnRow}>
                <TouchableOpacity style={[mo.btn, mo.btnGrey]} onPress={() => setShowCart(false)}>
                  <Text style={mo.btnGreyTxt}>{t('cancel','th')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[mo.btn, mo.btnGreen, saving && { opacity: 0.6 }]}
                  onPress={handleOrder} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> :
                    <Text style={mo.btnGreenTxt}>✅ {lbl('confirm_order')}</Text>}
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
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOrders = useCallback(() => {
    setLoading(true);
    try {
      const list = customer?.id
        ? DB.getOrdersByCustomerId(customer.id)
        : DB.getOrdersByCustomer(customer?.shop_name || '');
      // Only show last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      setOrders(list.filter((o: any) => new Date(o.created_at) >= threeDaysAgo));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [refreshKey]);

  useFocusEffect(loadOrders);

  // ยกเลิกออเดอร์ที่สถานะ pending เท่านั้น
  const handleCancelOrder = (order: any) => {
    Alert.alert(
      '❌ ยกเลิกออเดอร์',
      `ยืนยันยกเลิกออเดอร์ ${order.order_number} ?\n\nออเดอร์จะถูกยกเลิกทันที`,
      [
        { text: 'ไม่ยกเลิก', style: 'cancel' },
        {
          text: '✅ ยืนยันยกเลิก',
          style: 'destructive',
          onPress: () => {
            try {
              DB.updateOrderStatus(order.id, 'cancelled');
              Alert.alert('✅', `ยกเลิกออเดอร์ ${order.order_number} แล้ว`);
              if (selectedOrder?.id === order.id) setSelectedOrder(null);
              setRefreshKey(k => k + 1);
            } catch (e) {
              Alert.alert('❌', 'ยกเลิกไม่สำเร็จ กรุณาลองใหม่');
            }
          }
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '🟡';
      case 'confirmed': return '🔵';
      case 'packing': return '🟠';
      case 'delivered': return '🟢';
      case 'cancelled': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอยืนยัน';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'packing': return 'กำลังแพค';
      case 'delivered': return 'ส่งแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  if (selectedOrder) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
        <TouchableOpacity style={h.backBtn} onPress={() => setSelectedOrder(null)}>
          <Text style={h.backBtnTxt}>← {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={h.orderDetail}>
          <Text style={h.detailTitle}>📋 {selectedOrder.order_number}</Text>
          <Text style={h.detailRow}>📅 วันที่สั่ง: {new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}</Text>
          {selectedOrder.scheduled_date ? (
            <Text style={h.detailRow}>🚚 กำหนดส่ง: {selectedOrder.scheduled_date}</Text>
          ) : null}
          <Text style={h.detailRow}>สถานะ: {getStatusIcon(selectedOrder.status)} {getStatusText(selectedOrder.status)}</Text>
          <Text style={h.detailRow}>💳 ชำระ: {t(selectedOrder.payment_method, 'th')}</Text>
        </View>
        {orderItems.map(item => {
          const secondary = lang !== 'th' ? getProductName(item, lang) : '';
          const displayKg = item.actual_weight_kg > 0 ? item.actual_weight_kg : item.quantity_kg;
          return (
            <View key={item.id} style={h.itemCard}>
              <Text style={h.itemName}>{item.product_name_th}</Text>
              {!!secondary && <Text style={h.itemSub}>{secondary}</Text>}
              <Text style={h.itemDetail}>สั่ง: {item.quantity_kg} kg</Text>
              {item.actual_weight_kg > 0 && (
                <Text style={[h.itemDetail, { color: '#27ae60' }]}>ชั่งจริง: {item.actual_weight_kg} kg</Text>
              )}
              <Text style={h.itemPrice}>฿{(displayKg * item.unit_price).toFixed(2)}</Text>
            </View>
          );
        })}
        <View style={h.totalBox}>
          <Text style={h.totalTxt}>ยอดรวม (โดยประมาณ): ฿{selectedOrder.total.toFixed(2)}</Text>
          <Text style={h.noteWarning}>⚠️ ยอดสุดท้ายคิดหลังชั่งน้ำหนักจริง</Text>
        </View>
        {/* ปุ่มยกเลิก เฉพาะ pending เท่านั้น */}
        {selectedOrder.status === 'pending' && (
          <TouchableOpacity
            style={h.cancelOrderBtn}
            onPress={() => handleCancelOrder(selectedOrder)}
            activeOpacity={0.8}
          >
            <Text style={h.cancelOrderBtnTxt}>
              ❌ ยกเลิกออเดอร์นี้{lang !== 'th' ? ' / Cancel Order' : ''}
            </Text>
            <Text style={h.cancelOrderBtnSub}>ยกเลิกได้เฉพาะ "รอยืนยัน" เท่านั้น</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  if (loading) return <ActivityIndicator color="#27ae60" size="large" style={{ marginTop: 32 }} />;

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
      ListHeaderComponent={
        <Text style={h.histTitle}>ประวัติออเดอร์ (3 วัน){lang !== 'th' ? `\n${t('orders', lang)}` : ''}</Text>
      }
      ListEmptyComponent={
        <View style={s.emptyBox}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>📭</Text>
          <Text style={s.emptyTxt}>ไม่มีออเดอร์ใน 3 วันที่ผ่านมา</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={[h.orderCard, item.status === 'cancelled' && h.orderCardCancelled]} onPress={() => {
          setSelectedOrder(item);
          setOrderItems(DB.getOrderItems(item.id));
        }}>
          <View style={h.orderCardHeader}>
            <Text style={h.orderStatusIcon}>{getStatusIcon(item.status)}</Text>
            <View style={h.orderCardInfo}>
              <Text style={h.orderCardNum}>{item.order_number}</Text>
              <Text style={h.orderCardDate}>{new Date(item.created_at).toLocaleDateString('th-TH')}</Text>
              {item.scheduled_date ? (
                <Text style={h.orderCardSched}>🚚 {item.scheduled_date}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={h.orderCardTotal}>฿{item.total.toFixed(0)}</Text>
              <Text style={[h.orderCardStatus, { color: item.status === 'delivered' ? '#27ae60' : item.status === 'cancelled' ? '#c0392b' : '#e67e22' }]}>
                {getStatusText(item.status)}
              </Text>
              {/* Quick cancel button on card — เฉพาะ pending */}
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={h.quickCancelBtn}
                  onPress={() => handleCancelOrder(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={h.quickCancelTxt}>✕ ยกเลิก</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: { backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, elevation: 4, gap: 8 },
  navLeft: { flex: 1 },
  navTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  navSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnOn: { backgroundColor: '#fff' },
  langFlag: { fontSize: 18 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  logoutTxt: { fontSize: 18 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#27ae60' },
  tabTxt: { fontSize: 12, color: '#888', fontWeight: '600', textAlign: 'center' },
  tabTxtActive: { color: '#27ae60' },
  searchBox: { backgroundColor: '#fff', padding: 10, elevation: 1 },
  searchInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa' },
  catScroll: { backgroundColor: '#fff', maxHeight: 50 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#f0f0f0' },
  catBtnActive: { backgroundColor: '#27ae60' },
  catTxt: { fontSize: 12, color: '#555', fontWeight: '600' },
  catTxtActive: { color: '#fff' },
  listContent: { padding: 10, paddingBottom: 120 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: '#aaa', textAlign: 'center', marginTop: 8 },
  productRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, borderWidth: 1.5, borderColor: '#e0e0e0' },
  productRowActive: { borderColor: '#27ae60', backgroundColor: '#f0faf5' },
  productInfo: { flex: 1, marginRight: 10 },
  productNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  productNameSub: { fontSize: 12, color: '#888', marginTop: 2 },
  productMeta: { flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'center' },
  productPrice: { fontSize: 12, color: '#27ae60', fontWeight: '700' },
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

const mo = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '95%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  titleSub: { fontSize: 12, color: '#888', marginTop: 2 },
  closeBtn: { fontSize: 20, color: '#aaa', fontWeight: 'bold', padding: 4 },
  lbl: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#222', marginBottom: 4 },
  // DatePicker styles
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0faf5', borderRadius: 10, borderWidth: 1.5, borderColor: '#27ae60', marginBottom: 4, overflow: 'hidden' },
  dateArrowBtn: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#27ae60' },
  dateArrowTxt: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  dateDisplay: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dateTxt: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  dateSubTxt: { fontSize: 11, color: '#888', marginTop: 2 },
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  payBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  payBtnActive: { borderColor: '#27ae60', backgroundColor: '#f0faf0' },
  payBtnIcon: { fontSize: 20 },
  payBtnTxt: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  payBtnSub: { fontSize: 10, color: '#888', marginTop: 1, textAlign: 'center' },
  payBtnTxtActive: { color: '#27ae60' },
  cartItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cartNameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  cartDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  itemNoteInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12, marginTop: 4, color: '#555' },
  cartDel: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 2 },
  cartDelTxt: { color: '#c0392b', fontSize: 14, fontWeight: 'bold' },
  totalBox: { backgroundColor: '#f0faf5', borderRadius: 10, padding: 14, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLbl: { fontSize: 14, color: '#555', fontWeight: '600' },
  totalVal: { fontSize: 15, fontWeight: 'bold', color: '#27ae60' },
  noteWarning: { fontSize: 11, color: '#e67e22', marginTop: 8, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  // Sub-customer autocomplete
  subSuggestBox: { backgroundColor: '#f0faf5', borderWidth: 1.5, borderColor: '#27ae60', borderRadius: 8, marginTop: -2, marginBottom: 4 },
  subSuggestItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  subSuggestTxt: { fontSize: 14, color: '#27ae60', fontWeight: '600' },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnGrey: { backgroundColor: '#f0f0f0' },
  btnGreen: { backgroundColor: '#27ae60', flex: 2 },
  btnGreyTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
  btnGreenTxt: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});

const h = StyleSheet.create({
  histTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  backBtn: { paddingVertical: 8, marginBottom: 8 },
  backBtnTxt: { fontSize: 14, color: '#27ae60', fontWeight: '600' },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  orderCardCancelled: { opacity: 0.6, borderLeftWidth: 3, borderLeftColor: '#c0392b' },
  orderCardHeader: { flexDirection: 'row', alignItems: 'center' },
  orderStatusIcon: { fontSize: 24, marginRight: 12 },
  orderCardInfo: { flex: 1 },
  orderCardNum: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  orderCardDate: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 2 },
  orderCardSched: { fontSize: 11, color: '#2980b9', marginTop: 1 },
  orderCardTotal: { fontSize: 16, fontWeight: 'bold', color: '#c0392b', textAlign: 'right' },
  orderCardStatus: { fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  quickCancelBtn: { marginTop: 5, backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  quickCancelTxt: { fontSize: 10, color: '#c0392b', fontWeight: '700' },
  orderDetail: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  detailTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  detailRow: { fontSize: 13, color: '#555', marginBottom: 4 },
  itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, elevation: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  itemSub: { fontSize: 11, color: '#888', marginTop: 1 },
  itemDetail: { fontSize: 12, color: '#888', marginTop: 3 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#27ae60', marginTop: 4 },
  totalBox: { backgroundColor: '#f0faf5', borderRadius: 10, padding: 14, marginTop: 8 },
  totalTxt: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  noteWarning: { fontSize: 11, color: '#e67e22', marginTop: 4 },
  cancelOrderBtn: { marginTop: 16, backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: '#e74c3c', alignItems: 'center' },
  cancelOrderBtnTxt: { fontSize: 15, fontWeight: 'bold', color: '#c0392b' },
  cancelOrderBtnSub: { fontSize: 11, color: '#e74c3c', marginTop: 4 },
});
