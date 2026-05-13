import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList, Modal, Image
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useAppStore } from '../../store/appStore';

type Step = 'select' | 'weigh' | 'confirm' | 'done';

interface CartItem {
  product: any;
  weight_kg: number;
  price_per_kg: number;
  subtotal: number;
}

export const WeighingStation: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { primaryLanguage } = useAppStore();
  const [step, setStep]           = useState<Step>('select');
  const [products, setProducts]   = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [weight, setWeight]       = useState('');
  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale'>('retail');
  const [saving, setSaving]       = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showCart, setShowCart]   = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const list = await DatabaseService.getAllProducts();
      setProducts(list);
    } catch (e) { console.error(e); }
  };

  const getName = (p: any) => {
    if (primaryLanguage === 'mm') return p.name_mm || p.name_th;
    if (primaryLanguage === 'en') return p.name_en || p.name_th;
    if (primaryLanguage === 'cn') return p.name_cn || p.name_th;
    return p.name_th;
  };

  const filtered = products.filter(p =>
    p.name_th?.includes(search) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_mm?.includes(search)
  );

  const selectProduct = (p: any) => {
    setSelected(p);
    setWeight('');
    setPriceMode('retail');
    setStep('weigh');
  };

  const getPrice = () => {
    if (!selected) return 0;
    return priceMode === 'retail' ? selected.price_retail : selected.price_wholesale;
  };

  const addToCart = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) { Alert.alert('⚠️', 'กรุณากรอกน้ำหนักให้ถูกต้อง'); return; }
    const price = getPrice();
    const item: CartItem = {
      product: selected,
      weight_kg: w,
      price_per_kg: price,
      subtotal: Math.round(w * price * 100) / 100,
    };
    setCart(c => [...c, item]);
    setStep('select');
    setSelected(null);
    setWeight('');
  };

  const removeFromCart = (idx: number) => {
    setCart(c => c.filter((_, i) => i !== idx));
  };

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);

  const confirmAndPrint = async () => {
    if (cart.length === 0) { Alert.alert('⚠️', 'กรุณาเพิ่มสินค้าก่อน'); return; }
    Alert.alert(
      '🖨️ ยืนยันการพิมพ์สติกเกอร์',
      `สินค้า ${cart.length} รายการ\nรวม ฿${cartTotal.toFixed(2)}\n\nยืนยันและพิมพ์สติกเกอร์?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: '✅ ยืนยัน พิมพ์เลย', onPress: () => processPrint() },
      ]
    );
  };

  const processPrint = async () => {
    setSaving(true);
    try {
      const orderId     = `W${Date.now()}`;
      const orderNumber = `W${new Date().toISOString().slice(2,10).replace(/-/g,'')}${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
      const items = cart.map(c => ({
        product_id:   c.product.id,
        product_name: getName(c.product),
        weight_kg:    c.weight_kg,
        price_per_kg: c.price_per_kg,
        quantity:     c.weight_kg,
        unit:         'kg',
        subtotal:     c.subtotal,
      }));
      const order = {
        id:             orderId,
        order_number:   orderNumber,
        customer_id:    null,
        customer_name:  'ลูกค้าทั่วไป',
        order_type:     'walk_in',
        status:         'confirmed',
        payment_status: 'paid',
        total_amount:   cartTotal,
        notes:          '',
        pickup_time:    '',
        created_at:     new Date().toISOString(),
      };
      await DatabaseService.saveOrder(order, items);
      setLastOrder({ order, items });
      setStep('done');
      setCart([]);
      Alert.alert('✅ สำเร็จ', `ออเดอร์ #${orderNumber}\nพิมพ์สติกเกอร์เรียบร้อย!`);
    } catch (e) {
      Alert.alert('❌ ผิดพลาด', 'บันทึกออเดอร์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setStep('select');
    setCart([]);
    setSelected(null);
    setWeight('');
    setLastOrder(null);
  };

  /* ── STEP: SELECT PRODUCT ── */
  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📦 ขั้นตอนที่ 1: เลือกสินค้า / Select Product</Text>
      <TextInput
        style={styles.searchBox}
        value={search}
        onChangeText={setSearch}
        placeholder="🔍 ค้นหาสินค้า / Search product..."
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        style={styles.productList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => selectProduct(item)} activeOpacity={0.8}>
            {item.image_uri ? (
              <Image source={{ uri: item.image_uri }} style={styles.productThumb} />
            ) : (
              <View style={styles.productThumbEmpty}>
                <Text style={styles.productThumbIcon}>🌶️</Text>
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{getName(item)}</Text>
              <Text style={styles.productName2}>{item.name_en || item.name_mm || ''}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.retailPrice}>ปลีก ฿{item.price_retail}/กก.</Text>
                <Text style={styles.wholesalePrice}>ส่ง ฿{item.price_wholesale}/กก.</Text>
              </View>
              <Text style={styles.stockText}>สต็อก: {item.stock_kg} กก.</Text>
            </View>
            <Text style={styles.selectArrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>ไม่พบสินค้า</Text>
          </View>
        }
      />
    </View>
  );

  /* ── STEP: WEIGH ── */
  const renderWeighStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>⚖️ ขั้นตอนที่ 2: ชั่งน้ำหนัก / Weigh</Text>

      <View style={styles.selectedProductCard}>
        {selected?.image_uri ? (
          <Image source={{ uri: selected.image_uri }} style={styles.selectedThumb} />
        ) : (
          <Text style={styles.selectedThumbIcon}>🌶️</Text>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedName}>{getName(selected)}</Text>
          <Text style={styles.selectedName2}>{selected?.name_en || ''}</Text>
        </View>
      </View>

      {/* Price Mode */}
      <View style={styles.priceModeRow}>
        <Text style={styles.priceModeLabel}>ประเภทราคา / Price Type:</Text>
        <TouchableOpacity
          style={[styles.priceModeBtn, priceMode === 'retail' && styles.priceModeBtnActive]}
          onPress={() => setPriceMode('retail')}
        >
          <Text style={[styles.priceModeBtnText, priceMode === 'retail' && { color: '#fff' }]}>
            💵 ปลีก ฿{selected?.price_retail}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.priceModeBtn, priceMode === 'wholesale' && styles.priceModeBtnActive]}
          onPress={() => setPriceMode('wholesale')}
        >
          <Text style={[styles.priceModeBtnText, priceMode === 'wholesale' && { color: '#fff' }]}>
            🏪 ส่ง ฿{selected?.price_wholesale}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weight Input */}
      <View style={styles.weightSection}>
        <Text style={styles.weightLabel}>น้ำหนัก (กก.) / Weight (kg)</Text>
        <TextInput
          style={styles.weightInput}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="0.00"
          autoFocus
        />
        {weight && !isNaN(parseFloat(weight)) ? (
          <View style={styles.subtotalBox}>
            <Text style={styles.subtotalLabel}>ยอดรวม / Subtotal</Text>
            <Text style={styles.subtotalValue}>
              ฿{(parseFloat(weight) * getPrice()).toFixed(2)}
            </Text>
            <Text style={styles.subtotalDetail}>
              {weight} กก. × ฿{getPrice()} = ฿{(parseFloat(weight) * getPrice()).toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quick Weight Buttons */}
      <View style={styles.quickWeightRow}>
        {['0.5','1','1.5','2','3','5'].map(w => (
          <TouchableOpacity key={w} style={styles.quickBtn} onPress={() => setWeight(w)}>
            <Text style={styles.quickBtnText}>{w} กก.</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep('select')}>
          <Text style={styles.backStepText}>← กลับ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addCartBtn} onPress={addToCart} activeOpacity={0.8}>
          <Text style={styles.addCartText}>🛒 เพิ่มในตะกร้า</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ── STEP: DONE ── */
  const renderDoneStep = () => (
    <View style={styles.doneContainer}>
      <Text style={styles.doneIcon}>✅</Text>
      <Text style={styles.doneTitle}>พิมพ์สติกเกอร์เรียบร้อย!</Text>
      <Text style={styles.doneTitle2}>Sticker Printed Successfully!</Text>
      {lastOrder && (
        <View style={styles.doneOrderBox}>
          <Text style={styles.doneOrderNum}>#{lastOrder.order?.order_number}</Text>
          <Text style={styles.doneOrderTotal}>฿{lastOrder.order?.total_amount?.toFixed(2)}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.newOrderBtn} onPress={resetAll} activeOpacity={0.8}>
        <Text style={styles.newOrderText}>🔄 เริ่มรายการใหม่ / New Order</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── CART MODAL ── */
  const renderCartModal = () => (
    <Modal visible={showCart} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.cartModal}>
          <View style={styles.cartModalHeader}>
            <Text style={styles.cartModalTitle}>🛒 ตะกร้า / Cart ({cart.length})</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Text style={styles.cartCloseBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cartList}>
            {cart.map((item, idx) => (
              <View key={idx} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{getName(item.product)}</Text>
                  <Text style={styles.cartItemDetail}>
                    {item.weight_kg} กก. × ฿{item.price_per_kg}
                  </Text>
                </View>
                <Text style={styles.cartItemSubtotal}>฿{item.subtotal.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(idx)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            <Text style={styles.cartTotal}>รวม / Total: ฿{cartTotal.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.printBtn, saving && styles.printBtnDisabled]}
              onPress={() => { setShowCart(false); confirmAndPrint(); }}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.printBtnText}>🖨️ ยืนยัน & พิมพ์สติกเกอร์</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚖️ ชั่ง & ขาย / Weigh & Sell</Text>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.cartBadge} onPress={() => setShowCart(true)}>
            <Text style={styles.cartBadgeText}>🛒 {cart.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {(['select','weigh','done'] as Step[]).map((s, i) => (
          <View key={s} style={[styles.progressStep, step === s && styles.progressStepActive]}>
            <Text style={[styles.progressNum, step === s && { color: '#fff' }]}>{i + 1}</Text>
            <Text style={[styles.progressLabel, step === s && { color: '#c0392b' }]}>
              {s === 'select' ? 'เลือกสินค้า' : s === 'weigh' ? 'ชั่งน้ำหนัก' : 'พิมพ์'}
            </Text>
          </View>
        ))}
      </View>

      {/* Step Content */}
      {step === 'select' && renderSelectStep()}
      {step === 'weigh'  && renderWeighStep()}
      {step === 'done'   && renderDoneStep()}

      {/* Cart FAB */}
      {cart.length > 0 && step === 'select' && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCart(true)} activeOpacity={0.8}>
          <Text style={styles.fabText}>🛒 {cart.length} รายการ  ฿{cartTotal.toFixed(2)}</Text>
          <Text style={styles.fabSub}>แตะเพื่อยืนยัน & พิมพ์</Text>
        </TouchableOpacity>
      )}

      {renderCartModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b',
                        padding: 16, gap: 8 },
  backBtn:            { padding: 4 },
  backText:           { color: '#fff', fontSize: 15 },
  headerTitle:        { flex: 1, color: '#fff', fontSize: 17, fontWeight: 'bold' },
  cartBadge:          { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12,
                        paddingVertical: 4 },
  cartBadgeText:      { color: '#c0392b', fontWeight: 'bold', fontSize: 14 },
  progressBar:        { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
                        paddingHorizontal: 16, elevation: 2 },
  progressStep:       { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 6 },
  progressStepActive: { backgroundColor: '#fdecea' },
  progressNum:        { fontSize: 16, fontWeight: 'bold', color: '#bdc3c7' },
  progressLabel:      { fontSize: 11, color: '#bdc3c7', marginTop: 2 },
  stepContainer:      { flex: 1, padding: 12 },
  stepTitle:          { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  searchBox:          { backgroundColor: '#fff', borderRadius: 10, padding: 12,
                        fontSize: 15, elevation: 1, marginBottom: 8 },
  productList:        { flex: 1 },
  productCard:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10,
                        padding: 12, marginBottom: 8, elevation: 2, alignItems: 'center' },
  productThumb:       { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  productThumbEmpty:  { width: 56, height: 56, borderRadius: 8, marginRight: 12,
                        backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center' },
  productThumbIcon:   { fontSize: 28 },
  productInfo:        { flex: 1 },
  productName:        { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  productName2:       { fontSize: 12, color: '#7f8c8d' },
  priceRow:           { flexDirection: 'row', gap: 10, marginTop: 4 },
  retailPrice:        { fontSize: 12, color: '#27ae60' },
  wholesalePrice:     { fontSize: 12, color: '#2980b9' },
  stockText:          { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  selectArrow:        { fontSize: 24, color: '#bdc3c7' },
  emptyBox:           { alignItems: 'center', padding: 40 },
  emptyIcon:          { fontSize: 40 },
  emptyText:          { color: '#95a5a6', fontSize: 16, marginTop: 8 },
  selectedProductCard:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                        borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, gap: 12 },
  selectedThumb:      { width: 64, height: 64, borderRadius: 10 },
  selectedThumbIcon:  { fontSize: 40 },
  selectedName:       { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  selectedName2:      { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  priceModeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8,
                        marginBottom: 12, flexWrap: 'wrap' },
  priceModeLabel:     { fontSize: 13, color: '#7f8c8d' },
  priceModeBtn:       { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8,
                        padding: 8, alignItems: 'center' },
  priceModeBtnActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  priceModeBtnText:   { fontSize: 13, fontWeight: '600', color: '#2c3e50' },
  weightSection:      { backgroundColor: '#fff', borderRadius: 12, padding: 16,
                        marginBottom: 12, elevation: 2, alignItems: 'center' },
  weightLabel:        { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  weightInput:        { fontSize: 42, fontWeight: 'bold', color: '#c0392b',
                        textAlign: 'center', borderBottomWidth: 2, borderColor: '#c0392b',
                        width: '60%', paddingBottom: 4 },
  subtotalBox:        { marginTop: 12, alignItems: 'center', backgroundColor: '#eafaf1',
                        borderRadius: 10, padding: 12, width: '100%' },
  subtotalLabel:      { fontSize: 12, color: '#7f8c8d' },
  subtotalValue:      { fontSize: 28, fontWeight: 'bold', color: '#27ae60' },
  subtotalDetail:     { fontSize: 12, color: '#95a5a6', marginTop: 4 },
  quickWeightRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickBtn:           { backgroundColor: '#ecf0f1', borderRadius: 8, paddingHorizontal: 14,
                        paddingVertical: 10 },
  quickBtnText:       { fontSize: 14, color: '#2c3e50', fontWeight: '600' },
  actionRow:          { flexDirection: 'row', gap: 10 },
  backStepBtn:        { flex: 1, backgroundColor: '#ecf0f1', borderRadius: 10, padding: 14,
                        alignItems: 'center' },
  backStepText:       { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  addCartBtn:         { flex: 2, backgroundColor: '#27ae60', borderRadius: 10, padding: 14,
                        alignItems: 'center', elevation: 2 },
  addCartText:        { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  doneContainer:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  doneIcon:           { fontSize: 72 },
  doneTitle:          { fontSize: 22, fontWeight: 'bold', color: '#27ae60', marginTop: 16 },
  doneTitle2:         { fontSize: 16, color: '#7f8c8d', marginTop: 4 },
  doneOrderBox:       { backgroundColor: '#fff', borderRadius: 12, padding: 20,
                        marginTop: 20, alignItems: 'center', elevation: 2 },
  doneOrderNum:       { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  doneOrderTotal:     { fontSize: 32, fontWeight: 'bold', color: '#27ae60', marginTop: 8 },
  newOrderBtn:        { backgroundColor: '#c0392b', borderRadius: 12, paddingHorizontal: 32,
                        paddingVertical: 16, marginTop: 24, elevation: 3 },
  newOrderText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  fab:                { position: 'absolute', bottom: 20, left: 20, right: 20,
                        backgroundColor: '#c0392b', borderRadius: 14, padding: 16,
                        alignItems: 'center', elevation: 8 },
  fabText:            { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  fabSub:             { color: '#ffcccc', fontSize: 12, marginTop: 2 },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'flex-end' },
  cartModal:          { backgroundColor: '#fff', borderTopLeftRadius: 20,
                        borderTopRightRadius: 20, maxHeight: '80%' },
  cartModalHeader:    { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', padding: 16,
                        borderBottomWidth: 1, borderColor: '#eee' },
  cartModalTitle:     { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  cartCloseBtn:       { fontSize: 20, color: '#7f8c8d', padding: 4 },
  cartList:           { maxHeight: 300, padding: 12 },
  cartItem:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9',
                        borderRadius: 8, padding: 10, marginBottom: 8 },
  cartItemName:       { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  cartItemDetail:     { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  cartItemSubtotal:   { fontSize: 15, fontWeight: 'bold', color: '#27ae60', marginHorizontal: 8 },
  removeBtn:          { padding: 6 },
  removeBtnText:      { fontSize: 18 },
  cartFooter:         { padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  cartTotal:          { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  printBtn:           { backgroundColor: '#c0392b', borderRadius: 10, padding: 16,
                        alignItems: 'center', elevation: 2 },
  printBtnDisabled:   { backgroundColor: '#95a5a6' },
  printBtnText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default WeighingStation;