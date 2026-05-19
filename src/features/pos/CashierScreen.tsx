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
import { CHILLI, shadow, packStatusColor, packStatusLabel } from "../../core/theme";

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

// ─── Bilingual Product Name ──────────────────────────────────
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
  primary:   { fontSize: 13, fontWeight: '700', color: CHILLI.textPrimary },
  secondary: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
});

// ─── PIN Modal ───────────────────────────────────────────────
function CashierPinModal({ visible, lang, onClose, onSuccess }: {
  visible: boolean; lang: Lang; onClose: () => void; onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
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
        {/* Header */}
        <View style={pm.headerBar}>
          <View style={pm.lockCircle}>
            <Text style={pm.lockIcon}>🔐</Text>
          </View>
        </View>
        <Text style={pm.title}>{t('cashier_pin', 'th')}</Text>
        {lang !== 'th' && <Text style={pm.titleSub}>{t('cashier_pin', lang)}</Text>}

        {/* PIN dots */}
        <View style={pm.dots}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[pm.dot, pin.length > i && pm.dotFill]}>
              {pin.length > i && <View style={pm.dotInner} />}
            </View>
          ))}
        </View>

        {/* Keypad */}
        <View style={pm.grid}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity key={i}
              style={[pm.key, k === '' && pm.keyEmpty, k === '⌫' && pm.keyDel]}
              onPress={() => k === '⌫' ? setPin(p => p.slice(0, -1)) : k !== '' ? handlePress(k) : null}
              disabled={k === ''}
              activeOpacity={0.7}
            >
              <Text style={[pm.keyTxt, k === '⌫' && pm.keyDelTxt]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={pm.cancelBtn} onPress={() => { setPin(''); onClose(); }}>
          <Text style={pm.cancelTxt}>
            {t('cancel', 'th')}{lang !== 'th' ? ` / ${t('cancel', lang)}` : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const pm = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,20,0.75)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  box: {
    backgroundColor: CHILLI.white,
    borderRadius: 24, padding: 28, width: '88%',
    alignItems: 'center',
    ...shadow(4),
    borderTopWidth: 4, borderTopColor: CHILLI.red,
  },
  headerBar: { marginBottom: 14 },
  lockCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: CHILLI.red,
    alignItems: 'center', justifyContent: 'center',
    ...shadow(3),
  },
  lockIcon: { fontSize: 28 },
  title: { fontSize: 18, fontWeight: '800', color: CHILLI.dark, textAlign: 'center' },
  titleSub: { fontSize: 13, color: CHILLI.textSecondary, marginTop: 3, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginVertical: 22 },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2.5, borderColor: CHILLI.red,
    backgroundColor: CHILLI.white,
    alignItems: 'center', justifyContent: 'center',
  },
  dotFill: { backgroundColor: CHILLI.red },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: CHILLI.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 252, gap: 10, justifyContent: 'center', marginBottom: 18 },
  key: {
    width: 72, height: 58, borderRadius: 14,
    backgroundColor: CHILLI.cream, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: CHILLI.borderLight,
    ...shadow(1),
  },
  keyEmpty: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  keyDel: { backgroundColor: '#fff0ee', borderColor: '#ffd0cc' },
  keyTxt: { fontSize: 24, fontWeight: '700', color: CHILLI.dark },
  keyDelTxt: { fontSize: 20, color: CHILLI.red },
  cancelBtn: {
    paddingVertical: 11, paddingHorizontal: 28, borderRadius: 12,
    backgroundColor: CHILLI.cream, borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  cancelTxt: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
});

// ─── Main CashierScreen ──────────────────────────────────────
export default function CashierScreen({ navigation }: any) {
  const { lang, setLang, logout, settings } = useAppStore();
  const [mode, setMode] = useState<Mode>('home');
  const [pinUnlocked, setPinUnlocked] = useState(false);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  // ─── PIN gate ───
  if (!pinUnlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.dark }}>
        <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />
        <CashierPinModal
          visible={true}
          lang={lang}
          onClose={() => { logout(); }}
          onSuccess={() => setPinUnlocked(true)}
        />
        {/* Dark background with chilli decorations */}
        <View style={cs.pinBg}>
          <View style={cs.pinBgDecor1} />
          <View style={cs.pinBgDecor2} />
          <View style={cs.pinBgInner}>
            <Text style={cs.pinBgIcon}>⚖️</Text>
            <Text style={cs.pinBgTxt}>{t('cashier_pin', 'th')}</Text>
            {lang !== 'th' && <Text style={cs.pinBgSub}>{t('cashier_pin', lang)}</Text>}
            <View style={cs.pinBrandRow}>
              <Text style={cs.pinBrand}>🌶️ J.Rung Chilli</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
    try { setPendingCount(DB.getPendingPackOrders().length); } catch {}
  }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.dark }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Hero Banner */}
      <View style={ch.hero}>
        {/* decorative circles */}
        <View style={ch.heroCircle1} />
        <View style={ch.heroCircle2} />
        <View style={ch.heroCircle3} />

        {/* Navbar row */}
        <View style={ch.navRow}>
          <View style={ch.logoRing}>
            <Text style={ch.logoEmoji}>⚖️</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={ch.navTitle}>{settings?.shop_name || 'J.Rung Chilli'}</Text>
            <Text style={ch.navSub}>
              {t('role_stock', 'th')}{lang !== 'th' ? ` · ${t('role_stock', lang)}` : ''}
            </Text>
          </View>
          <View style={ch.langRow}>
            {LANGS.map(l => (
              <TouchableOpacity key={l.code}
                style={[ch.langBtn, lang === l.code && ch.langBtnOn]}
                onPress={() => setLang(l.code)}>
                <Text style={ch.langFlag}>{l.flag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={ch.logoutBtn} onPress={() =>
            Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบ?', [
              { text: t('cancel', 'th'), style: 'cancel' },
              { text: t('confirm', 'th'), onPress: logout },
            ])}>
            <Text style={{ fontSize: 20 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={ch.greetingBox}>
          <Text style={ch.greetingTxt}>🌶️ เลือกโหมดการทำงาน</Text>
          {lang !== 'th' && <Text style={ch.greetingSub}>{t('select_mode', lang)}</Text>}
        </View>
      </View>

      {/* Mode Cards */}
      <ScrollView style={{ flex: 1, backgroundColor: CHILLI.cream }} contentContainerStyle={ch.content}>

        {/* Walk-in Sale */}
        <TouchableOpacity style={[ch.modeCard, ch.modeCardRed]} onPress={onWalkin} activeOpacity={0.87}>
          <View style={[ch.modeAccent, { backgroundColor: CHILLI.red }]} />
          <View style={ch.modeIconBox}>
            <Text style={ch.modeIcon}>🛒</Text>
          </View>
          <View style={ch.modeInfo}>
            <Text style={ch.modeTitleTh}>ขายหน้าร้าน</Text>
            {lang !== 'th' && <Text style={ch.modeTitleSub}>{t('walkin_mode', lang)}</Text>}
            <Text style={ch.modeDesc}>Walk-in Sale • ชั่งสินค้า • คิดเงิน</Text>
            <View style={ch.modeTagRow}>
              <View style={[ch.modeTag, { backgroundColor: '#fff0ee' }]}>
                <Text style={[ch.modeTagTxt, { color: CHILLI.red }]}>💵 เงินสด</Text>
              </View>
              <View style={[ch.modeTag, { backgroundColor: '#fff0ee' }]}>
                <Text style={[ch.modeTagTxt, { color: CHILLI.red }]}>🏦 โอน</Text>
              </View>
              <View style={[ch.modeTag, { backgroundColor: '#fff0ee' }]}>
                <Text style={[ch.modeTagTxt, { color: CHILLI.red }]}>💳 เครดิต</Text>
              </View>
            </View>
          </View>
          <Text style={ch.modeArrow}>›</Text>
        </TouchableOpacity>

        {/* Pack Orders */}
        <TouchableOpacity style={[ch.modeCard, ch.modeCardDark]} onPress={onPackOrders} activeOpacity={0.87}>
          <View style={[ch.modeAccent, { backgroundColor: CHILLI.orange }]} />
          <View style={[ch.modeIconBox, { backgroundColor: '#fff3e0' }]}>
            <Text style={ch.modeIcon}>📦</Text>
          </View>
          <View style={ch.modeInfo}>
            <Text style={[ch.modeTitleTh, { color: CHILLI.dark }]}>แพคออเดอร์</Text>
            {lang !== 'th' && <Text style={ch.modeTitleSub}>{t('pack_mode', lang)}</Text>}
            <Text style={ch.modeDesc}>Pre-order Packing • ชั่งน้ำหนักจริง</Text>
            {pendingCount > 0 && (
              <View style={ch.pendingRow}>
                <View style={ch.pendingBadge}>
                  <Text style={ch.pendingTxt}>{pendingCount} ออเดอร์รอแพค</Text>
                </View>
              </View>
            )}
          </View>
          {pendingCount > 0 && (
            <View style={ch.countBadge}>
              <Text style={ch.countTxt}>{pendingCount}</Text>
            </View>
          )}
          <Text style={[ch.modeArrow, { color: CHILLI.orange }]}>›</Text>
        </TouchableOpacity>

        {/* Info strip */}
        <View style={ch.infoStrip}>
          <Text style={ch.infoIcon}>🌶️</Text>
          <Text style={ch.infoTxt}>เจรุ่งชิลลี่ • แม่สอด • ระบบ POS v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ch = StyleSheet.create({
  hero: {
    backgroundColor: CHILLI.dark,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(192,57,43,0.12)', top: -60, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(230,126,34,0.1)', top: 30, right: 40,
  },
  heroCircle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(192,57,43,0.08)', bottom: -20, left: 20,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoRing: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: CHILLI.red, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: CHILLI.orange, ...shadow(2),
  },
  logoEmoji: { fontSize: 22 },
  navTitle: { fontSize: 16, fontWeight: '800', color: CHILLI.white },
  navSub: { fontSize: 11, color: CHILLI.textOnDarkSub, marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtnOn: { backgroundColor: CHILLI.orange },
  langFlag: { fontSize: 18 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  greetingBox: { marginTop: 20, marginBottom: 4 },
  greetingTxt: { fontSize: 22, fontWeight: '800', color: CHILLI.white },
  greetingSub: { fontSize: 14, color: CHILLI.textOnDarkSub, marginTop: 4 },
  content: { padding: 16, gap: 14 },
  modeCard: {
    backgroundColor: CHILLI.white, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', ...shadow(3),
  },
  modeCardRed: { borderWidth: 1, borderColor: '#ffd0cc' },
  modeCardDark: { borderWidth: 1, borderColor: '#ffe5cc' },
  modeAccent: { width: 6, alignSelf: 'stretch' },
  modeIconBox: {
    width: 56, height: 56, borderRadius: 14, margin: 14,
    backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center',
  },
  modeIcon: { fontSize: 28 },
  modeInfo: { flex: 1, paddingVertical: 14, paddingRight: 4 },
  modeTitleTh: { fontSize: 18, fontWeight: '800', color: CHILLI.red },
  modeTitleSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  modeDesc: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 3 },
  modeTagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  modeTag: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  modeTagTxt: { fontSize: 10, fontWeight: '700' },
  modeArrow: { fontSize: 30, color: CHILLI.red, fontWeight: '900', paddingRight: 14 },
  pendingRow: { flexDirection: 'row', marginTop: 8 },
  pendingBadge: {
    backgroundColor: '#fff3e0', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  pendingTxt: { fontSize: 11, color: CHILLI.orange, fontWeight: '700' },
  countBadge: {
    backgroundColor: CHILLI.red, width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  countTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, opacity: 0.5,
  },
  infoIcon: { fontSize: 14 },
  infoTxt: { fontSize: 12, color: CHILLI.textSecondary },
});

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
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [notes, setNotes]             = useState('');
  const [discount, setDiscount]       = useState('0');

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
  const lineTotal    = activeWeight * unitPrice;
  const subtotal     = cart.reduce((s, c) => s + c.quantity_kg * c.unit_price, 0);
  const discountNum  = parseFloat(discount) || 0;
  const total        = Math.max(0, subtotal - discountNum);
  const cashNum      = parseFloat(cashReceived) || 0;
  const change       = cashNum - total;

  const onCustomerSearch = (txt: string) => {
    setCustomerName(txt);
    setSelectedCustomer(null);
    if (txt.length >= 1) {
      try {
        const results = DB.searchCustomers(txt);
        setCustomerSuggestions(results);
      } catch { setCustomerSuggestions([]); }
    } else {
      setCustomerSuggestions([]);
      setPriceType('retail');
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.shop_name);
    setSelectedCustomer(c);
    setCustomerSuggestions([]);
    if (c.customer_type === 'wholesale') setPriceType('wholesale');
  };

  const clearCustomer = () => {
    setCustomerName(''); setSelectedCustomer(null);
    setCustomerSuggestions([]); setPriceType('retail');
  };

  const addToCart = () => {
    if (!selectedProduct) { Alert.alert(t('warning', 'th'), lbl('select_product')); return; }
    if (activeWeight <= 0)  { Alert.alert(t('warning', 'th'), lbl('enter_weight')); return; }
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
    if (cart.length === 0) { Alert.alert(t('warning', 'th'), lbl('no_items')); return; }
    if (payMethod === 'cash' && cashNum < total) {
      Alert.alert(t('warning', 'th'), `${lbl('received')} ไม่ครบ ต้องชำระ ฿${total.toFixed(2)}`); return;
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
        status: 'delivered',
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
      setCart([]); setCustomerName(''); setSelectedCustomer(null);
      setNotes(''); setCashReceived(''); setDiscount('0');
      const msg = payMethod === 'cash'
        ? `${t('payment_success', 'th')}\n${t('change', 'th')}: ฿${change.toFixed(2)}`
        : t('payment_success', 'th');
      Alert.alert('✅ ' + t('success', 'th'), msg);
    } catch (e: any) {
      Alert.alert('❌ ' + t('error', 'th'), String(e?.message || e));
    } finally { setProcessing(false); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (p.name_th||'').toLowerCase().includes(q) || (p.name_mm||'').toLowerCase().includes(q)
      || (p.name_en||'').toLowerCase().includes(q) || (p.name_cn||'').toLowerCase().includes(q);
  });

  const isWholesale = priceType === 'wholesale';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Navbar */}
      <View style={ws.navbar}>
        <TouchableOpacity onPress={onBack} style={ws.backBtn}>
          <Text style={ws.backBtnTxt}>← {t('back', 'th')}</Text>
        </TouchableOpacity>
        <View style={ws.navCenter}>
          <View style={ws.navLogoRing}>
            <Text style={{ fontSize: 16 }}>🛒</Text>
          </View>
          <View>
            <Text style={ws.navTitle}>ขายหน้าร้าน</Text>
            {lang !== 'th' && <Text style={ws.navSub}>{t('walkin_mode', lang)}</Text>}
          </View>
        </View>
        <View style={ws.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity key={l.code} style={[ws.langBtn, lang === l.code && ws.langBtnOn]} onPress={() => setLang(l.code)}>
              <Text style={ws.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ─── น้ำหนัก ─── */}
        <View style={ws.card}>
          <Text style={ws.cardTitle}>⚖️ {lbl('weight_kg')}</Text>
          <TextInput
            style={ws.weightInput}
            value={manualWeight} onChangeText={setManualWeight}
            keyboardType="decimal-pad" placeholder="0.000"
            placeholderTextColor={CHILLI.textLight}
          />
        </View>

        {/* ─── ลูกค้า ─── */}
        <View style={ws.card}>
          <Text style={ws.cardTitle}>👤 {lbl('customers')}</Text>
          {selectedCustomer ? (
            <View style={ws.customerBadge}>
              <View style={ws.customerBadgeLeft}>
                <View style={[ws.custTypeTag, {
                  backgroundColor: selectedCustomer.customer_type === 'wholesale' ? '#fff3e0' : '#fff0ee'
                }]}>
                  <Text style={[ws.custTypeTagTxt, {
                    color: selectedCustomer.customer_type === 'wholesale' ? CHILLI.orange : CHILLI.red
                  }]}>
                    {selectedCustomer.customer_type === 'wholesale' ? '📦 ส่ง' : '🛒 ปลีก'}
                  </Text>
                </View>
                <View>
                  <Text style={ws.custName}>{selectedCustomer.shop_name}</Text>
                  {isWholesale && (
                    <Text style={ws.custPriceTag}>⚡ ราคาส่ง Auto</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={ws.custClearBtn} onPress={clearCustomer}>
                <Text style={ws.custClearTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={ws.searchInput}
                value={customerName} onChangeText={onCustomerSearch}
                placeholder="ลูกค้าทั่วไป (พิมเพื่อค้นหา...)"
                placeholderTextColor={CHILLI.textLight}
              />
              <TouchableOpacity style={ws.generalCustBtn} onPress={() => {
                setCustomerName('ลูกค้าทั่วไป');
                setCustomerSuggestions([]);
              }}>
                <Text style={ws.generalCustTxt}>👤 ลูกค้าทั่วไป (ไม่ระบุ)</Text>
              </TouchableOpacity>
            </>
          )}
          {customerSuggestions.length > 0 && (
            <View style={ws.suggestBox}>
              {customerSuggestions.map(c => (
                <TouchableOpacity key={c.id} style={ws.suggestItem} onPress={() => selectCustomer(c)}>
                  <Text style={ws.suggestName}>{c.shop_name}</Text>
                  <View style={[ws.suggestTypeBadge, {
                    backgroundColor: c.customer_type === 'wholesale' ? '#fff3e0' : '#fff0ee'
                  }]}>
                    <Text style={[ws.suggestTypeT, {
                      color: c.customer_type === 'wholesale' ? CHILLI.orange : CHILLI.red
                    }]}>
                      {c.customer_type === 'wholesale' ? '📦 ส่ง' : '🛒 ปลีก'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── ราคา Auto badge ─── */}
        {isWholesale && (
          <View style={ws.wholesaleBar}>
            <Text style={ws.wholesaleBarTxt}>⚡ โหมดราคาส่ง — ราคาจะเปลี่ยนเป็นราคาส่งโดยอัตโนมัติ</Text>
          </View>
        )}

        {/* ─── สินค้า ─── */}
        <View style={ws.card}>
          <Text style={ws.cardTitle}>🌶️ {lbl('select_product')}</Text>
          <TextInput
            style={ws.searchInput}
            value={search} onChangeText={setSearch}
            placeholder={`🔍 ${lbl('search')}...`}
            placeholderTextColor={CHILLI.textLight}
          />
          {loading ? (
            <ActivityIndicator color={CHILLI.red} size="large" style={{ marginTop: 16 }} />
          ) : (
            <View style={ws.productGrid}>
              {filtered.map(item => (
                <TouchableOpacity key={item.id}
                  style={[ws.productBtn, selectedProduct?.id === item.id && ws.productBtnActive]}
                  onPress={() => setSelectedProduct(item)} activeOpacity={0.8}>
                  <ProductName product={item} lang={lang} />
                  <Text style={ws.productPrice}>
                    ฿{isWholesale ? item.price_wholesale : item.price_retail}/กก.
                  </Text>
                  <Text style={[ws.productStock, item.stock_kg < 5 && ws.lowStock]}>
                    {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── ราคา + เพิ่มบิล ─── */}
        {selectedProduct && (
          <View style={ws.card}>
            <View style={ws.priceTypeRow}>
              {(['retail', 'wholesale'] as const).map(pt => (
                <TouchableOpacity key={pt}
                  style={[ws.priceTypeBtn,
                    priceType === pt && (pt === 'wholesale' ? ws.priceTypeBtnOrange : ws.priceTypeBtnRed)
                  ]}
                  onPress={() => setPriceType(pt)}>
                  <Text style={[ws.priceTypeTxt,
                    priceType === pt && { color: pt === 'wholesale' ? CHILLI.orange : CHILLI.red }
                  ]}>
                    {pt === 'retail' ? `🛒 ${t('price_retail', 'th')}` : `📦 ${t('price_wholesale', 'th')}`}
                  </Text>
                  {lang !== 'th' && (
                    <Text style={[ws.priceTypeSub,
                      priceType === pt && { color: pt === 'wholesale' ? CHILLI.orange : CHILLI.red }
                    ]}>
                      {t(pt === 'retail' ? 'price_retail' : 'price_wholesale', lang)}
                    </Text>
                  )}
                  <Text style={[ws.priceVal,
                    priceType === pt && { color: pt === 'wholesale' ? CHILLI.orange : CHILLI.red }
                  ]}>
                    ฿{pt === 'retail' ? selectedProduct.price_retail : selectedProduct.price_wholesale}
                  </Text>
                  {pt === 'wholesale' && isWholesale && (
                    <View style={ws.autoBadge}>
                      <Text style={ws.autoBadgeTxt}>⚡ Auto</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={ws.formulaBox}>
              <Text style={ws.formulaNameTh}>{selectedProduct.name_th}</Text>
              {lang !== 'th' && <Text style={ws.formulaNameSub}>{getProductName(selectedProduct, lang)}</Text>}
              <Text style={ws.formulaTxt}>{activeWeight.toFixed(3)} kg × ฿{unitPrice}</Text>
              <Text style={[ws.formulaTotal, isWholesale && { color: CHILLI.orange }]}>฿{lineTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={[ws.addBillBtn, isWholesale && { backgroundColor: CHILLI.orange }]} onPress={addToCart}>
              <Text style={ws.addBillTxt}>➕ {lbl('add_to_bill')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── บิล ─── */}
        <View style={ws.card}>
          <View style={ws.billHeader}>
            <Text style={ws.cardTitle}>🧾 {lbl('bill_items')} ({cart.length})</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => Alert.alert(lbl('clear_bill'), 'ต้องการล้างบิล?', [
                { text: t('cancel', 'th'), style: 'cancel' },
                { text: t('delete', 'th'), style: 'destructive', onPress: () => setCart([]) },
              ])}>
                <Text style={ws.clearBillTxt}>🗑️ {t('clear_bill', 'th')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={ws.emptyBox}>
              <Text style={{ fontSize: 36, textAlign: 'center' }}>🛒</Text>
              <Text style={ws.emptyTxt}>{lbl('no_items')}</Text>
            </View>
          ) : (
            <>
              {cart.map(item => (
                <View key={`${item.product.id}_${item.price_type}`}
                  style={[ws.cartItem, { borderLeftColor: item.price_type === 'wholesale' ? CHILLI.orange : CHILLI.red }]}>
                  <View style={ws.cartInfo}>
                    <Text style={ws.cartNameTh}>{item.product.name_th}</Text>
                    {lang !== 'th' && <Text style={ws.cartNameSub}>{getProductName(item.product, lang)}</Text>}
                    <Text style={ws.cartDetail}>
                      {item.quantity_kg.toFixed(3)} kg × ฿{item.unit_price} =
                      <Text style={{ fontWeight: '700', color: item.price_type === 'wholesale' ? CHILLI.orange : CHILLI.red }}>
                        {' '}฿{(item.quantity_kg * item.unit_price).toFixed(2)}
                      </Text>
                    </Text>
                    <View style={[ws.cartPriceTag, {
                      backgroundColor: item.price_type === 'wholesale' ? '#fff3e0' : '#fff0ee'
                    }]}>
                      <Text style={[ws.cartPriceTagTxt, {
                        color: item.price_type === 'wholesale' ? CHILLI.orange : CHILLI.red
                      }]}>
                        {item.price_type === 'wholesale' ? '📦 ราคาส่ง' : '🛒 ราคาปลีก'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={ws.cartDel}
                    onPress={() => setCart(p => p.filter(c =>
                      !(c.product.id === item.product.id && c.price_type === item.price_type)))}>
                    <Text style={ws.cartDelTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Discount */}
              <View style={ws.discountRow}>
                <Text style={ws.discountLbl}>💰 {t('discount', 'th')} ฿</Text>
                <TextInput style={ws.discountInput} value={discount} onChangeText={setDiscount}
                  keyboardType="decimal-pad" placeholder="0" placeholderTextColor={CHILLI.textLight} />
              </View>

              {/* Total */}
              <View style={ws.totalBox}>
                <View style={ws.totalRow}>
                  <Text style={ws.totalLbl}>{lbl('total')}</Text>
                  <Text style={ws.totalVal}>฿{subtotal.toFixed(2)}</Text>
                </View>
                {discountNum > 0 && (
                  <View style={ws.totalRow}>
                    <Text style={ws.totalLbl}>{t('discount', 'th')}</Text>
                    <Text style={[ws.totalVal, { color: CHILLI.green }]}>-฿{discountNum.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[ws.totalRow, ws.totalRowBig]}>
                  <Text style={ws.totalLblBig}>{lbl('net_total')}</Text>
                  <Text style={ws.totalValBig}>฿{total.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      {cart.length > 0 && (
        <View style={ws.footer}>
          <TouchableOpacity style={ws.payBtn} onPress={() => setShowPayModal(true)}>
            <Text style={ws.payBtnTxt}>💳 {lbl('checkout')}  ฿{total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={mo.overlay}>
          <View style={mo.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={mo.modalHandle} />
              <Text style={mo.title}>💳 {lbl('checkout')}</Text>
              <View style={mo.totalRow}>
                <Text style={mo.totalLbl}>{lbl('net_total')}</Text>
                <Text style={mo.totalVal}>฿{total.toFixed(2)}</Text>
              </View>

              <Text style={mo.lbl}>💳 {lbl('confirm_pay')}</Text>
              <View style={mo.payMethodRow}>
                {(['cash', 'transfer', 'credit'] as PayMethod[]).map(pm => (
                  <TouchableOpacity key={pm}
                    style={[mo.payMethodBtn, payMethod === pm && mo.payMethodBtnActive]}
                    onPress={() => setPayMethod(pm)}>
                    <Text style={mo.payMethodIcon}>{pm === 'cash' ? '💵' : pm === 'transfer' ? '🏦' : '💳'}</Text>
                    <Text style={[mo.payMethodTxt, payMethod === pm && mo.payMethodTxtActive]}>{t(pm, 'th')}</Text>
                    {lang !== 'th' && <Text style={[mo.payMethodSub, payMethod === pm && mo.payMethodTxtActive]}>{t(pm, lang)}</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {payMethod === 'cash' && (
                <>
                  <Text style={mo.lbl}>💵 {lbl('received')} ฿</Text>
                  <TextInput style={mo.cashInput} value={cashReceived} onChangeText={setCashReceived}
                    keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={CHILLI.textLight} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={mo.quickRow}>
                      {QUICK_CASH.map(v => (
                        <TouchableOpacity key={v} style={mo.quickBtn} onPress={() => setCashReceived(String(v))}>
                          <Text style={mo.quickTxt}>฿{v}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[mo.quickBtn, { backgroundColor: CHILLI.green }]}
                        onPress={() => setCashReceived(total.toFixed(2))}>
                        <Text style={[mo.quickTxt, { color: '#fff' }]}>พอดี</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <View style={[mo.changeBox, change < 0 && { backgroundColor: '#fef2f2' }]}>
                    <Text style={mo.changeLbl}>🔄 {lbl('change')}</Text>
                    <Text style={[mo.changeVal, change < 0 && { color: CHILLI.red }]}>฿{change.toFixed(2)}</Text>
                  </View>
                </>
              )}

              <Text style={mo.lbl}>📝 {lbl('notes')}</Text>
              <TextInput style={mo.input} value={notes} onChangeText={setNotes}
                placeholder="(ไม่บังคับ)" placeholderTextColor={CHILLI.textLight} />

              <View style={mo.btnRow}>
                <TouchableOpacity style={[mo.btn, mo.btnGrey]} onPress={() => setShowPayModal(false)}>
                  <Text style={mo.btnGreyTxt}>{t('cancel', 'th')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[mo.btn, mo.btnConfirm, processing && { opacity: 0.6 }]}
                  onPress={handleCheckout} disabled={processing}>
                  {processing
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={mo.btnConfirmTxt}>✅ {lbl('confirm_pay')}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── WalkinSale styles ───────────────────────────────────────
const ws = StyleSheet.create({
  navbar: {
    backgroundColor: CHILLI.dark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, ...shadow(3), gap: 8,
  },
  backBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  backBtnTxt: { color: CHILLI.white, fontWeight: '600', fontSize: 13 },
  navCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoRing: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: CHILLI.red,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 14, fontWeight: '800', color: CHILLI.white },
  navSub: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 3 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtnOn: { backgroundColor: CHILLI.orange },
  langFlag: { fontSize: 18 },
  card: {
    backgroundColor: CHILLI.white, borderRadius: 14, padding: 14,
    margin: 10, marginBottom: 0, ...shadow(2),
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: CHILLI.dark, marginBottom: 8 },
  weightInput: {
    borderWidth: 2.5, borderColor: CHILLI.red, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 32, fontWeight: '800',
    color: CHILLI.red, textAlign: 'center', backgroundColor: '#fff8f5',
  },
  searchInput: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: CHILLI.cream, marginBottom: 6, color: CHILLI.dark,
  },
  generalCustBtn: {
    backgroundColor: CHILLI.cream, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: CHILLI.borderLight, alignItems: 'center', marginTop: 4,
  },
  generalCustTxt: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600' },
  customerBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff8f0', borderRadius: 10, padding: 10,
    borderWidth: 1.5, borderColor: CHILLI.orange,
  },
  customerBadgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  custTypeTag: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  custTypeTagTxt: { fontSize: 11, fontWeight: '700' },
  custName: { fontSize: 14, fontWeight: '700', color: CHILLI.dark },
  custPriceTag: { fontSize: 11, color: CHILLI.orange, fontWeight: '600', marginTop: 1 },
  custClearBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#ffd0cc', alignItems: 'center', justifyContent: 'center',
  },
  custClearTxt: { color: CHILLI.red, fontSize: 13, fontWeight: '800' },
  suggestBox: {
    backgroundColor: CHILLI.white, borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 10, marginTop: 2,
  },
  suggestItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: '#f5f5f5',
  },
  suggestName: { fontSize: 14, color: CHILLI.dark, fontWeight: '600' },
  suggestTypeBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  suggestTypeT: { fontSize: 11, fontWeight: '700' },
  wholesaleBar: {
    backgroundColor: '#fff3e0', marginHorizontal: 10, marginTop: 6,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderLeftWidth: 3, borderLeftColor: CHILLI.orange,
  },
  wholesaleBarTxt: { fontSize: 12, color: CHILLI.orange, fontWeight: '600' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productBtn: {
    width: '47%', backgroundColor: CHILLI.cream, borderRadius: 10,
    padding: 12, borderWidth: 1.5, borderColor: CHILLI.borderLight,
  },
  productBtnActive: { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  productPrice: { fontSize: 12, color: CHILLI.red, fontWeight: '700', marginTop: 4 },
  productStock: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 2 },
  lowStock: { color: CHILLI.orange },
  priceTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priceTypeBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10,
    borderWidth: 1.5, borderColor: CHILLI.borderLight, backgroundColor: CHILLI.cream,
  },
  priceTypeBtnRed: { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  priceTypeBtnOrange: { borderColor: CHILLI.orange, backgroundColor: '#fff3e0' },
  priceTypeTxt: { fontSize: 12, fontWeight: '700', color: CHILLI.textSecondary, textAlign: 'center' },
  priceTypeSub: { fontSize: 11, color: CHILLI.textSecondary, textAlign: 'center', marginTop: 1 },
  priceVal: { fontSize: 16, fontWeight: '800', color: CHILLI.dark, marginTop: 4 },
  autoBadge: {
    backgroundColor: CHILLI.orange, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  autoBadgeTxt: { fontSize: 10, color: '#fff', fontWeight: '700' },
  formulaBox: {
    backgroundColor: CHILLI.cream, borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  formulaNameTh: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  formulaNameSub: { fontSize: 12, color: CHILLI.textSecondary, marginBottom: 4 },
  formulaTxt: { fontSize: 13, color: CHILLI.textSecondary, marginTop: 4 },
  formulaTotal: { fontSize: 28, fontWeight: '800', color: CHILLI.red },
  addBillBtn: {
    backgroundColor: CHILLI.red, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', ...shadow(2),
  },
  addBillTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  billHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  clearBillTxt: { fontSize: 13, color: CHILLI.red, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 28 },
  emptyTxt: { fontSize: 14, color: CHILLI.textSecondary, marginTop: 6, fontWeight: '600' },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5',
    borderLeftWidth: 4, paddingLeft: 10,
  },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: '700', color: CHILLI.dark },
  cartNameSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  cartDetail: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  cartPriceTag: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  cartPriceTagTxt: { fontSize: 10, fontWeight: '700' },
  cartDel: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  cartDelTxt: { color: CHILLI.red, fontSize: 15, fontWeight: '800' },
  discountRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, gap: 8 },
  discountLbl: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '600', flex: 1 },
  discountInput: {
    width: 100, borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 15, textAlign: 'right', color: CHILLI.dark,
  },
  totalBox: {
    marginTop: 10, backgroundColor: CHILLI.cream,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig: { borderTopWidth: 1, borderColor: CHILLI.borderLight, marginTop: 6, paddingTop: 8 },
  totalLbl: { fontSize: 13, color: CHILLI.textSecondary },
  totalVal: { fontSize: 13, color: CHILLI.dark, fontWeight: '600' },
  totalLblBig: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  totalValBig: { fontSize: 24, fontWeight: '800', color: CHILLI.red },
  footer: {
    backgroundColor: CHILLI.white, padding: 12, ...shadow(4),
    borderTopWidth: 1, borderColor: CHILLI.borderLight,
  },
  payBtn: {
    backgroundColor: CHILLI.green, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', ...shadow(3),
  },
  payBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// ─── Payment Modal styles ────────────────────────────────────
const mo = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: CHILLI.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '92%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: CHILLI.borderLight, alignSelf: 'center', marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: CHILLI.dark, marginBottom: 14 },
  lbl: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: CHILLI.dark,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee', marginTop: 6,
  },
  totalLbl: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  totalVal: { fontSize: 24, fontWeight: '800', color: CHILLI.red },
  payMethodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  payMethodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: CHILLI.borderLight, backgroundColor: CHILLI.cream,
  },
  payMethodBtnActive: { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  payMethodIcon: { fontSize: 20 },
  payMethodTxt: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2, fontWeight: '600' },
  payMethodSub: { fontSize: 10, color: CHILLI.textSecondary, marginTop: 1 },
  payMethodTxtActive: { color: CHILLI.red },
  cashInput: {
    borderWidth: 2.5, borderColor: CHILLI.green, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 28, fontWeight: '800',
    color: CHILLI.green, textAlign: 'right', backgroundColor: '#f0faf0', marginBottom: 8,
  },
  quickRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  quickBtn: {
    backgroundColor: CHILLI.cream, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  quickTxt: { fontSize: 13, fontWeight: '700', color: CHILLI.dark },
  changeBox: {
    backgroundColor: '#f0faf0', borderRadius: 10, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  changeLbl: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600' },
  changeVal: { fontSize: 24, fontWeight: '800', color: CHILLI.green },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnGrey: { backgroundColor: CHILLI.cream, borderWidth: 1, borderColor: CHILLI.borderLight },
  btnConfirm: { backgroundColor: CHILLI.red, flex: 2, ...shadow(2) },
  btnGreyTxt: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
  btnConfirmTxt: { fontSize: 14, color: '#fff', fontWeight: '800' },
});

// ─── Pack Orders Mode ────────────────────────────────────────
function PackOrdersMode({ lang, setLang, settings, onBack }: any) {
  const [orders, setOrders]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems]   = useState<any[]>([]);
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
      packed[item.id]  = item.is_packed === 1;
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
      Alert.alert(t('warning', 'th'), 'ยังแพคไม่ครบทุกรายการ\nPack all items first');
      return;
    }
    const actualTotal = orderItems.reduce((s, item) => {
      const aw = parseFloat(actualWeights[item.id] || '0') || item.quantity_kg;
      return s + aw * item.unit_price;
    }, 0);
    const actualWeight = orderItems.reduce((s, item) =>
      s + (parseFloat(actualWeights[item.id] || '0') || item.quantity_kg), 0);

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
            // ✅ อัปเดต pack_status → packed และ order status → ready_to_ship
            DB.updateOrderPackStatus(selectedOrder.id, 'packed');
            DB.updateOrderStatus(selectedOrder.id, 'ready_to_ship');
            Alert.alert(
              '✅ แพคเสร็จแล้ว — พร้อมส่ง!',
              `ออเดอร์: ${selectedOrder.customer_name}\n` +
              `ยอดสุดท้าย: ฿${actualTotal.toFixed(2)}\n` +
              `น้ำหนักจริง: ${actualWeight.toFixed(2)} kg\n\n` +
              `สถานะ: 🟢 พร้อมส่ง`
            );
            setSelectedOrder(null);
            loadOrders();
          },
        },
      ]
    );
  };

  // ─── Pack Detail View ───────────────────────────────────────
  if (selectedOrder) {
    const totalActualWeight = orderItems.reduce((s, item) =>
      s + (parseFloat(actualWeights[item.id] || '0') || item.quantity_kg), 0);
    const totalActualPrice = orderItems.reduce((s, item) => {
      const aw = parseFloat(actualWeights[item.id] || '0') || item.quantity_kg;
      return s + aw * item.unit_price;
    }, 0);
    const packedCount = Object.values(packedItems).filter(Boolean).length;
    const progress = orderItems.length > 0 ? packedCount / orderItems.length : 0;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
        <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

        {/* Navbar */}
        <View style={pk.navbar}>
          <TouchableOpacity onPress={() => { setSelectedOrder(null); loadOrders(); }} style={pk.backBtn}>
            <Text style={pk.backTxt}>← {t('back', 'th')}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={pk.navTitle} numberOfLines={1}>📦 {selectedOrder.customer_name}</Text>
            <Text style={pk.navSub}>{selectedOrder.order_number}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={pk.progressBar}>
          <View style={pk.progressBg}>
            <View style={[pk.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={pk.progressTxt}>{packedCount}/{orderItems.length} รายการ</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>

          {/* Order info card */}
          <View style={pk.infoCard}>
            <Text style={pk.infoTitle}>📋 รายการแพค</Text>
            <Text style={pk.infoSub}>ออเดอร์: {selectedOrder.order_number}</Text>
            {selectedOrder.scheduled_date && (
              <Text style={pk.infoSub}>📅 กำหนดส่ง: {selectedOrder.scheduled_date}</Text>
            )}
          </View>

          {/* Items */}
          {orderItems.map(item => {
            const isPacked   = packedItems[item.id] || false;
            const aw         = parseFloat(actualWeights[item.id] || '0');
            const dispWeight = aw > 0 ? aw : item.quantity_kg;
            const lineAmt    = dispWeight * item.unit_price;
            const secondary  = lang !== 'th' ? getProductName(item, lang) : '';
            return (
              <View key={item.id} style={[pk.packItem, isPacked && pk.packItemDone]}>
                <TouchableOpacity style={pk.checkbox} onPress={() => togglePacked(item.id)}>
                  <Text style={pk.checkboxTxt}>{isPacked ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
                <View style={pk.itemInfo}>
                  <Text style={[pk.itemName, isPacked && pk.itemNameDone]}>{item.product_name_th}</Text>
                  {!!secondary && <Text style={pk.itemSub}>{secondary}</Text>}
                  <Text style={pk.itemReq}>สั่ง: {item.quantity_kg} kg</Text>
                  <View style={pk.weightRow}>
                    <Text style={pk.weightLbl}>ชั่งได้:</Text>
                    <TextInput
                      style={pk.weightInput}
                      value={actualWeights[item.id] || ''}
                      onChangeText={v => setActualWeights(prev => ({ ...prev, [item.id]: v }))}
                      keyboardType="decimal-pad"
                      placeholder={String(item.quantity_kg)}
                      placeholderTextColor={CHILLI.textLight}
                    />
                    <Text style={pk.weightUnit}>kg</Text>
                  </View>
                  <Text style={pk.lineTotal}>฿{lineAmt.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}

          {/* Summary */}
          <View style={pk.summaryCard}>
            <View style={pk.summaryRow}>
              <Text style={pk.summaryLbl}>⚖️ น้ำหนักรวม</Text>
              <Text style={pk.summaryVal}>{totalActualWeight.toFixed(2)} kg</Text>
            </View>
            <View style={[pk.summaryRow, { marginTop: 6 }]}>
              <Text style={pk.summaryLblBig}>💰 ยอดรวม</Text>
              <Text style={pk.summaryValBig}>฿{totalActualPrice.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={pk.footer}>
          <TouchableOpacity style={pk.finishBtn} onPress={finishPacking}>
            <Text style={pk.finishBtnTxt}>
              ✅ แพคเสร็จแล้ว{lang !== 'th' ? ` / ${t('pack_done', lang)}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Pack Orders List ───────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Navbar */}
      <View style={pk.navbar}>
        <TouchableOpacity onPress={onBack} style={pk.backBtn}>
          <Text style={pk.backTxt}>← {t('back', 'th')}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={pk.navTitle}>📦 แพคออเดอร์</Text>
          {lang !== 'th' && <Text style={pk.navSub}>{t('pack_mode', lang)}</Text>}
        </View>
        <View style={pk.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity key={l.code} style={[pk.langBtn, lang === l.code && pk.langBtnOn]} onPress={() => setLang(l.code)}>
              <Text style={pk.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={CHILLI.orange} size="large" style={{ marginTop: 32 }} />
      ) : orders.length === 0 ? (
        <View style={pk.emptyBox}>
          <Text style={{ fontSize: 52, textAlign: 'center' }}>📭</Text>
          <Text style={pk.emptyTxt}>ไม่มีออเดอร์รอแพค</Text>
          {lang !== 'th' && <Text style={pk.emptyTxt}>{t('no_pending_orders', lang)}</Text>}
        </View>
      ) : (
        <>
          {/* Summary Bar */}
          {(() => {
            const total    = orders.length;
            const packed   = orders.filter(o => o.pack_status === 'packed').length;
            const packing  = orders.filter(o => o.pack_status === 'packing').length;
            const waiting  = orders.filter(o => o.pack_status === 'waiting').length;
            return (
              <View style={pk.summaryBar}>
                <View style={pk.sumCell}>
                  <Text style={pk.sumIcon}>📋</Text>
                  <Text style={pk.sumVal}>{total}</Text>
                  <Text style={pk.sumLbl}>ทั้งหมด</Text>
                </View>
                <View style={[pk.sumCell, pk.sumCellBorder]}>
                  <Text style={pk.sumIcon}>🟡</Text>
                  <Text style={[pk.sumVal, { color: CHILLI.amber }]}>{waiting}</Text>
                  <Text style={pk.sumLbl}>รอแพค</Text>
                </View>
                <View style={[pk.sumCell, pk.sumCellBorder]}>
                  <Text style={pk.sumIcon}>🔵</Text>
                  <Text style={[pk.sumVal, { color: CHILLI.blue }]}>{packing}</Text>
                  <Text style={pk.sumLbl}>กำลังแพค</Text>
                </View>
                <View style={[pk.sumCell, pk.sumCellBorder]}>
                  <Text style={pk.sumIcon}>🟢</Text>
                  <Text style={[pk.sumVal, { color: CHILLI.green }]}>{packed}</Text>
                  <Text style={pk.sumLbl}>แพคเสร็จ</Text>
                </View>
              </View>
            );
          })()}

          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            renderItem={({ item }) => {
              const items = DB.getOrderItems(item.id);
              const ps    = item.pack_status as PackStatus;
              const color = packStatusColor(ps);
              const label = ps === 'packed' ? 'แพคเสร็จ' : ps === 'packing' ? 'กำลังแพค' : 'รอแพค';
              return (
                <TouchableOpacity style={pk.orderCard} onPress={() => openOrder(item)} activeOpacity={0.87}>
                  <View style={[pk.orderAccent, { backgroundColor: color }]} />
                  <View style={pk.orderBody}>
                    <View style={pk.orderHeader}>
                      <Text style={pk.orderName}>{item.customer_name}</Text>
                      <View style={[pk.orderStatusBadge, { backgroundColor: color }]}>
                        <Text style={pk.orderStatusTxt}>{label}</Text>
                      </View>
                    </View>
                    <Text style={pk.orderSub}>{items.length} รายการ · ฿{(item.total || 0).toFixed(0)}</Text>
                    {item.scheduled_date && (
                      <Text style={pk.orderDate}>📅 {item.scheduled_date}</Text>
                    )}
                  </View>
                  <Text style={pk.orderArrow}>›</Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Pack Orders styles ──────────────────────────────────────
const pk = StyleSheet.create({
  navbar: {
    backgroundColor: CHILLI.dark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8, ...shadow(3),
  },
  backBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  backTxt: { color: CHILLI.white, fontWeight: '600', fontSize: 13 },
  navTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.white },
  navSub: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 3 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtnOn: { backgroundColor: CHILLI.orange },
  langFlag: { fontSize: 18 },
  progressBar: {
    backgroundColor: CHILLI.dark, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  progressBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: CHILLI.orange, borderRadius: 3 },
  progressTxt: { fontSize: 11, color: CHILLI.textOnDarkSub, fontWeight: '700', minWidth: 60 },
  // Order list
  summaryBar: {
    backgroundColor: CHILLI.dark, flexDirection: 'row',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  sumCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  sumCellBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' },
  sumIcon: { fontSize: 18 },
  sumVal: { fontSize: 22, fontWeight: '800', color: CHILLI.white, marginTop: 2 },
  sumLbl: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTxt: { fontSize: 15, color: CHILLI.textSecondary, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  orderCard: {
    backgroundColor: CHILLI.white, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...shadow(2),
  },
  orderAccent: { width: 5, alignSelf: 'stretch' },
  orderBody: { flex: 1, padding: 14 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderName: { fontSize: 15, fontWeight: '800', color: CHILLI.dark, flex: 1 },
  orderStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  orderStatusTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  orderSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 4 },
  orderDate: { fontSize: 11, color: CHILLI.orange, marginTop: 3, fontWeight: '600' },
  orderArrow: { fontSize: 28, color: CHILLI.textSecondary, paddingRight: 12, fontWeight: '900' },
  // Pack detail
  infoCard: {
    backgroundColor: CHILLI.white, borderRadius: 12, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: CHILLI.orange, ...shadow(2),
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.orange },
  infoSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 3 },
  packItem: {
    backgroundColor: CHILLI.white, borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start',
    ...shadow(1), borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  packItemDone: { backgroundColor: '#f0faf5', borderColor: CHILLI.green },
  checkbox: { marginRight: 12, marginTop: 2 },
  checkboxTxt: { fontSize: 26 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  itemNameDone: { color: CHILLI.textSecondary, textDecorationLine: 'line-through' },
  itemSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 1 },
  itemReq: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 4 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  weightLbl: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '600' },
  weightInput: {
    borderWidth: 1.5, borderColor: CHILLI.orange, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 15,
    width: 90, textAlign: 'center', color: CHILLI.orange, fontWeight: '700',
  },
  weightUnit: { fontSize: 12, color: CHILLI.textSecondary },
  lineTotal: { fontSize: 14, fontWeight: '700', color: CHILLI.green, marginTop: 4 },
  summaryCard: {
    backgroundColor: CHILLI.white, borderRadius: 14, padding: 16, marginTop: 8,
    ...shadow(2), borderTopWidth: 3, borderTopColor: CHILLI.orange,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600' },
  summaryVal: { fontSize: 16, fontWeight: '700', color: CHILLI.dark },
  summaryLblBig: { fontSize: 15, fontWeight: '700', color: CHILLI.dark },
  summaryValBig: { fontSize: 26, fontWeight: '800', color: CHILLI.red },
  footer: {
    backgroundColor: CHILLI.white, padding: 12, ...shadow(4),
    borderTopWidth: 1, borderColor: CHILLI.borderLight,
  },
  finishBtn: {
    backgroundColor: CHILLI.orange, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', ...shadow(3),
  },
  finishBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Pin bg (shared at top of file)
});

// ─── CashierScreen bg styles ─────────────────────────────────
const cs = StyleSheet.create({
  pinBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinBgDecor1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(192,57,43,0.12)', top: -80, right: -80,
  },
  pinBgDecor2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(230,126,34,0.08)', bottom: 40, left: -60,
  },
  pinBgInner: { alignItems: 'center' },
  pinBgIcon: { fontSize: 72, textAlign: 'center' },
  pinBgTxt: { fontSize: 18, color: CHILLI.white, fontWeight: '800', marginTop: 16 },
  pinBgSub: { fontSize: 14, color: CHILLI.textOnDarkSub, marginTop: 4 },
  pinBrandRow: { marginTop: 24, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  pinBrand: { fontSize: 14, color: CHILLI.orange, fontWeight: '700' },
});
