import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, SafeAreaView, StatusBar, Modal, ScrollView,
  ActivityIndicator, StyleSheet, Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";

type PayMethod = 'cash' | 'transfer' | 'credit';
type Mode = 'home' | 'walkin' | 'packorders';
type PackStatus = 'waiting' | 'packing' | 'packed';

interface CartItem {
  product: any;
  quantity_kg: number;
  unit_price: number;
  price_type: 'retail' | 'wholesale';
}

const QUICK_CASH = [20, 50, 100, 200, 500, 1000];
const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '🇹🇭' },
  { code: 'mm', flag: '🇲🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'cn', flag: '🇨🇳' },
];

function ProductName({ product, lang }: { product: any; lang: Lang }) {
  const secondary = lang !== 'th' ? getProductName(product, lang) : '';
  return (
    <View>
      <Text style={pn.primary} numberOfLines={2}>{product.name_th || '-'}</Text>
      {!!secondary && <Text style={pn.secondary} numberOfLines={1}>{secondary}</Text>}
    </View>
  );
}
const pn = StyleSheet.create({
  primary:   { fontSize: 13, fontWeight: 'bold', color: '#333' },
  secondary: { fontSize: 11, color: '#888', marginTop: 1 },
});

// ─── PIN Modal for Cashier ───────────────────────────────────
function CashierPinModal({ visible, lang, onClose, onSuccess }: {
  visible: boolean; lang: Lang; onClose: () => void; onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (val: string) => {
    if (pin.length >= 6) return;
    const next = pin + val;
    setPin(next);
    if (next.length >= 4) {
      try {
        const stored = DB.rotateCashierPinIfNeeded();
        if (next === stored) {
          setPin('');
          onSuccess();
        } else {
          shake();
          setTimeout(() => setPin(''), 700);
          Alert.alert(
            t('warning', 'th'),
            t('wrong_pin', 'th') + (lang !== 'th' ? `\n${t('wrong_pin', lang)}` : '')
          );
        }
      } catch {
        shake();
        setTimeout(() => setPin(''), 700);
      }
    }
  };

  if (!visible) return null;
  return (
    <View style={pm.overlay}>
      <Animated.View style={[pm.box, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={pm.title}>🔐 {t('cashier_pin', 'th')}</Text>
        {lang !== 'th' && <Text style={pm.titleSub}>{t('cashier_pin', lang)}</Text>}
        <View style={pm.dots}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[pm.dot, pin.length > i && pm.dotFill]} />
          ))}
        </View>
        <View style={pm.grid}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity key={i}
              style={[pm.key, k === '' && pm.keyEmpty]}
              onPress={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : k !== '' ? handlePress(k) : null}
              disabled={k === ''}
            >
              <Text style={pm.keyTxt}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={pm.cancelBtn} onPress={() => { setPin(''); onClose(); }}>
          <Text style={pm.cancelTxt}>{t('cancel','th')}{lang !== 'th' ? ` / ${t('cancel',lang)}` : ''}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const pm = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  box: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center', elevation: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#c0392b', textAlign: 'center' },
  titleSub: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 14, marginVertical: 20 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#c0392b', backgroundColor: '#fff' },
  dotFill: { backgroundColor: '#c0392b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 10, justifyContent: 'center', marginBottom: 16 },
  key: { width: 68, height: 56, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  keyEmpty: { backgroundColor: 'transparent', elevation: 0 },
  keyTxt: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#f0f0f0', marginTop: 4 },
  cancelTxt: { fontSize: 14, color: '#666', fontWeight: '600' },
});

// ─── Main CashierScreen ──────────────────────────────────────
export default function CashierScreen({ navigation }: any) {
  const { lang, setLang, logout, settings } = useAppStore();
  const [mode, setMode] = useState<Mode>('home');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(true);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  // ─── PIN gate ───
  if (!pinUnlocked) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar backgroundColor="#c0392b" barStyle="light-content" />
        <CashierPinModal
          visible={true}
          lang={lang}
          onClose={() => { logout(); }}
          onSuccess={() => setPinUnlocked(true)}
        />
        <View style={s.pinBg}>
          <Text style={s.pinBgIcon}>⚖️</Text>
          <Text style={s.pinBgTxt}>{t('cashier_pin','th')}</Text>
          {lang !== 'th' && <Text style={s.pinBgSub}>{t('cashier_pin', lang)}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Home Mode ───
  if (mode === 'home') {
    return <CashierHome lang={lang} setLang={setLang} logout={logout} settings={settings}
      onWalkin={() => setMode('walkin')}
      onPackOrders={() => setMode('packorders')}
      lbl={lbl} />;
  }

  if (mode === 'walkin') {
    return <WalkinSale lang={lang} setLang={setLang} settings={settings}
      onBack={() => setMode('home')} />;
  }

  return <PackOrdersMode lang={lang} setLang={setLang} settings={settings}
    onBack={() => setMode('home')} />;
}

// ─── Cashier Home ────────────────────────────────────────────
function CashierHome({ lang, setLang, logout, settings, onWalkin, onPackOrders, lbl }: any) {
  const [pendingCount, setPendingCount] = React.useState(0);
  useFocusEffect(useCallback(() => {
    try {
      setPendingCount(DB.getPendingPackOrders().length);
    } catch {}
  }, []));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />
      <View style={s.navbar}>
        <Text style={s.navTitle}>⚖️ {t('role_stock','th')}</Text>
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
      <View style={s.homeContent}>
        <Text style={s.shopName}>🌶️ {settings?.shop_name || 'J.Rung Chilli'}</Text>
        <Text style={s.shopSub}>เลือกโหมดการทำงาน{lang !== 'th' ? ` / ${t('select_mode', lang)}` : ''}</Text>

        <TouchableOpacity style={s.modeCard} onPress={onWalkin} activeOpacity={0.85}>
          <Text style={s.modeIcon}>🛒</Text>
          <View style={s.modeInfo}>
            <Text style={s.modeTitleTh}>ขายหน้าร้าน</Text>
            {lang !== 'th' && <Text style={s.modeTitleSub}>{t('walkin_mode', lang)}</Text>}
            <Text style={s.modeDesc}>Walk-in Sale — ชั่งสินค้า คิดเงิน</Text>
          </View>
          <Text style={s.modeArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.modeCard, { borderLeftColor: '#2980b9' }]} onPress={onPackOrders} activeOpacity={0.85}>
          <Text style={s.modeIcon}>📦</Text>
          <View style={s.modeInfo}>
            <Text style={s.modeTitleTh}>แพคออเดอร์</Text>
            {lang !== 'th' && <Text style={s.modeTitleSub}>{t('pack_mode', lang)}</Text>}
            <Text style={s.modeDesc}>Pre-order Packing</Text>
          </View>
          {pendingCount > 0 && (
            <View style={s.modeBadge}>
              <Text style={s.modeBadgeTxt}>{pendingCount}</Text>
            </View>
          )}
          <Text style={s.modeArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Walk-in Sale Mode ───────────────────────────────────────
function WalkinSale({ lang, setLang, settings, onBack }: any) {
  const [products, setProducts]       = useState<any[]>([]);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [processing, setProcessing]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [manualWeight, setManualWeight] = useState('');
  const [priceType, setPriceType]     = useState<'retail' | 'wholesale'>('retail');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod]     = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes]             = useState('');
  const [discount, setDiscount]       = useState('0');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    try { setProducts(DB.getAllProducts().filter((p: any) => p.is_active === 1)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []));

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const activeWeight = parseFloat(manualWeight) || 0;
  const unitPrice    = selectedProduct
    ? (priceType === 'wholesale' ? selectedProduct.price_wholesale : selectedProduct.price_retail) : 0;
  const lineTotal  = activeWeight * unitPrice;
  const subtotal   = cart.reduce((s, c) => s + c.quantity_kg * c.unit_price, 0);
  const discountNum = parseFloat(discount) || 0;
  const total      = Math.max(0, subtotal - discountNum);
  const cashNum    = parseFloat(cashReceived) || 0;
  const change     = cashNum - total;

  const onCustomerSearch = (txt: string) => {
    setCustomerName(txt);
    if (txt.length >= 1) {
      const results = DB.searchCustomers(txt);
      setCustomerSuggestions(results);
    } else { setCustomerSuggestions([]); }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.shop_name);
    setCustomerSuggestions([]);
    if (c.customer_type === 'wholesale') setPriceType('wholesale');
  };

  const addToCart = () => {
    if (!selectedProduct) { Alert.alert(t('warning','th'), lbl('select_product')); return; }
    if (activeWeight <= 0) { Alert.alert(t('warning','th'), lbl('enter_weight')); return; }
    setCart(prev => {
      const idx = prev.findIndex(c => c.product.id === selectedProduct.id && c.price_type === priceType);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity_kg: Math.round((updated[idx].quantity_kg + activeWeight) * 1000) / 1000 };
        return updated;
      }
      return [...prev, { product: selectedProduct, quantity_kg: activeWeight, unit_price: unitPrice, price_type: priceType }];
    });
    setManualWeight(''); setSelectedProduct(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) { Alert.alert(t('warning','th'), lbl('no_items')); return; }
    if (payMethod === 'cash' && cashNum < total) {
      Alert.alert(t('warning','th'), `${lbl('received')} ไม่ครบ ต้องชำระ ฿${total.toFixed(2)}`); return;
    }
    setProcessing(true);
    try {
      const id  = 'POS' + Date.now();
      const now = new Date().toISOString();
      DB.saveOrder({
        id, order_number: id,
        customer_name: customerName.trim() || 'ลูกค้าทั่วไป',
        customer_phone: '', subtotal, discount: discountNum, total,
        payment_method: payMethod,
        payment_status: payMethod === 'credit' ? 'pending' : 'paid',
        status: 'confirmed',
        order_type: 'walk_in',
        pack_status: 'packed',
        notes: notes.trim(),
        created_at: now, updated_at: now,
      }, cart.map((c, i) => ({
        id: `OI${Date.now()}${i}`,
        product_id: c.product.id,
        product_name_th: c.product.name_th || '',
        product_name_mm: c.product.name_mm || '',
        product_name_en: c.product.name_en || '',
        product_name_cn: c.product.name_cn || '',
        quantity_kg: c.quantity_kg,
        unit_price: c.unit_price,
        total_price: c.quantity_kg * c.unit_price,
        requested_kg: c.quantity_kg,
        actual_kg: c.quantity_kg,
        actual_weight_kg: c.quantity_kg,
      })));
      setShowPayModal(false);
      setCart([]); setCustomerName(''); setNotes(''); setCashReceived(''); setDiscount('0');
      const msg = payMethod === 'cash'
        ? `${t('payment_success','th')}\n${t('change','th')}: ฿${change.toFixed(2)}`
        : t('payment_success','th');
      Alert.alert('✅ ' + t('success','th'), msg);
    } catch (e: any) {
      Alert.alert('❌ ' + t('error','th'), String(e?.message || e));
    } finally { setProcessing(false); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (p.name_th||'').toLowerCase().includes(q) || (p.name_mm||'').toLowerCase().includes(q)
      || (p.name_en||'').toLowerCase().includes(q) || (p.name_cn||'').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />
      <View style={s.navbar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backBtnTxt}>← {t('back','th')}</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>🛒 ขายหน้าร้าน</Text>
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity key={l.code} style={[s.langBtn, lang === l.code && s.langBtnOn]} onPress={() => setLang(l.code)}>
              <Text style={s.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* น้ำหนัก */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚖️ {lbl('weight_kg')}</Text>
          <TextInput style={s.weightInput} value={manualWeight} onChangeText={setManualWeight}
            keyboardType="decimal-pad" placeholder="0.000" placeholderTextColor="#bbb" />
        </View>

        {/* ลูกค้า */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 ลูกค้า{lang !== 'th' ? ` / ${t('customers',lang)}` : ''}</Text>
          <TextInput style={s.searchInput} value={customerName} onChangeText={onCustomerSearch}
            placeholder="ลูกค้าทั่วไป (พิมเพื่อค้นหา...)" placeholderTextColor="#9ca3af" />
          {customerSuggestions.length > 0 && (
            <View style={s.suggestBox}>
              {customerSuggestions.map(c => (
                <TouchableOpacity key={c.id} style={s.suggestItem} onPress={() => selectCustomer(c)}>
                  <Text style={s.suggestName}>{c.shop_name}</Text>
                  <Text style={s.suggestType}>{c.customer_type === 'wholesale' ? '📦 ส่ง' : '🛒 ปลีก'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* สินค้า */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🌶️ {lbl('select_product')}</Text>
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder={`🔍 ${lbl('search')}...`} placeholderTextColor="#9ca3af" />
          {loading ? <ActivityIndicator color="#c0392b" size="large" style={{ marginTop: 16 }} /> : (
            <View style={s.productGrid}>
              {filtered.map(item => (
                <TouchableOpacity key={item.id}
                  style={[s.productBtn, selectedProduct?.id === item.id && s.productBtnActive]}
                  onPress={() => setSelectedProduct(item)} activeOpacity={0.8}>
                  <ProductName product={item} lang={lang} />
                  <Text style={s.productPrice}>฿{item.price_retail}/กก.</Text>
                  <Text style={[s.productStock, item.stock_kg < 5 && s.lowStock]}>
                    {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ราคา + เพิ่มบิล */}
        {selectedProduct && (
          <View style={s.card}>
            <View style={s.priceTypeRow}>
              {(['retail','wholesale'] as const).map(pt => (
                <TouchableOpacity key={pt}
                  style={[s.priceTypeBtn, priceType === pt && s.priceTypeBtnActive]}
                  onPress={() => setPriceType(pt)}>
                  <Text style={[s.priceTypeTxt, priceType === pt && s.priceTypeTxtActive]}>
                    {pt === 'retail' ? `🛒 ${t('price_retail','th')}` : `📦 ${t('price_wholesale','th')}`}
                  </Text>
                  {lang !== 'th' && (
                    <Text style={[s.priceTypeSub, priceType === pt && s.priceTypeTxtActive]}>
                      {t(pt === 'retail' ? 'price_retail' : 'price_wholesale', lang)}
                    </Text>
                  )}
                  <Text style={[s.priceVal, priceType === pt && s.priceValActive]}>
                    ฿{pt === 'retail' ? selectedProduct.price_retail : selectedProduct.price_wholesale}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.formulaBox}>
              <Text style={s.formulaNameTh}>{selectedProduct.name_th}</Text>
              {lang !== 'th' && <Text style={s.formulaNameSub}>{getProductName(selectedProduct, lang)}</Text>}
              <Text style={s.formulaTxt}>{activeWeight.toFixed(3)} kg × ฿{unitPrice}</Text>
              <Text style={s.formulaTotal}>฿{lineTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={s.addBillBtn} onPress={addToCart}>
              <Text style={s.addBillTxt}>➕ {lbl('add_to_bill')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* บิล */}
        <View style={s.card}>
          <View style={s.billHeader}>
            <Text style={s.cardTitle}>🧾 {lbl('bill_items')} ({cart.length})</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => Alert.alert(lbl('clear_bill'), 'ต้องการล้างบิล?', [
                { text: t('cancel','th'), style: 'cancel' },
                { text: t('delete','th'), style: 'destructive', onPress: () => setCart([]) },
              ])}>
                <Text style={s.clearBillTxt}>🗑️ {t('clear_bill','th')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {cart.length === 0 ? (
            <View style={s.emptyCartBox}>
              <Text style={s.emptyCartIcon}>🛒</Text>
              <Text style={s.emptyCart}>{lbl('no_items')}</Text>
            </View>
          ) : (
            <>
              {cart.map(item => (
                <View key={`${item.product.id}_${item.price_type}`} style={s.cartItem}>
                  <View style={s.cartInfo}>
                    <Text style={s.cartNameTh}>{item.product.name_th}</Text>
                    {lang !== 'th' && <Text style={s.cartNameSub}>{getProductName(item.product, lang)}</Text>}
                    <Text style={s.cartDetail}>{item.quantity_kg.toFixed(3)} kg × ฿{item.unit_price} = ฿{(item.quantity_kg * item.unit_price).toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={s.cartDel} onPress={() => setCart(p => p.filter(c => !(c.product.id === item.product.id && c.price_type === item.price_type)))}>
                    <Text style={s.cartDelTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={s.discountRow}>
                <Text style={s.discountLbl}>💰 {t('discount','th')} ฿</Text>
                <TextInput style={s.discountInput} value={discount} onChangeText={setDiscount}
                  keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#bbb" />
              </View>
              <View style={s.totalBox}>
                <View style={s.totalRow}>
                  <Text style={s.totalLbl}>{lbl('total')}</Text>
                  <Text style={s.totalVal}>฿{subtotal.toFixed(2)}</Text>
                </View>
                {discountNum > 0 && (
                  <View style={s.totalRow}>
                    <Text style={s.totalLbl}>{t('discount','th')}</Text>
                    <Text style={[s.totalVal, { color: '#27ae60' }]}>-฿{discountNum.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[s.totalRow, s.totalRowBig]}>
                  <Text style={s.totalLblBig}>{lbl('net_total')}</Text>
                  <Text style={s.totalValBig}>฿{total.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {cart.length > 0 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.payBtn} onPress={() => setShowPayModal(true)}>
            <Text style={s.payBtnTxt}>💳 {lbl('checkout')}  ฿{total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={mo.overlay}>
          <View style={mo.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={mo.title}>💳 {lbl('checkout')}</Text>
              <View style={mo.totalRow}>
                <Text style={mo.totalLbl}>{lbl('net_total')}</Text>
                <Text style={mo.totalVal}>฿{total.toFixed(2)}</Text>
              </View>
              <Text style={mo.lbl}>💳 {lbl('confirm_pay')}</Text>
              <View style={mo.payMethodRow}>
                {(['cash','transfer','credit'] as PayMethod[]).map(pm => (
                  <TouchableOpacity key={pm}
                    style={[mo.payMethodBtn, payMethod === pm && mo.payMethodBtnActive]}
                    onPress={() => setPayMethod(pm)}>
                    <Text style={mo.payMethodIcon}>{pm === 'cash' ? '💵' : pm === 'transfer' ? '🏦' : '💳'}</Text>
                    <Text style={[mo.payMethodTxt, payMethod === pm && mo.payMethodTxtActive]}>{t(pm,'th')}</Text>
                    {lang !== 'th' && <Text style={[mo.payMethodSub, payMethod === pm && mo.payMethodTxtActive]}>{t(pm, lang)}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              {payMethod === 'cash' && (
                <>
                  <Text style={mo.lbl}>💵 {lbl('received')} ฿</Text>
                  <TextInput style={mo.cashInput} value={cashReceived} onChangeText={setCashReceived}
                    keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#9ca3af" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={mo.quickRow}>
                      {QUICK_CASH.map(v => (
                        <TouchableOpacity key={v} style={mo.quickBtn} onPress={() => setCashReceived(String(v))}>
                          <Text style={mo.quickTxt}>฿{v}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[mo.quickBtn, { backgroundColor: '#27ae60' }]}
                        onPress={() => setCashReceived(total.toFixed(2))}>
                        <Text style={[mo.quickTxt, { color: '#fff' }]}>พอดี</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <View style={[mo.changeBox, change < 0 && { backgroundColor: '#fef2f2' }]}>
                    <Text style={mo.changeLbl}>🔄 {lbl('change')}</Text>
                    <Text style={[mo.changeVal, change < 0 && { color: '#ef4444' }]}>฿{change.toFixed(2)}</Text>
                  </View>
                </>
              )}
              <Text style={mo.lbl}>📝 {lbl('notes')}</Text>
              <TextInput style={mo.input} value={notes} onChangeText={setNotes}
                placeholder="(ไม่บังคับ)" placeholderTextColor="#9ca3af" />
              <View style={mo.btnRow}>
                <TouchableOpacity style={[mo.btn, mo.btnGrey]} onPress={() => setShowPayModal(false)}>
                  <Text style={mo.btnGreyTxt}>{t('cancel','th')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[mo.btn, mo.btnGreen, processing && { opacity: 0.6 }]}
                  onPress={handleCheckout} disabled={processing}>
                  {processing ? <ActivityIndicator color="#fff" /> :
                    <Text style={mo.btnGreenTxt}>✅ {lbl('confirm_pay')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Pack Orders Mode ────────────────────────────────────────
function PackOrdersMode({ lang, setLang, settings, onBack }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});
  const [actualWeights, setActualWeights] = useState<Record<string, string>>({});

  const loadOrders = useCallback(() => {
    setLoading(true);
    try { setOrders(DB.getPendingPackOrders()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(loadOrders);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const openOrder = (order: any) => {
    setSelectedOrder(order);
    const items = DB.getOrderItems(order.id);
    setOrderItems(items);
    const packed: Record<string, boolean> = {};
    const weights: Record<string, string> = {};
    items.forEach((item: any) => {
      packed[item.id] = item.is_packed === 1;
      weights[item.id] = item.actual_weight_kg > 0 ? String(item.actual_weight_kg) : '';
    });
    setPackedItems(packed);
    setActualWeights(weights);
    DB.updateOrderPackStatus(order.id, 'packing');
  };

  const togglePacked = (itemId: string) => {
    setPackedItems(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      const aw = parseFloat(actualWeights[itemId] || '0') || 0;
      DB.updateItemPacked(itemId, next[itemId], aw);
      return next;
    });
  };

  const finishPacking = () => {
    if (!selectedOrder) return;
    const allPacked = orderItems.every(item => packedItems[item.id]);
    if (!allPacked) {
      Alert.alert(t('warning','th'), 'ยังแพคไม่ครบทุกรายการ\nPack all items first'); return;
    }
    // คำนวณยอดตาม actual_weight จริง
    const actualTotal = orderItems.reduce((s, item) => {
      const aw = parseFloat(actualWeights[item.id] || '0') || item.quantity_kg;
      return s + aw * item.unit_price;
    }, 0);
    const actualWeight = orderItems.reduce((s, item) => {
      return s + (parseFloat(actualWeights[item.id] || '0') || item.quantity_kg);
    }, 0);

    Alert.alert(
      '📦 ยืนยันแพคเสร็จ',
      `ลูกค้า: ${selectedOrder.customer_name}\n` +
      `น้ำหนักรวมจริง: ${actualWeight.toFixed(2)} kg\n` +
      `ยอดสุทธิตามน้ำหนักจริง: ฿${actualTotal.toFixed(2)}\n\n` +
      `ยืนยันว่าแพคเสร็จสมบูรณ์?`,
      [
        { text: 'ยังไม่เสร็จ', style: 'cancel' },
        {
          text: '✅ ยืนยัน',
          onPress: () => {
            DB.updateOrderPackStatus(selectedOrder.id, 'packed');
            DB.updateOrderStatus(selectedOrder.id, 'confirmed', 'packed');
            Alert.alert(
              '✅ แพคเสร็จแล้ว',
              `ออเดอร์ ${selectedOrder.customer_name}\n` +
              `ยอดสุดท้าย: ฿${actualTotal.toFixed(2)}\n` +
              `(ตามน้ำหนักชั่งจริง ${actualWeight.toFixed(2)} kg)`
            );
            setSelectedOrder(null);
            loadOrders();
          }
        }
      ]
    );
  };

  const getPackStatusColor = (status: PackStatus) => {
    if (status === 'packed') return '#27ae60';
    if (status === 'packing') return '#2980b9';
    return '#e67e22';
  };
  const getPackStatusIcon = (status: PackStatus) => {
    if (status === 'packed') return '🟢';
    if (status === 'packing') return '🔵';
    return '🟡';
  };

  if (selectedOrder) {
    const totalActualWeight = orderItems.reduce((s, item) => s + (parseFloat(actualWeights[item.id] || '0') || item.quantity_kg), 0);
    const totalActualPrice = orderItems.reduce((s, item) => {
      const aw = parseFloat(actualWeights[item.id] || '0') || item.quantity_kg;
      return s + aw * item.unit_price;
    }, 0);

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar backgroundColor="#2980b9" barStyle="light-content" />
        <View style={[s.navbar, { backgroundColor: '#2980b9' }]}>
          <TouchableOpacity onPress={() => { setSelectedOrder(null); loadOrders(); }} style={s.backBtn}>
            <Text style={s.backBtnTxt}>← {t('back','th')}</Text>
          </TouchableOpacity>
          <Text style={s.navTitle}>📦 {selectedOrder.customer_name}</Text>
        </View>
        <ScrollView style={s.body} contentContainerStyle={{ padding: 12 }}>
          <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: '#2980b9' }]}>
            <Text style={s.packOrderTitle}>📋 รายการแพค</Text>
            <Text style={s.packOrderSub}>ออเดอร์: {selectedOrder.order_number}</Text>
            {selectedOrder.scheduled_date ? (
              <Text style={s.packOrderSub}>📅 กำหนดส่ง: {selectedOrder.scheduled_date}</Text>
            ) : null}
          </View>

          {orderItems.map(item => {
            const isPacked = packedItems[item.id] || false;
            const aw = parseFloat(actualWeights[item.id] || '0');
            const displayWeight = aw > 0 ? aw : item.quantity_kg;
            const lineTotal = displayWeight * item.unit_price;
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            return (
              <View key={item.id} style={[s.packItem, isPacked && s.packItemDone]}>
                <TouchableOpacity style={s.packCheckbox} onPress={() => togglePacked(item.id)}>
                  <Text style={s.packCheckboxTxt}>{isPacked ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
                <View style={s.packItemInfo}>
                  <Text style={[s.packItemName, isPacked && { color: '#aaa' }]}>
                    {item.product_name_th}
                  </Text>
                  {!!secondary && <Text style={s.packItemSub}>{secondary}</Text>}
                  <Text style={s.packItemRequested}>สั่ง: {item.quantity_kg} kg</Text>
                  <View style={s.packWeightRow}>
                    <Text style={s.packWeightLbl}>ชั่งได้:</Text>
                    <TextInput
                      style={s.packWeightInput}
                      value={actualWeights[item.id] || ''}
                      onChangeText={v => setActualWeights(prev => ({ ...prev, [item.id]: v }))}
                      keyboardType="decimal-pad"
                      placeholder={String(item.quantity_kg)}
                      placeholderTextColor="#bbb"
                    />
                    <Text style={s.packWeightUnit}>kg</Text>
                  </View>
                  <Text style={s.packLineTotal}>฿{lineTotal.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}

          <View style={s.packSummary}>
            <Text style={s.packSummaryTxt}>น้ำหนักรวม: {totalActualWeight.toFixed(2)} kg</Text>
            <Text style={s.packSummaryTotal}>ยอดรวม: ฿{totalActualPrice.toFixed(2)}</Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}>
          <TouchableOpacity style={[s.payBtn, { backgroundColor: '#2980b9' }]} onPress={finishPacking}>
            <Text style={s.payBtnTxt}>✅ แพคเสร็จแล้ว{lang !== 'th' ? ` / ${t('pack_done', lang)}` : ''}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#2980b9" barStyle="light-content" />
      <View style={[s.navbar, { backgroundColor: '#2980b9' }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backBtnTxt}>← {t('back','th')}</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>📦 แพคออเดอร์</Text>
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity key={l.code} style={[s.langBtn, lang === l.code && s.langBtnOn]} onPress={() => setLang(l.code)}>
              <Text style={s.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading ? <ActivityIndicator color="#2980b9" size="large" style={{ marginTop: 32 }} /> : (
        orders.length === 0 ? (
          <View style={s.emptyCartBox}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>📭</Text>
            <Text style={s.emptyCart}>ไม่มีออเดอร์รอแพค</Text>
            {lang !== 'th' && <Text style={s.emptyCart}>{t('no_pending_orders', lang)}</Text>}
          </View>
        ) : (
          <>
            {/* ─ Summary Bar ─ */}
            {(() => {
              const total = orders.length;
              const packed = orders.filter(o => o.pack_status === 'packed').length;
              const packing = orders.filter(o => o.pack_status === 'packing').length;
              const waiting = orders.filter(o => o.pack_status === 'waiting').length;
              const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
              return (
                <View style={s.packSummaryBar}>
                  <View style={s.packSummaryCell}>
                    <Text style={s.packSumIcon}>📋</Text>
                    <Text style={s.packSumVal}>{total}</Text>
                    <Text style={s.packSumLbl}>ทั้งหมด</Text>
                  </View>
                  <View style={s.packSummaryCell}>
                    <Text style={s.packSumIcon}>🟡</Text>
                    <Text style={[s.packSumVal, { color: '#e67e22' }]}>{waiting}</Text>
                    <Text style={s.packSumLbl}>รอแพค</Text>
                  </View>
                  <View style={s.packSummaryCell}>
                    <Text style={s.packSumIcon}>🔵</Text>
                    <Text style={[s.packSumVal, { color: '#2980b9' }]}>{packing}</Text>
                    <Text style={s.packSumLbl}>กำลังแพค</Text>
                  </View>
                  <View style={s.packSummaryCell}>
                    <Text style={s.packSumIcon}>🟢</Text>
                    <Text style={[s.packSumVal, { color: '#27ae60' }]}>{packed}</Text>
                    <Text style={s.packSumLbl}>แพคเสร็จ</Text>
                  </View>
                </View>
              );
            })()}
            <FlatList
              data={orders}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const items = DB.getOrderItems(item.id);
                const ps = item.pack_status as PackStatus;
                return (
                  <TouchableOpacity style={s.orderCard} onPress={() => openOrder(item)} activeOpacity={0.85}>
                    <View style={s.orderCardHeader}>
                      <Text style={s.orderStatusIcon}>{getPackStatusIcon(ps)}</Text>
                      <View style={s.orderCardInfo}>
                        <Text style={s.orderCardName}>{item.customer_name}</Text>
                        <Text style={s.orderCardSub}>{items.length} รายการ · ฿{item.total.toFixed(0)}</Text>
                        {item.scheduled_date ? (
                          <Text style={s.orderCardDate}>📅 {item.scheduled_date}</Text>
                        ) : null}
                      </View>
                      <View style={[s.orderStatusBadge, { backgroundColor: getPackStatusColor(ps) }]}>
                        <Text style={s.orderStatusTxt}>
                          {ps === 'packed' ? 'เสร็จ' : ps === 'packing' ? 'กำลังแพค' : 'รอแพค'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )
      )}
    </SafeAreaView>
  );
}

// ─── Shared Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: { backgroundColor: '#c0392b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, elevation: 4, gap: 6 },
  navTitle: { fontSize: 13, fontWeight: 'bold', color: '#fff', flex: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnOn: { backgroundColor: '#fff' },
  langFlag: { fontSize: 18 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  logoutTxt: { fontSize: 18 },
  body: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, margin: 10, marginBottom: 0, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  weightInput: { borderWidth: 2, borderColor: '#c0392b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 30, fontWeight: 'bold', color: '#c0392b', textAlign: 'center', backgroundColor: '#fef5f5' },
  searchInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa', marginBottom: 8 },
  suggestBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, marginTop: -4, marginBottom: 4 },
  suggestItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  suggestName: { fontSize: 14, color: '#333', fontWeight: '600' },
  suggestType: { fontSize: 12, color: '#888' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productBtn: { width: '47%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#e0e0e0' },
  productBtnActive: { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  productPrice: { fontSize: 12, color: '#c0392b', fontWeight: '600', marginTop: 4 },
  productStock: { fontSize: 11, color: '#888', marginTop: 2 },
  lowStock: { color: '#e67e22' },
  priceTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priceTypeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  priceTypeBtnActive: { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  priceTypeTxt: { fontSize: 12, fontWeight: '700', color: '#555', textAlign: 'center' },
  priceTypeSub: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 1 },
  priceTypeTxtActive: { color: '#c0392b' },
  priceVal: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 4 },
  priceValActive: { color: '#c0392b' },
  formulaBox: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 10 },
  formulaNameTh: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  formulaNameSub: { fontSize: 12, color: '#888', marginBottom: 4 },
  formulaTxt: { fontSize: 13, color: '#555', marginTop: 4 },
  formulaTotal: { fontSize: 26, fontWeight: 'bold', color: '#c0392b' },
  addBillBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBillTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearBillTxt: { fontSize: 13, color: '#c0392b', fontWeight: '600' },
  emptyCartBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyCartIcon: { fontSize: 40, marginBottom: 8 },
  emptyCart: { fontSize: 14, color: '#aaa', fontWeight: '600', textAlign: 'center' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cartNameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  cartDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  cartDel: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cartDelTxt: { color: '#c0392b', fontSize: 15, fontWeight: 'bold' },
  discountRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, gap: 8 },
  discountLbl: { fontSize: 12, color: '#555', fontWeight: '600', flex: 1 },
  discountInput: { width: 100, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, textAlign: 'right' },
  totalBox: { marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig: { borderTopWidth: 1, borderColor: '#e0e0e0', marginTop: 6, paddingTop: 8 },
  totalLbl: { fontSize: 13, color: '#555' },
  totalVal: { fontSize: 13, color: '#333', fontWeight: '600' },
  totalLblBig: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalValBig: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  footer: { backgroundColor: '#fff', padding: 12, elevation: 8, borderTopWidth: 1, borderColor: '#eee' },
  payBtn: { backgroundColor: '#27ae60', borderRadius: 12, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  payBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Home mode
  homeContent: { flex: 1, padding: 20, justifyContent: 'center' },
  shopName: { fontSize: 22, fontWeight: 'bold', color: '#c0392b', textAlign: 'center', marginBottom: 4 },
  shopSub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 32 },
  modeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 3, borderLeftWidth: 5, borderLeftColor: '#c0392b' },
  modeIcon: { fontSize: 40, marginRight: 16 },
  modeInfo: { flex: 1 },
  modeTitleTh: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modeTitleSub: { fontSize: 13, color: '#888', marginTop: 2 },
  modeDesc: { fontSize: 12, color: '#aaa', marginTop: 3 },
  modeArrow: { fontSize: 28, color: '#aaa', fontWeight: 'bold' },
  modeBadge: { backgroundColor: '#c0392b', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  modeBadgeTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  // Pack mode
  packItem: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', elevation: 1, borderWidth: 1, borderColor: '#e0e0e0' },
  packItemDone: { backgroundColor: '#f0faf0', borderColor: '#27ae60' },
  packCheckbox: { marginRight: 12, marginTop: 2 },
  packCheckboxTxt: { fontSize: 24 },
  packItemInfo: { flex: 1 },
  packItemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  packItemSub: { fontSize: 12, color: '#888', marginTop: 1 },
  packItemRequested: { fontSize: 12, color: '#888', marginTop: 4 },
  packWeightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  packWeightLbl: { fontSize: 12, color: '#555', fontWeight: '600' },
  packWeightInput: { borderWidth: 1.5, borderColor: '#2980b9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, width: 90, textAlign: 'center', color: '#2980b9', fontWeight: 'bold' },
  packWeightUnit: { fontSize: 12, color: '#555' },
  packLineTotal: { fontSize: 14, fontWeight: 'bold', color: '#27ae60', marginTop: 4 },
  packSummary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8, elevation: 2 },
  packSummaryTxt: { fontSize: 14, color: '#555', marginBottom: 4 },
  packSummaryTotal: { fontSize: 20, fontWeight: 'bold', color: '#c0392b' },
  // Summary bar for pack orders list
  packSummaryBar: { flexDirection: 'row', backgroundColor: '#1a252f', paddingVertical: 10, paddingHorizontal: 8 },
  packSummaryCell: { flex: 1, alignItems: 'center' },
  packSumIcon: { fontSize: 18 },
  packSumVal: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  packSumLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  packOrderTitle: { fontSize: 15, fontWeight: 'bold', color: '#2980b9' },
  packOrderSub: { fontSize: 12, color: '#888', marginTop: 2 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  orderCardHeader: { flexDirection: 'row', alignItems: 'center' },
  orderStatusIcon: { fontSize: 24, marginRight: 12 },
  orderCardInfo: { flex: 1 },
  orderCardName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  orderCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  orderCardDate: { fontSize: 11, color: '#2980b9', marginTop: 2 },
  orderStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  orderStatusTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  // PIN bg
  pinBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinBgIcon: { fontSize: 72, textAlign: 'center' },
  pinBgTxt: { fontSize: 16, color: '#c0392b', fontWeight: 'bold', marginTop: 16 },
  pinBgSub: { fontSize: 13, color: '#888', marginTop: 4 },
});

const mo = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  lbl: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#222' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee', marginTop: 6 },
  totalLbl: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalVal: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  payMethodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  payMethodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  payMethodBtnActive: { borderColor: '#27ae60', backgroundColor: '#f0faf0' },
  payMethodIcon: { fontSize: 20 },
  payMethodTxt: { fontSize: 12, color: '#555', marginTop: 2, fontWeight: '600' },
  payMethodSub: { fontSize: 10, color: '#888', marginTop: 1 },
  payMethodTxtActive: { color: '#27ae60' },
  cashInput: { borderWidth: 2, borderColor: '#27ae60', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 26, fontWeight: 'bold', color: '#27ae60', textAlign: 'right', backgroundColor: '#f0faf0', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  quickBtn: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  quickTxt: { fontSize: 13, fontWeight: '600', color: '#333' },
  changeBox: { backgroundColor: '#f0faf0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  changeLbl: { fontSize: 13, color: '#555', fontWeight: '600' },
  changeVal: { fontSize: 22, fontWeight: 'bold', color: '#27ae60' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnGrey: { backgroundColor: '#f0f0f0' },
  btnGreen: { backgroundColor: '#27ae60', flex: 2 },
  btnGreyTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
  btnGreenTxt: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});
