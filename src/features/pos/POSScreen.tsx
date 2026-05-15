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

// ชื่อหลัก = ภาษาไทยเสมอ
// ชื่อรอง  = ภาษาที่เลือก (ถ้าเลือก TH ไม่แสดงซ้ำ)
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

export default function POSScreen() {
  const { lang, setLang, logout, settings } = useAppStore();
  const [products, setProducts]         = useState<any[]>([]);
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [processing, setProcessing]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [manualWeight, setManualWeight] = useState('');
  const [priceType, setPriceType]       = useState<'retail' | 'wholesale'>('retail');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [payMethod, setPayMethod]       = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes]               = useState('');
  const [discount, setDiscount]         = useState('0');
  const [stickerProduct, setStickerProduct] = useState<any>(null);

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

  // label helper: Thai / SecondLang (ถ้าเลือก TH แสดงแค่ Thai)
  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const activeWeight = parseFloat(manualWeight) || 0;
  const unitPrice    = selectedProduct
    ? (priceType === 'wholesale' ? selectedProduct.price_wholesale : selectedProduct.price_retail)
    : 0;
  const lineTotal  = activeWeight * unitPrice;
  const subtotal   = cart.reduce((s, c) => s + c.quantity_kg * c.unit_price, 0);
  const discountNum = parseFloat(discount) || 0;
  const total      = Math.max(0, subtotal - discountNum);
  const cashNum    = parseFloat(cashReceived) || 0;
  const change     = cashNum - total;

  const addToCart = () => {
    if (!selectedProduct) {
      Alert.alert(t('warning','th'), lbl('select_product')); return;
    }
    if (activeWeight <= 0) {
      Alert.alert(t('warning','th'), lbl('enter_weight')); return;
    }
    setCart(prev => {
      const idx = prev.findIndex(
        c => c.product.id === selectedProduct.id && c.price_type === priceType
      );
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

  const handlePrintSticker = () => {
    if (!selectedProduct) { Alert.alert(t('warning','th'), lbl('select_product')); return; }
    if (activeWeight <= 0) { Alert.alert(t('warning','th'), lbl('enter_weight')); return; }
    setStickerProduct({
      product: selectedProduct,
      weight: activeWeight,
      unitPrice,
      total: lineTotal,
      shopName: settings?.shop_name || 'J.Rung Chilli',
      date: new Date().toLocaleDateString('th-TH'),
    });
    setShowStickerModal(true);
  };

  const handleCheckout = () => {
    if (cart.length === 0) { Alert.alert(t('warning','th'), lbl('no_items')); return; }
    if (payMethod === 'cash' && cashNum < total) {
      Alert.alert(t('warning','th'), `${lbl('received')} ไม่ครบ ต้องชำระ ฿${total.toFixed(2)}`);
      return;
    }
    setProcessing(true);
    try {
      const id  = 'POS' + Date.now();
      const now = new Date().toISOString();
      DB.saveOrder(
        {
          id, order_number: id,
          customer_name: customerName.trim() || 'ลูกค้าทั่วไป',
          customer_phone: '', subtotal, discount: discountNum, total,
          payment_method: payMethod,
          payment_status: payMethod === 'credit' ? 'pending' : 'paid',
          status: 'confirmed', notes: notes.trim(),
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
      setShowPayModal(false);
      clearCart();
      setCustomerName(''); setNotes(''); setCashReceived(''); setDiscount('0');
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
    return (
      (p.name_th || '').toLowerCase().includes(q) ||
      (p.name_mm || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.name_cn || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />

      {/* ── Navbar ── */}
      <View style={s.navbar}>
        <Text style={s.navTitle}>🌶️ {settings?.shop_name || 'POS'}</Text>
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
          Alert.alert(
            'ออกจากระบบ' + (lang !== 'th' ? ` / ${t('home', lang)}` : ''),
            'ต้องการออก?' + (lang !== 'th' ? ` / ${t('confirm', lang)}?` : ''),
            [
              { text: t('cancel','th') + (lang !== 'th' ? ` / ${t('cancel',lang)}` : ''), style: 'cancel' },
              { text: t('confirm','th'), onPress: logout },
            ]
          )
        }>
          <Text style={s.homeBtnTxt}>🏠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* ── น้ำหนัก / Weight ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚖️ {t('weight_kg','th')}{lang !== 'th' ? ` / ${t('weight_kg',lang)}` : ''}</Text>
          <TextInput
            style={s.weightInput}
            value={manualWeight}
            onChangeText={setManualWeight}
            keyboardType="decimal-pad"
            placeholder="0.000"
            placeholderTextColor="#bbb"
          />
          <Text style={s.hint}>
            {t('enter_weight','th')}{lang !== 'th' ? ` / ${t('enter_weight',lang)}` : ''}
          </Text>
        </View>

        {/* ── เลือกสินค้า / Select Product ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            🌶️ {t('select_product','th')}{lang !== 'th' ? ` / ${t('select_product',lang)}` : ''}
          </Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`🔍 ${t('search','th')}${lang !== 'th' ? ` / ${t('search',lang)}` : ''}...`}
            placeholderTextColor="#9ca3af"
          />
          {loading ? (
            <ActivityIndicator color="#c0392b" size="large" style={{ marginTop: 16 }} />
          ) : (
            <>
              <View style={s.productGrid}>
                {filtered.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.productBtn, selectedProduct?.id === item.id && s.productBtnActive]}
                    onPress={() => setSelectedProduct(item)}
                    activeOpacity={0.8}
                  >
                    {/* ชื่อสินค้า: TH หลัก + ภาษาที่เลือกรอง */}
                    <ProductName product={item} lang={lang} />
                    <Text style={s.productPrice}>฿{item.price_retail}/กก.</Text>
                    <Text style={[s.productStock, item.stock_kg < 5 && s.lowStock]}>
                      {item.stock_kg < 5 ? '⚠️' : '✅'} {item.stock_kg} kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {filtered.length === 0 && (
                <Text style={s.emptyText}>
                  {t('no_products','th')}{lang !== 'th' ? ` / ${t('no_products',lang)}` : ''}
                </Text>
              )}
            </>
          )}
        </View>

        {/* ── ราคา + เพิ่มบิล ── */}
        {selectedProduct && (
          <View style={s.card}>
            <Text style={s.cardTitle}>💰 {t('price_retail','th')} / {t('price_wholesale','th')}</Text>
            <View style={s.priceTypeRow}>
              <TouchableOpacity
                style={[s.priceTypeBtn, priceType === 'retail' && s.priceTypeBtnActive]}
                onPress={() => setPriceType('retail')}
              >
                <Text style={[s.priceTypeTxt, priceType === 'retail' && s.priceTypeTxtActive]}>
                  🛒 {t('price_retail','th')}
                </Text>
                {lang !== 'th' && (
                  <Text style={[s.priceTypeSub, priceType === 'retail' && s.priceTypeTxtActive]}>
                    {t('price_retail', lang)}
                  </Text>
                )}
                <Text style={[s.priceVal, priceType === 'retail' && s.priceValActive]}>
                  ฿{selectedProduct.price_retail}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.priceTypeBtn, priceType === 'wholesale' && s.priceTypeBtnActive]}
                onPress={() => setPriceType('wholesale')}
              >
                <Text style={[s.priceTypeTxt, priceType === 'wholesale' && s.priceTypeTxtActive]}>
                  📦 {t('price_wholesale','th')}
                </Text>
                {lang !== 'th' && (
                  <Text style={[s.priceTypeSub, priceType === 'wholesale' && s.priceTypeTxtActive]}>
                    {t('price_wholesale', lang)}
                  </Text>
                )}
                <Text style={[s.priceVal, priceType === 'wholesale' && s.priceValActive]}>
                  ฿{selectedProduct.price_wholesale}
                </Text>
              </TouchableOpacity>
            </View>

            {/* สูตรคำนวณ */}
            <View style={s.formulaBox}>
              <Text style={s.formulaNameTh}>{selectedProduct.name_th}</Text>
              {lang !== 'th' && (
                <Text style={s.formulaNameSub}>{getProductName(selectedProduct, lang)}</Text>
              )}
              <Text style={s.formulaTxt}>
                {activeWeight.toFixed(3)} kg × ฿{unitPrice}
              </Text>
              <Text style={s.formulaTotal}>฿{lineTotal.toFixed(2)}</Text>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#c0392b' }]} onPress={addToCart}>
                <Text style={s.actionBtnTxt}>➕ {t('add_to_bill','th')}</Text>
                {lang !== 'th' && <Text style={s.actionBtnSub}>{t('add_to_bill', lang)}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#8e44ad' }]} onPress={handlePrintSticker}>
                <Text style={s.actionBtnTxt}>🏷️ {t('print_sticker','th')}</Text>
                {lang !== 'th' && <Text style={s.actionBtnSub}>{t('print_sticker', lang)}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── บิล / Bill ── */}
        <View style={s.card}>
          <View style={s.billHeader}>
            <View>
              <Text style={s.cardTitle}>🧾 {t('bill_items','th')}{lang !== 'th' ? ` / ${t('bill_items',lang)}` : ''}</Text>
              <Text style={s.cardSub}>{cart.length} รายการ / items</Text>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => Alert.alert(
                t('clear_bill','th'),
                'ต้องการล้างบิลทั้งหมด?',
                [
                  { text: t('cancel','th'), style: 'cancel' },
                  { text: t('delete','th'), style: 'destructive', onPress: clearCart },
                ]
              )}>
                <Text style={s.clearBillTxt}>🗑️ {t('clear_bill','th')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={s.emptyCartBox}>
              <Text style={s.emptyCartIcon}>🛒</Text>
              <Text style={s.emptyCart}>{t('no_items','th')}</Text>
              {lang !== 'th' && <Text style={s.emptyCartSub}>{t('no_items', lang)}</Text>}
            </View>
          ) : (
            <>
              {cart.map(item => (
                <View key={`${item.product.id}_${item.price_type}`} style={s.cartItem}>
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
                    <Text style={s.cartType}>
                      {item.price_type === 'retail'
                        ? `🛒 ${t('price_retail','th')}`
                        : `📦 ${t('price_wholesale','th')}`}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.cartDel} onPress={() => removeFromCart(item.product.id, item.price_type)}>
                    <Text style={s.cartDelTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* ส่วนลด */}
              <View style={s.discountRow}>
                <Text style={s.discountLbl}>
                  💰 {t('discount','th')}{lang !== 'th' ? ` / ${t('discount',lang)}` : ''} ฿
                </Text>
                <TextInput
                  style={s.discountInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#bbb"
                />
              </View>

              {/* สรุป */}
              <View style={s.totalBox}>
                <View style={s.totalRow}>
                  <Text style={s.totalLbl}>{t('total','th')}{lang !== 'th' ? ` / ${t('total',lang)}` : ''}</Text>
                  <Text style={s.totalVal}>฿{subtotal.toFixed(2)}</Text>
                </View>
                {discountNum > 0 && (
                  <View style={s.totalRow}>
                    <Text style={s.totalLbl}>{t('discount','th')}</Text>
                    <Text style={[s.totalVal, { color: '#27ae60' }]}>-฿{discountNum.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[s.totalRow, s.totalRowBig]}>
                  <Text style={s.totalLblBig}>
                    {t('net_total','th')}{lang !== 'th' ? `\n${t('net_total',lang)}` : ''}
                  </Text>
                  <Text style={s.totalValBig}>฿{total.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Footer ปุ่มชำระเงิน ── */}
      {cart.length > 0 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.payBtn} onPress={() => setShowPayModal(true)}>
            <Text style={s.payBtnTxt}>
              💳 {t('checkout','th')}{lang !== 'th' ? ` / ${t('checkout',lang)}` : ''}  ฿{total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Payment Modal ─── */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={m.title}>
                💳 {t('checkout','th')}{lang !== 'th' ? ` / ${t('checkout',lang)}` : ''}
              </Text>

              <Text style={m.lbl}>
                👤 ชื่อลูกค้า{lang !== 'th' ? ` / ${t('customers',lang)}` : ''}
              </Text>
              <TextInput
                style={m.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="ลูกค้าทั่วไป / Walk-in"
                placeholderTextColor="#9ca3af"
              />

              <View style={m.totalRow}>
                <Text style={m.totalLbl}>
                  {t('net_total','th')}{lang !== 'th' ? ` / ${t('net_total',lang)}` : ''}
                </Text>
                <Text style={m.totalVal}>฿{total.toFixed(2)}</Text>
              </View>

              <Text style={m.lbl}>
                💳 {t('confirm_pay','th')}{lang !== 'th' ? ` / ${t('confirm_pay',lang)}` : ''}
              </Text>
              <View style={m.payMethodRow}>
                {(['cash','transfer','credit'] as PayMethod[]).map(pm => (
                  <TouchableOpacity
                    key={pm}
                    style={[m.payMethodBtn, payMethod === pm && m.payMethodBtnActive]}
                    onPress={() => setPayMethod(pm)}
                  >
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
                  <Text style={m.lbl}>
                    💵 {t('received','th')}{lang !== 'th' ? ` / ${t('received',lang)}` : ''} ฿
                  </Text>
                  <TextInput
                    style={m.cashInput}
                    value={cashReceived}
                    onChangeText={setCashReceived}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={m.quickRow}>
                      {QUICK_CASH.map(v => (
                        <TouchableOpacity key={v} style={m.quickBtn} onPress={() => setCashReceived(String(v))}>
                          <Text style={m.quickTxt}>฿{v}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[m.quickBtn, { backgroundColor: '#27ae60' }]} onPress={() => setCashReceived(total.toFixed(2))}>
                        <Text style={[m.quickTxt, { color: '#fff' }]}>พอดี / Exact</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <View style={[m.changeBox, change < 0 && { backgroundColor: '#fef2f2' }]}>
                    <Text style={m.changeLbl}>
                      🔄 {t('change','th')}{lang !== 'th' ? ` / ${t('change',lang)}` : ''}
                    </Text>
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
                </View>
              )}

              <Text style={m.lbl}>
                📝 {t('notes','th')}{lang !== 'th' ? ` / ${t('notes',lang)}` : ''}
              </Text>
              <TextInput
                style={m.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="(ไม่บังคับ / Optional)"
                placeholderTextColor="#9ca3af"
              />

              <View style={m.btnRow}>
                <TouchableOpacity style={[m.btn, m.btnGrey]} onPress={() => setShowPayModal(false)}>
                  <Text style={m.btnGreyTxt}>{t('cancel','th')}</Text>
                  {lang !== 'th' && <Text style={m.btnGreySub}>{t('cancel', lang)}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[m.btn, m.btnGreen, processing && { opacity: 0.6 }]}
                  onPress={handleCheckout}
                  disabled={processing}
                >
                  {processing
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Text style={m.btnGreenTxt}>✅ {t('confirm_pay','th')}</Text>
                        {lang !== 'th' && <Text style={m.btnGreenSub}>{t('confirm_pay', lang)}</Text>}
                      </>
                  }
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
            <Text style={m.title}>
              🏷️ {t('print_sticker','th')}{lang !== 'th' ? ` / ${t('print_sticker',lang)}` : ''}
            </Text>
            {stickerProduct && (
              <View style={stk.preview}>
                <Text style={stk.shopName}>{stickerProduct.shopName}</Text>
                <View style={stk.divider} />
                <Text style={stk.nameTh}>{stickerProduct.product.name_th}</Text>
                {lang !== 'th' && (
                  <Text style={stk.nameSub}>{getProductName(stickerProduct.product, lang)}</Text>
                )}
                <View style={stk.divider} />
                <Text style={stk.detail}>⚖️ {stickerProduct.weight.toFixed(3)} kg</Text>
                <Text style={stk.detail}>💰 ฿{stickerProduct.unitPrice}/kg</Text>
                <View style={stk.divider} />
                <Text style={stk.total}>฿{stickerProduct.total.toFixed(2)}</Text>
                <Text style={stk.date}>{stickerProduct.date}</Text>
              </View>
            )}
            <View style={m.btnRow}>
              <TouchableOpacity style={[m.btn, m.btnGrey]} onPress={() => setShowStickerModal(false)}>
                <Text style={m.btnGreyTxt}>{t('cancel','th')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.btn, { backgroundColor: '#8e44ad', flex: 2 }]}
                onPress={() => { setShowStickerModal(false); Alert.alert('🖨️', t('print_sticker','th') + ' — OK'); }}
              >
                <Text style={m.btnGreenTxt}>🖨️ {t('print_sticker','th')}</Text>
                {lang !== 'th' && <Text style={m.btnGreenSub}>{t('print_sticker', lang)}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: { backgroundColor: '#c0392b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, elevation: 4, gap: 6 },
  navTitle: { fontSize: 13, fontWeight: 'bold', color: '#fff', flex: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnOn: { backgroundColor: '#fff' },
  langFlag: { fontSize: 18 },
  homeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  homeBtnTxt: { fontSize: 18 },
  body: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, margin: 10, marginBottom: 0, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardSub: { fontSize: 11, color: '#aaa', marginTop: 1 },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 },
  weightInput: { borderWidth: 2, borderColor: '#c0392b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 30, fontWeight: 'bold', color: '#c0392b', textAlign: 'center', backgroundColor: '#fef5f5' },
  searchInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa', marginBottom: 10 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productBtn: { width: '47%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#e0e0e0' },
  productBtnActive: { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  productPrice: { fontSize: 12, color: '#c0392b', fontWeight: '600', marginTop: 4 },
  productStock: { fontSize: 11, color: '#888', marginTop: 2 },
  lowStock: { color: '#e67e22' },
  emptyText: { fontSize: 14, color: '#aaa', padding: 16, textAlign: 'center' },
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
  formulaTxt: { fontSize: 13, color: '#555', marginTop: 4, marginBottom: 4 },
  formulaTotal: { fontSize: 26, fontWeight: 'bold', color: '#c0392b' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', elevation: 2 },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  actionBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearBillTxt: { fontSize: 13, color: '#c0392b', fontWeight: '600' },
  emptyCartBox: { alignItems: 'center', paddingVertical: 24 },
  emptyCartIcon: { fontSize: 40, marginBottom: 8 },
  emptyCart: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  emptyCartSub: { fontSize: 12, color: '#bbb', marginTop: 4 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cartInfo: { flex: 1 },
  cartNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cartNameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  cartDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  cartType: { fontSize: 11, color: '#aaa', marginTop: 1 },
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
  totalLblBig: { fontSize: 15, fontWeight: 'bold', color: '#333', lineHeight: 20 },
  totalValBig: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  footer: { backgroundColor: '#fff', padding: 12, elevation: 8, borderTopWidth: 1, borderColor: '#eee' },
  payBtn: { backgroundColor: '#27ae60', borderRadius: 12, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  payBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

const m = StyleSheet.create({
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
  infoBox: { backgroundColor: '#fef5f5', borderRadius: 8, padding: 14, marginTop: 8 },
  infoTxt: { fontSize: 15, fontWeight: 'bold', color: '#c0392b' },
  infoSub: { fontSize: 12, color: '#888', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnGrey: { backgroundColor: '#f0f0f0' },
  btnGreen: { backgroundColor: '#27ae60', flex: 2 },
  btnGreyTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
  btnGreySub: { fontSize: 10, color: '#888', marginTop: 2 },
  btnGreenTxt: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
  btnGreenSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});

const stk = StyleSheet.create({
  preview: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 16, marginVertical: 12, alignItems: 'center' },
  shopName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider: { width: '100%', height: 1, backgroundColor: '#ddd', marginVertical: 8 },
  nameTh: { fontSize: 16, fontWeight: 'bold', color: '#c0392b', textAlign: 'center' },
  nameSub: { fontSize: 13, color: '#888', marginTop: 2, textAlign: 'center' },
  detail: { fontSize: 13, color: '#555', marginTop: 4 },
  total: { fontSize: 28, fontWeight: 'bold', color: '#c0392b', marginTop: 8 },
  date: { fontSize: 11, color: '#aaa', marginTop: 4 },
});