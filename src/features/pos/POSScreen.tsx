/**
 * 🌶️ POSScreen — หน้าขายหน้าร้าน (Walk-in Sale)
 * ─────────────────────────────────────────────
 * ฟีเจอร์:
 *  - ค้นหาสินค้าทุกภาษา
 *  - ค้นหาลูกค้า → auto-switch wholesale price
 *  - คำนวณ น้ำหนัก × ราคา → ยอด
 *  - ตะกร้าสินค้า + ส่วนลด
 *  - ชำระเงิน: เงินสด / โอน / เครดิต
 *  - พิมพ์สติกเกอร์
 *  - Chilli brand theme
 */
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
import { CHILLI, shadow } from "../../core/theme";

type PayMethod = 'cash' | 'transfer' | 'credit';

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
  primary:   { fontSize: 13, fontWeight: '700', color: CHILLI.textPrimary },
  secondary: { fontSize: 10, color: CHILLI.textSecondary, marginTop: 1 },
});

export default function POSScreen() {
  const { lang, setLang, logout, settings } = useAppStore();

  // ─── State ───────────────────────────────────────────────
  const [products, setProducts]                   = useState<any[]>([]);
  const [cart, setCart]                           = useState<CartItem[]>([]);
  const [search, setSearch]                       = useState('');
  const [loading, setLoading]                     = useState(true);
  const [processing, setProcessing]               = useState(false);
  const [selectedProduct, setSelectedProduct]     = useState<any>(null);
  const [manualWeight, setManualWeight]           = useState('');
  const [priceType, setPriceType]                 = useState<'retail' | 'wholesale'>('retail');
  const [showPayModal, setShowPayModal]           = useState(false);
  const [showStickerModal, setShowStickerModal]   = useState(false);
  const [payMethod, setPayMethod]                 = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived]           = useState('');
  const [notes, setNotes]                         = useState('');
  const [discount, setDiscount]                   = useState('0');
  const [stickerProduct, setStickerProduct]       = useState<any>(null);

  // ─── Customer search + auto-wholesale ───────────────────
  const [customerName, setCustomerName]           = useState('');
  const [selectedCustomer, setSelectedCustomer]   = useState<any>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    try {
      setProducts(DB.getAllProducts().filter((p: any) => p.is_active === 1));
    } catch (e) {
      console.error('Load products error:', e);
    } finally {
      setLoading(false);
    }
  }, []));

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  // ─── Customer search logic ────────────────────────────────
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
      setPriceType('retail'); // reset to retail when cleared
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.shop_name);
    setSelectedCustomer(c);
    setCustomerSuggestions([]);
    // 🔑 Auto-switch to wholesale price for wholesale customers
    if (c.customer_type === 'wholesale') {
      setPriceType('wholesale');
    }
  };

  const clearCustomer = () => {
    setCustomerName('');
    setSelectedCustomer(null);
    setCustomerSuggestions([]);
    setPriceType('retail');
  };

  // ─── Calculations ─────────────────────────────────────────
  const activeWeight = parseFloat(manualWeight) || 0;
  const unitPrice    = selectedProduct
    ? (priceType === 'wholesale' ? selectedProduct.price_wholesale : selectedProduct.price_retail)
    : 0;
  const lineTotal   = activeWeight * unitPrice;
  const subtotal    = cart.reduce((s, c) => s + c.quantity_kg * c.unit_price, 0);
  const discountNum = parseFloat(discount) || 0;
  const total       = Math.max(0, subtotal - discountNum);
  const cashNum     = parseFloat(cashReceived) || 0;
  const change      = cashNum - total;

  // ─── Cart actions ─────────────────────────────────────────
  const addToCart = () => {
    if (!selectedProduct) { Alert.alert(t('warning','th'), lbl('select_product')); return; }
    if (activeWeight <= 0) { Alert.alert(t('warning','th'), lbl('enter_weight')); return; }
    setCart(prev => {
      const idx = prev.findIndex(c => c.product.id === selectedProduct.id && c.price_type === priceType);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity_kg: Math.round((updated[idx].quantity_kg + activeWeight) * 1000) / 1000,
        };
        return updated;
      }
      return [...prev, { product: selectedProduct, quantity_kg: activeWeight, unit_price: unitPrice, price_type: priceType }];
    });
    setManualWeight('');
    setSelectedProduct(null);
  };

  const removeFromCart = (productId: string, pType: string) =>
    setCart(prev => prev.filter(c => !(c.product.id === productId && c.price_type === pType)));

  const clearCart = () => setCart([]);

  // ─── Sticker ─────────────────────────────────────────────
  const handlePrintSticker = () => {
    if (!selectedProduct) { Alert.alert(t('warning','th'), lbl('select_product')); return; }
    if (activeWeight <= 0) { Alert.alert(t('warning','th'), lbl('enter_weight')); return; }
    setStickerProduct({
      product: selectedProduct, weight: activeWeight,
      unitPrice, total: lineTotal,
      shopName: settings?.shop_name || 'J.Rung Chilli',
      date: new Date().toLocaleDateString('th-TH'),
    });
    setShowStickerModal(true);
  };

  // ─── Checkout ─────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) { Alert.alert(t('warning','th'), lbl('no_items')); return; }
    if (payMethod === 'cash' && cashNum < total) {
      Alert.alert(t('warning','th'), `${lbl('received')} ไม่ครบ ต้องชำระ ฿${total.toFixed(2)}`); return;
    }
    setProcessing(true);
    try {
      const id  = 'POS' + Date.now();
      const now = new Date().toISOString();
      DB.saveOrder(
        {
          id, order_number: id,
          customer_id: selectedCustomer?.id || '',
          customer_name: customerName.trim() || 'ลูกค้าทั่วไป',
          customer_phone: selectedCustomer?.phone || '',
          subtotal, discount: discountNum, total,
          payment_method: payMethod,
          payment_status: payMethod === 'credit' ? 'pending' : 'paid',
          status: 'delivered',
          order_type: 'walk_in',
          pack_status: 'packed',
          notes: notes.trim(),
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
          requested_kg: c.quantity_kg,
          actual_kg: c.quantity_kg,
          actual_weight_kg: c.quantity_kg,
        }))
      );
      setShowPayModal(false);
      clearCart();
      clearCustomer();
      setNotes(''); setCashReceived(''); setDiscount('0');
      const msg = payMethod === 'cash'
        ? `${t('payment_success','th')}\n${t('change','th')}: ฿${change.toFixed(2)}`
        : t('payment_success','th');
      Alert.alert('✅ ' + t('success','th'), msg);
    } catch (e: any) {
      Alert.alert('❌ ' + t('error','th'), String(e?.message || e));
    } finally {
      setProcessing(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (p.name_th||'').toLowerCase().includes(q) ||
      (p.name_mm||'').toLowerCase().includes(q) ||
      (p.name_en||'').toLowerCase().includes(q) ||
      (p.name_cn||'').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ── Navbar ── */}
      <View style={s.navbar}>
        <View style={s.navLogoWrap}>
          <Text style={s.navLogoEmoji}>🌶️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle}>{settings?.shop_name || 'J.Rung Chilli'}</Text>
          <Text style={s.navSub}>🛒 POS — ขายหน้าร้าน</Text>
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
        <TouchableOpacity style={s.homeBtn} onPress={() =>
          Alert.alert('ออกจากระบบ', 'ต้องการออก?', [
            { text: t('cancel','th'), style: 'cancel' },
            { text: t('confirm','th'), onPress: logout },
          ])}>
          <Text style={s.homeBtnTxt}>🏠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── ลูกค้า (auto-wholesale) ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 ลูกค้า{lang !== 'th' ? ` / ${t('customers',lang)}` : ''}</Text>

          {/* Selected customer badge */}
          {selectedCustomer ? (
            <View style={s.customerSelectedBadge}>
              <View style={s.customerSelectedLeft}>
                <Text style={s.customerSelectedIcon}>
                  {selectedCustomer.customer_type === 'wholesale' ? '📦' : '🛒'}
                </Text>
                <View>
                  <Text style={s.customerSelectedName}>{selectedCustomer.shop_name}</Text>
                  <Text style={s.customerSelectedType}>
                    {selectedCustomer.customer_type === 'wholesale'
                      ? `✅ ราคาส่ง — ฿${unitPrice > 0 ? unitPrice : '—'}/กก.`
                      : '🛒 ราคาปลีก'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={s.customerClearBtn} onPress={clearCustomer}>
                <Text style={s.customerClearTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={s.customerInput}
                value={customerName}
                onChangeText={onCustomerSearch}
                placeholder={`🔍 พิมชื่อร้านเพื่อค้นหา... (ราคาส่งอัตโนมัติ)`}
                placeholderTextColor={CHILLI.textSecondary}
              />
              {/* General customer button */}
              {customerName.length === 0 && (
                <TouchableOpacity
                  style={s.generalCustomerBtn}
                  onPress={() => { setCustomerName('ลูกค้าทั่วไป'); setPriceType('retail'); }}>
                  <Text style={s.generalCustomerBtnTxt}>🛒 ลูกค้าทั่วไป (ราคาปลีก)</Text>
                </TouchableOpacity>
              )}
              {/* Autocomplete dropdown */}
              {customerSuggestions.length > 0 && (
                <View style={s.suggestBox}>
                  {customerSuggestions.map(c => (
                    <TouchableOpacity key={c.id} style={s.suggestItem} onPress={() => selectCustomer(c)}>
                      <View style={s.suggestLeft}>
                        <Text style={s.suggestIcon}>{c.customer_type === 'wholesale' ? '📦' : '🛒'}</Text>
                        <View>
                          <Text style={s.suggestName}>{c.shop_name}</Text>
                          <Text style={s.suggestType}>
                            {c.customer_type === 'wholesale' ? 'ราคาส่ง ← เลือกเพื่อใช้' : 'ราคาปลีก'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[s.suggestBadge, { color: c.customer_type === 'wholesale' ? CHILLI.orange : CHILLI.red }]}>
                        {c.customer_type === 'wholesale' ? '📦ส่ง' : '🛒ปลีก'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── น้ำหนัก ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚖️ {lbl('weight_kg')}</Text>
          <TextInput
            style={s.weightInput}
            value={manualWeight}
            onChangeText={setManualWeight}
            keyboardType="decimal-pad"
            placeholder="0.000"
            placeholderTextColor={CHILLI.textLight}
          />
          <Text style={s.hint}>{lbl('enter_weight')}</Text>
        </View>

        {/* ── เลือกสินค้า ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🌶️ {lbl('select_product')}</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`🔍 ${lbl('search')}...`}
            placeholderTextColor={CHILLI.textSecondary}
          />
          {loading ? (
            <ActivityIndicator color={CHILLI.red} size="large" style={{ marginTop: 16 }} />
          ) : (
            <>
              <View style={s.productGrid}>
                {filtered.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.productBtn, selectedProduct?.id === item.id && s.productBtnActive]}
                    onPress={() => setSelectedProduct(item)}
                    activeOpacity={0.8}>
                    <ProductName product={item} lang={lang} />
                    <Text style={[s.productPrice,
                      priceType === 'wholesale' && { color: CHILLI.orange }]}>
                      ฿{priceType === 'wholesale' ? item.price_wholesale : item.price_retail}/กก.
                    </Text>
                    <Text style={[s.productStock, item.stock_kg < 5 && s.lowStock]}>
                      {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {filtered.length === 0 && (
                <Text style={s.emptyText}>{lbl('no_products')}</Text>
              )}
            </>
          )}
        </View>

        {/* ── ราคา + เพิ่มบิล ── */}
        {selectedProduct && (
          <View style={s.card}>
            <Text style={s.cardTitle}>💰 {t('price_retail','th')} / {t('price_wholesale','th')}</Text>

            {/* Price type toggle */}
            <View style={s.priceTypeRow}>
              <TouchableOpacity
                style={[s.priceTypeBtn, priceType === 'retail' && s.priceTypeBtnActiveRetail]}
                onPress={() => setPriceType('retail')}>
                <Text style={[s.priceTypeTxt, priceType === 'retail' && { color: CHILLI.red }]}>
                  🛒 {t('price_retail','th')}
                </Text>
                {lang !== 'th' && <Text style={s.priceTypeSub}>{t('price_retail', lang)}</Text>}
                <Text style={[s.priceVal, priceType === 'retail' && { color: CHILLI.red }]}>
                  ฿{selectedProduct.price_retail}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.priceTypeBtn, priceType === 'wholesale' && s.priceTypeBtnActiveWhole]}
                onPress={() => setPriceType('wholesale')}>
                <Text style={[s.priceTypeTxt, priceType === 'wholesale' && { color: CHILLI.orange }]}>
                  📦 {t('price_wholesale','th')}
                </Text>
                {lang !== 'th' && <Text style={s.priceTypeSub}>{t('price_wholesale', lang)}</Text>}
                <Text style={[s.priceVal, priceType === 'wholesale' && { color: CHILLI.orange }]}>
                  ฿{selectedProduct.price_wholesale}
                </Text>
                {selectedCustomer?.customer_type === 'wholesale' && (
                  <View style={s.autoBadge}>
                    <Text style={s.autoBadgeTxt}>⚡ Auto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Formula */}
            <View style={[s.formulaBox, priceType === 'wholesale' && { borderLeftColor: CHILLI.orange }]}>
              <Text style={s.formulaNameTh}>{selectedProduct.name_th}</Text>
              {lang !== 'th' && <Text style={s.formulaNameSub}>{getProductName(selectedProduct, lang)}</Text>}
              <Text style={s.formulaTxt}>{activeWeight.toFixed(3)} kg × ฿{unitPrice}</Text>
              <Text style={[s.formulaTotal, priceType === 'wholesale' && { color: CHILLI.orange }]}>
                ฿{lineTotal.toFixed(2)}
              </Text>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: CHILLI.red }]} onPress={addToCart}>
                <Text style={s.actionBtnTxt}>➕ {t('add_to_bill','th')}</Text>
                {lang !== 'th' && <Text style={s.actionBtnSub}>{t('add_to_bill', lang)}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: CHILLI.purple }]} onPress={handlePrintSticker}>
                <Text style={s.actionBtnTxt}>🏷️ {t('print_sticker','th')}</Text>
                {lang !== 'th' && <Text style={s.actionBtnSub}>{t('print_sticker', lang)}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── บิล ── */}
        <View style={s.card}>
          <View style={s.billHeader}>
            <View>
              <Text style={s.cardTitle}>🧾 {lbl('bill_items')}</Text>
              <Text style={s.cardSub}>{cart.length} รายการ</Text>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() =>
                Alert.alert(lbl('clear_bill'), 'ต้องการล้างบิลทั้งหมด?', [
                  { text: t('cancel','th'), style: 'cancel' },
                  { text: t('delete','th'), style: 'destructive', onPress: clearCart },
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
                  <View style={[s.cartPriceBar,
                    { backgroundColor: item.price_type === 'wholesale' ? CHILLI.orange : CHILLI.red }]} />
                  <View style={s.cartInfo}>
                    <Text style={s.cartNameTh} numberOfLines={1}>{item.product.name_th}</Text>
                    {lang !== 'th' && (
                      <Text style={s.cartNameSub} numberOfLines={1}>
                        {getProductName(item.product, lang)}
                      </Text>
                    )}
                    <Text style={s.cartDetail}>
                      {item.quantity_kg.toFixed(3)} kg × ฿{item.unit_price} = ฿{(item.quantity_kg * item.unit_price).toFixed(2)}
                    </Text>
                    <View style={[s.cartTypeBadge,
                      { backgroundColor: item.price_type === 'wholesale' ? '#fff3e0' : '#fef5f5' }]}>
                      <Text style={[s.cartTypeTxt,
                        { color: item.price_type === 'wholesale' ? CHILLI.orange : CHILLI.red }]}>
                        {item.price_type === 'retail' ? '🛒 ปลีก' : '📦 ส่ง'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={s.cartDel}
                    onPress={() => removeFromCart(item.product.id, item.price_type)}>
                    <Text style={s.cartDelTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* ส่วนลด */}
              <View style={s.discountRow}>
                <Text style={s.discountLbl}>💰 {lbl('discount')} ฿</Text>
                <TextInput
                  style={s.discountInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={CHILLI.textLight}
                />
              </View>

              {/* สรุป */}
              <View style={s.totalBox}>
                <View style={s.totalRow}>
                  <Text style={s.totalLbl}>{lbl('total')}</Text>
                  <Text style={s.totalVal}>฿{subtotal.toFixed(2)}</Text>
                </View>
                {discountNum > 0 && (
                  <View style={s.totalRow}>
                    <Text style={s.totalLbl}>{t('discount','th')}</Text>
                    <Text style={[s.totalVal, { color: CHILLI.green }]}>-฿{discountNum.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[s.totalRow, s.totalRowBig]}>
                  <Text style={s.totalLblBig}>
                    {lbl('net_total')}
                  </Text>
                  <Text style={s.totalValBig}>฿{total.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Footer ── */}
      {cart.length > 0 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.payBtn} onPress={() => setShowPayModal(true)}>
            <Text style={s.payBtnTxt}>
              💳 {lbl('checkout')}  ฿{total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Payment Modal ─── */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={m.modalHeader}>
                <Text style={m.title}>💳 {lbl('checkout')}</Text>
                <Text style={m.titleSub}>
                  {customerName || 'ลูกค้าทั่วไป'}{selectedCustomer?.customer_type === 'wholesale' ? ' · ราคาส่ง' : ''}
                </Text>
              </View>

              <View style={m.totalRow}>
                <Text style={m.totalLbl}>{lbl('net_total')}</Text>
                <Text style={m.totalVal}>฿{total.toFixed(2)}</Text>
              </View>

              {/* Payment method */}
              <Text style={m.lbl}>💳 {lbl('confirm_pay')}</Text>
              <View style={m.payMethodRow}>
                {(['cash','transfer','credit'] as PayMethod[]).map(pm => (
                  <TouchableOpacity
                    key={pm}
                    style={[m.payMethodBtn, payMethod === pm && m.payMethodBtnActive]}
                    onPress={() => setPayMethod(pm)}>
                    <Text style={m.payMethodIcon}>
                      {pm === 'cash' ? '💵' : pm === 'transfer' ? '🏦' : '💳'}
                    </Text>
                    <Text style={[m.payMethodTxt, payMethod === pm && m.payMethodTxtActive]}>
                      {t(pm,'th')}
                    </Text>
                    {lang !== 'th' && (
                      <Text style={[m.payMethodSub, payMethod === pm && m.payMethodTxtActive]}>
                        {t(pm, lang)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {payMethod === 'cash' && (
                <>
                  <Text style={m.lbl}>💵 {lbl('received')} ฿</Text>
                  <TextInput
                    style={m.cashInput}
                    value={cashReceived}
                    onChangeText={setCashReceived}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={CHILLI.textSecondary}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={m.quickRow}>
                      {QUICK_CASH.map(v => (
                        <TouchableOpacity key={v} style={m.quickBtn} onPress={() => setCashReceived(String(v))}>
                          <Text style={m.quickTxt}>฿{v}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[m.quickBtn, { backgroundColor: CHILLI.green }]}
                        onPress={() => setCashReceived(total.toFixed(2))}>
                        <Text style={[m.quickTxt, { color: '#fff' }]}>พอดี / Exact</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <View style={[m.changeBox, change < 0 && { backgroundColor: '#fef2f2' }]}>
                    <Text style={m.changeLbl}>🔄 {lbl('change')}</Text>
                    <Text style={[m.changeVal, change < 0 && { color: '#ef4444' }]}>
                      ฿{change.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}

              {payMethod === 'transfer' && (
                <View style={m.infoBox}>
                  <Text style={m.infoTxt}>📱 {t('transfer','th')} ฿{total.toFixed(2)}</Text>
                  {lang !== 'th' && <Text style={m.infoSub}>{t('transfer', lang)}</Text>}
                  <Text style={m.infoSub}>ตรวจสอบสลิปก่อนยืนยัน</Text>
                </View>
              )}

              {payMethod === 'credit' && (
                <View style={m.infoBox}>
                  <Text style={m.infoTxt}>💳 {t('credit','th')} ฿{total.toFixed(2)}</Text>
                  {lang !== 'th' && <Text style={m.infoSub}>{t('credit', lang)}</Text>}
                  {selectedCustomer && selectedCustomer.credit_limit > 0 && (
                    <Text style={m.infoSub}>
                      วงเงิน: ฿{selectedCustomer.credit_limit.toLocaleString()} | ใช้: ฿{(selectedCustomer.credit_used||0).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}

              <Text style={m.lbl}>📝 {lbl('notes')}</Text>
              <TextInput
                style={m.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="(ไม่บังคับ)"
                placeholderTextColor={CHILLI.textSecondary}
              />

              <View style={m.btnRow}>
                <TouchableOpacity style={[m.btn, m.btnGrey]} onPress={() => setShowPayModal(false)}>
                  <Text style={m.btnGreyTxt}>{lbl('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[m.btn, m.btnGreen, processing && { opacity: 0.6 }]}
                  onPress={handleCheckout}
                  disabled={processing}>
                  {processing
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Text style={m.btnGreenTxt}>✅ {lbl('confirm_pay')}</Text>
                      </>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Sticker Modal ─── */}
      <Modal visible={showStickerModal} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <Text style={m.title}>🏷️ {lbl('print_sticker')}</Text>
            {stickerProduct && (
              <View style={stk.preview}>
                <View style={stk.previewHeader}>
                  <Text style={stk.shopName}>{stickerProduct.shopName}</Text>
                  <Text style={stk.date}>{stickerProduct.date}</Text>
                </View>
                <View style={stk.divider} />
                <Text style={stk.nameTh}>{stickerProduct.product.name_th}</Text>
                {lang !== 'th' && (
                  <Text style={stk.nameSub}>{getProductName(stickerProduct.product, lang)}</Text>
                )}
                <View style={stk.divider} />
                <View style={stk.detailRow}>
                  <Text style={stk.detail}>⚖️ {stickerProduct.weight.toFixed(3)} kg</Text>
                  <Text style={stk.detail}>💰 ฿{stickerProduct.unitPrice}/kg</Text>
                </View>
                <Text style={stk.total}>฿{stickerProduct.total.toFixed(2)}</Text>
              </View>
            )}
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.btn, m.btnGrey]} onPress={() => setShowStickerModal(false)}>
                <Text style={m.btnGreyTxt}>{t('cancel','th')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.btn, { backgroundColor: CHILLI.purple, flex: 2 }]}
                onPress={() => { setShowStickerModal(false); Alert.alert('🖨️', t('print_sticker','th') + ' — OK'); }}>
                <Text style={m.btnGreenTxt}>🖨️ {lbl('print_sticker')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  // Navbar
  navbar: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    ...shadow(3), gap: 6,
  },
  navLogoWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CHILLI.red,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  navLogoEmoji: { fontSize: 18 },
  navTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  navSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 3 },
  langBtn: { padding: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
  langBtnOn: { backgroundColor: CHILLI.orangeLight },
  langFlag: { fontSize: 16 },
  homeBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  homeBtnTxt: { fontSize: 16 },

  body: { flex: 1 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 14, padding: 14,
    marginHorizontal: 10, marginTop: 10,
    ...shadow(2),
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: CHILLI.textPrimary, marginBottom: 10 },
  cardSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  hint: { fontSize: 11, color: CHILLI.textSecondary, textAlign: 'center', marginTop: 6 },

  // Customer search
  customerInput: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: CHILLI.textPrimary,
    backgroundColor: '#fafafa',
  },
  generalCustomerBtn: {
    marginTop: 8, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: CHILLI.grayLight, borderRadius: 8,
    alignItems: 'center',
  },
  generalCustomerBtnTxt: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600' },
  suggestBox: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 10, marginTop: 4, overflow: 'hidden',
    backgroundColor: '#fff', ...shadow(2),
  },
  suggestItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderColor: '#f5f5f5',
  },
  suggestLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  suggestIcon: { fontSize: 22 },
  suggestName: { fontSize: 14, fontWeight: '700', color: CHILLI.textPrimary },
  suggestType: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  suggestBadge: { fontSize: 12, fontWeight: '700' },
  customerSelectedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff8f0',
    borderRadius: 10, padding: 12,
    borderWidth: 1.5, borderColor: CHILLI.orange,
  },
  customerSelectedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  customerSelectedIcon: { fontSize: 28 },
  customerSelectedName: { fontSize: 15, fontWeight: '700', color: CHILLI.textPrimary },
  customerSelectedType: { fontSize: 12, color: CHILLI.orange, marginTop: 2 },
  customerClearBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: CHILLI.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  customerClearTxt: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '700' },

  // Weight input
  weightInput: {
    borderWidth: 2.5, borderColor: CHILLI.red, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 32, fontWeight: '800', color: CHILLI.red,
    textAlign: 'center', backgroundColor: '#fff8f5',
  },

  // Search
  searchInput: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, backgroundColor: '#fafafa', marginBottom: 10,
    color: CHILLI.textPrimary,
  },

  // Product grid
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productBtn: {
    width: '47%', backgroundColor: '#fafafa', borderRadius: 10,
    padding: 12, borderWidth: 1.5, borderColor: '#e8e8e8',
  },
  productBtnActive: { borderColor: CHILLI.red, backgroundColor: '#fff5f2' },
  productPrice: { fontSize: 12, color: CHILLI.red, fontWeight: '700', marginTop: 5 },
  productStock: { fontSize: 10, color: CHILLI.textSecondary, marginTop: 2 },
  lowStock: { color: CHILLI.orange },
  emptyText: { fontSize: 14, color: CHILLI.textSecondary, padding: 16, textAlign: 'center' },

  // Price type toggle
  priceTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priceTypeBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fafafa',
  },
  priceTypeBtnActiveRetail: { borderColor: CHILLI.red, backgroundColor: '#fff5f2' },
  priceTypeBtnActiveWhole: { borderColor: CHILLI.orange, backgroundColor: '#fff8f0' },
  priceTypeTxt: { fontSize: 12, fontWeight: '700', color: CHILLI.textSecondary, textAlign: 'center' },
  priceTypeSub: { fontSize: 10, color: CHILLI.textLight, textAlign: 'center', marginTop: 1 },
  priceVal: { fontSize: 15, fontWeight: '800', color: CHILLI.textPrimary, marginTop: 4 },
  autoBadge: {
    backgroundColor: CHILLI.orange, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1, marginTop: 3,
  },
  autoBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Formula
  formulaBox: {
    backgroundColor: '#f9f9f9', borderRadius: 10,
    padding: 12, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: CHILLI.red,
  },
  formulaNameTh: { fontSize: 15, fontWeight: '700', color: CHILLI.textPrimary },
  formulaNameSub: { fontSize: 12, color: CHILLI.textSecondary, marginBottom: 4 },
  formulaTxt: { fontSize: 13, color: CHILLI.textSecondary, marginTop: 4, marginBottom: 4 },
  formulaTotal: { fontSize: 28, fontWeight: '800', color: CHILLI.red },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', ...shadow(2) },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },

  // Bill
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearBillTxt: { fontSize: 13, color: CHILLI.red, fontWeight: '600' },
  emptyCartBox: { alignItems: 'center', paddingVertical: 24 },
  emptyCartIcon: { fontSize: 44, marginBottom: 8 },
  emptyCart: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },

  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5',
  },
  cartPriceBar: { width: 4, height: '100%', borderRadius: 2, marginRight: 10, minHeight: 50 },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: '700', color: CHILLI.textPrimary },
  cartNameSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  cartDetail: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2 },
  cartTypeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  cartTypeTxt: { fontSize: 10, fontWeight: '700' },
  cartDel: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  cartDelTxt: { color: CHILLI.red, fontSize: 14, fontWeight: '700' },

  discountRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, gap: 8 },
  discountLbl: { fontSize: 12, color: CHILLI.textPrimary, fontWeight: '600', flex: 1 },
  discountInput: {
    width: 100, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, textAlign: 'right',
    color: CHILLI.textPrimary,
  },

  totalBox: { marginTop: 10, backgroundColor: CHILLI.cream, borderRadius: 10, padding: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig: { borderTopWidth: 1, borderColor: '#e0ddd8', marginTop: 6, paddingTop: 8 },
  totalLbl: { fontSize: 13, color: CHILLI.textSecondary },
  totalVal: { fontSize: 13, color: CHILLI.textPrimary, fontWeight: '600' },
  totalLblBig: { fontSize: 15, fontWeight: '700', color: CHILLI.textPrimary },
  totalValBig: { fontSize: 24, fontWeight: '800', color: CHILLI.red },

  footer: {
    backgroundColor: '#fff', padding: 12,
    ...shadow(4), borderTopWidth: 1, borderColor: '#f0ece8',
  },
  payBtn: {
    backgroundColor: CHILLI.green, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', ...shadow(3),
  },
  payBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '93%',
  },
  modalHeader: {
    backgroundColor: CHILLI.red, borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#fff' },
  titleSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  lbl: { fontSize: 13, color: CHILLI.textPrimary, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
    color: CHILLI.textPrimary, backgroundColor: '#fafafa',
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, backgroundColor: CHILLI.cream, borderRadius: 10,
    paddingHorizontal: 14, marginBottom: 4,
  },
  totalLbl: { fontSize: 14, fontWeight: '700', color: CHILLI.textPrimary },
  totalVal: { fontSize: 24, fontWeight: '800', color: CHILLI.red },
  payMethodRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  payMethodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fafafa',
  },
  payMethodBtnActive: { borderColor: CHILLI.green, backgroundColor: '#f0faf5' },
  payMethodIcon: { fontSize: 22 },
  payMethodTxt: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 2, fontWeight: '600' },
  payMethodSub: { fontSize: 10, color: CHILLI.textLight, marginTop: 1 },
  payMethodTxtActive: { color: CHILLI.green },
  cashInput: {
    borderWidth: 2, borderColor: CHILLI.green, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 28, fontWeight: '800', color: CHILLI.green,
    textAlign: 'right', backgroundColor: '#f0faf5', marginBottom: 8,
  },
  quickRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  quickBtn: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  quickTxt: { fontSize: 13, fontWeight: '600', color: CHILLI.textPrimary },
  changeBox: {
    backgroundColor: '#f0faf5', borderRadius: 10, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  changeLbl: { fontSize: 13, color: CHILLI.textPrimary, fontWeight: '600' },
  changeVal: { fontSize: 24, fontWeight: '800', color: CHILLI.green },
  infoBox: { backgroundColor: CHILLI.cream, borderRadius: 10, padding: 14, marginTop: 8 },
  infoTxt: { fontSize: 15, fontWeight: '700', color: CHILLI.red },
  infoSub: { fontSize: 12, color: CHILLI.textSecondary, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnGrey: { backgroundColor: CHILLI.grayLight },
  btnGreen: { backgroundColor: CHILLI.green, flex: 2 },
  btnGreyTxt: { fontSize: 14, color: CHILLI.textPrimary, fontWeight: '600' },
  btnGreenTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },
});

const stk = StyleSheet.create({
  preview: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: CHILLI.borderLight,
    borderRadius: 12, padding: 16, marginVertical: 14,
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  shopName: { fontSize: 14, fontWeight: '700', color: CHILLI.textPrimary },
  date: { fontSize: 11, color: CHILLI.textSecondary },
  divider: { width: '100%', height: 1.5, backgroundColor: '#eeebe8', marginVertical: 8 },
  nameTh: { fontSize: 18, fontWeight: '800', color: CHILLI.red, textAlign: 'center' },
  nameSub: { fontSize: 13, color: CHILLI.textSecondary, marginTop: 3, textAlign: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  detail: { fontSize: 13, color: CHILLI.textPrimary, marginTop: 4 },
  total: { fontSize: 32, fontWeight: '800', color: CHILLI.red, textAlign: 'center', marginTop: 10 },
});
