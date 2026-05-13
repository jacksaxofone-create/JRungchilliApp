import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView, Image
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useAppStore } from '../../store/appStore';
import { tBilingual } from '../../i18n/translations';

interface CartItem {
  product: any;
  quantity_kg: number;
  price_per_kg: number;
  subtotal: number;
}

export const CustomerOrderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { primaryLanguage, secondaryLanguage, currentUser } = useAppStore();
  const [products, setProducts]       = useState<any[]>([]);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [search, setSearch]           = useState('');
  const [orderName, setOrderName]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [placing, setPlacing]         = useState(false);
  const [showCart, setShowCart]       = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qtyInput, setQtyInput]       = useState('0.5');
  const [pickupTime, setPickupTime]   = useState('');
  const [notes, setNotes]             = useState('');

  const t = (key: string) => tBilingual(key, primaryLanguage, secondaryLanguage);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const list = await DatabaseService.getAllProducts();
      setProducts(list);
    } catch (e) {
      Alert.alert('❌', 'โหลดสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const getName = (p: any) => {
    if (primaryLanguage === 'mm') return p.name_mm || p.name_th;
    if (primaryLanguage === 'en') return p.name_en || p.name_th;
    if (primaryLanguage === 'cn') return p.name_cn || p.name_th;
    return p.name_th;
  };

  const getNameSub = (p: any) => {
    if (secondaryLanguage === 'mm') return p.name_mm || '';
    if (secondaryLanguage === 'en') return p.name_en || '';
    if (secondaryLanguage === 'cn') return p.name_cn || '';
    return p.name_en || '';
  };

  const filtered = products.filter(p =>
    p.name_th?.includes(search) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_mm?.includes(search) ||
    p.name_cn?.includes(search)
  );

  const getCartQty = (productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    return item ? item.quantity_kg : 0;
  };

  const openQtyModal = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id);
    setQtyInput(existing ? String(existing.quantity_kg) : '0.5');
    setSelectedProduct(product);
    setShowQtyModal(true);
  };

  const confirmQty = () => {
    const qty = parseFloat(qtyInput);
    if (!qty || qty <= 0) {
      Alert.alert('⚠️', 'กรุณากรอกจำนวนมากกว่า 0');
      return;
    }
    const price = selectedProduct.price_wholesale;
    const newItem: CartItem = {
      product:     selectedProduct,
      quantity_kg: qty,
      price_per_kg: price,
      subtotal:    Math.round(qty * price * 100) / 100,
    };
    setCart(prev => {
      const existing = prev.findIndex(c => c.product.id === selectedProduct.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newItem;
        return updated;
      }
      return [...prev, newItem];
    });
    setShowQtyModal(false);
    setSelectedProduct(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const adjustQty = (delta: number) => {
    const current = parseFloat(qtyInput) || 0;
    const next = Math.max(0.5, Math.round((current + delta) * 10) / 10);
    setQtyInput(String(next));
  };

  const cartTotal   = cart.reduce((s, i) => s + i.subtotal, 0);
  const cartItems   = cart.reduce((s, i) => s + i.quantity_kg, 0);

  const placeOrder = async () => {
    if (cart.length === 0) { Alert.alert('⚠️', 'กรุณาเลือกสินค้าก่อน'); return; }
    if (!currentUser) { Alert.alert('⚠️', 'กรุณาเข้าสู่ระบบใหม่'); return; }

    setPlacing(true);
    try {
      const orderId     = `O${Date.now()}`;
      const orderNumber = `ORD${new Date().toISOString().slice(2,10).replace(/-/g,'')}${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
      const items = cart.map(c => ({
        product_id:   c.product.id,
        product_name: getName(c.product),
        weight_kg:    c.quantity_kg,
        price_per_kg: c.price_per_kg,
        quantity:     c.quantity_kg,
        unit:         'kg',
        subtotal:     c.subtotal,
      }));
      const order = {
        id:             orderId,
        order_number:   orderNumber,
        customer_id:    currentUser.id,
        customer_name:  currentUser.name_th || currentUser.name_en || 'ลูกค้า',
        order_name:     orderName.trim() || null,
        order_type:     'wholesale',
        status:         'pending',
        payment_status: 'unpaid',
        total_amount:   cartTotal,
        notes:          notes.trim(),
        pickup_time:    pickupTime.trim(),
        created_at:     new Date().toISOString(),
      };
      await DatabaseService.saveOrder(order, items);
      Alert.alert(
        '✅ สั่งสินค้าสำเร็จ!',
        `เลขออเดอร์: #${orderNumber}\nรวม: ฿${cartTotal.toFixed(2)}\n\nร้านจะติดต่อกลับเร็วๆ นี้`,
        [{ text: 'OK', onPress: () => { setCart([]); setOrderName(''); setNotes(''); setPickupTime(''); setShowCart(false); } }]
      );
    } catch (e) {
      Alert.alert('❌ ผิดพลาด', 'สั่งสินค้าไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPlacing(false);
    }
  };

  /* ── QTY MODAL ── */
  const renderQtyModal = () => (
    <Modal visible={showQtyModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.qtyModal}>
          <Text style={styles.qtyModalTitle}>
            {selectedProduct ? getName(selectedProduct) : ''}
          </Text>
          {selectedProduct?.image_uri ? (
            <Image source={{ uri: selectedProduct.image_uri }} style={styles.qtyModalImage} />
          ) : (
            <Text style={styles.qtyModalIcon}>🌶️</Text>
          )}
          <Text style={styles.qtyModalPrice}>
            ฿{selectedProduct?.price_wholesale} / กก.
          </Text>

          <View style={styles.qtyControls}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(-0.5)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInputField}
              value={qtyInput}
              onChangeText={setQtyInput}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(0.5)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.qtyUnit}>กก. / kg</Text>

          {/* Quick qty buttons */}
          <View style={styles.quickRow}>
            {['0.5','1','1.5','2','3','5'].map(q => (
              <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => setQtyInput(q)}>
                <Text style={styles.quickBtnText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {qtyInput && !isNaN(parseFloat(qtyInput)) && parseFloat(qtyInput) > 0 && (
            <Text style={styles.qtySubtotal}>
              รวม: ฿{(parseFloat(qtyInput) * (selectedProduct?.price_wholesale || 0)).toFixed(2)}
            </Text>
          )}

          <View style={styles.qtyModalBtns}>
            <TouchableOpacity
              style={styles.qtyCancelBtn}
              onPress={() => { setShowQtyModal(false); setSelectedProduct(null); }}
            >
              <Text style={styles.qtyCancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qtyConfirmBtn} onPress={confirmQty}>
              <Text style={styles.qtyConfirmText}>✅ เพิ่มลงตะกร้า</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* ── CART MODAL ── */
  const renderCartModal = () => (
    <Modal visible={showCart} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.cartModal}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>🛒 ตะกร้าสินค้า / Cart</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Text style={styles.cartClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Order Name */}
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionLabel}>📝 ชื่อผู้สั่ง / Order Name</Text>
            <TextInput
              style={styles.cartInput}
              value={orderName}
              onChangeText={setOrderName}
              placeholder="ระบุชื่อผู้สั่ง หรือรหัสออเดอร์"
            />
          </View>

          {/* Cart Items */}
          <ScrollView style={styles.cartItemList}>
            {cart.map((item, idx) => (
              <View key={idx} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{getName(item.product)}</Text>
                  <Text style={styles.cartItemSub}>
                    {item.quantity_kg} กก. × ฿{item.price_per_kg}/กก.
                  </Text>
                </View>
                <Text style={styles.cartItemTotal}>฿{item.subtotal.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => openQtyModal(item.product)} style={styles.cartEditBtn}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.cartRemoveBtn}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Pickup Time */}
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionLabel}>🕐 เวลารับสินค้า / Pickup Time</Text>
            <TextInput
              style={styles.cartInput}
              value={pickupTime}
              onChangeText={setPickupTime}
              placeholder="เช่น 09:00, พรุ่งนี้เช้า"
            />
          </View>

          {/* Notes */}
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionLabel}>📋 หมายเหตุ / Notes</Text>
            <TextInput
              style={[styles.cartInput, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="หมายเหตุเพิ่มเติม"
              multiline
            />
          </View>

          {/* Footer */}
          <View style={styles.cartFooter}>
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>รวมทั้งหมด / Total</Text>
              <Text style={styles.cartTotalValue}>฿{cartTotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.cartTotalSub}>
              {cart.length} รายการ · {cartItems.toFixed(1)} กก.
            </Text>
            <TouchableOpacity
              style={[styles.placeOrderBtn, placing && styles.placeOrderBtnDisabled]}
              onPress={placeOrder}
              disabled={placing}
            >
              {placing
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.placeOrderBtnText}>✅ ยืนยันสั่งสินค้า / Confirm Order</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛍️ สั่งสินค้า / Order</Text>
          {currentUser && (
            <Text style={styles.headerShop}>🏪 {currentUser.name_th || currentUser.name_en}</Text>
          )}
        </View>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.cartBadge} onPress={() => setShowCart(true)}>
            <Text style={styles.cartBadgeText}>🛒 {cart.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Order Name Input (top of catalog) */}
      <View style={styles.orderNameBar}>
        <Text style={styles.orderNameLabel}>📝 ชื่อออเดอร์:</Text>
        <TextInput
          style={styles.orderNameInput}
          value={orderName}
          onChangeText={setOrderName}
          placeholder="ระบุชื่อผู้สั่ง / รหัสออเดอร์ (ถ้ามี)"
        />
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchBox}
        value={search}
        onChangeText={setSearch}
        placeholder="🔍 ค้นหาสินค้า / Search..."
        clearButtonMode="while-editing"
      />

      {/* Product Catalog */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.catalogContent}
        renderItem={({ item }) => {
          const qty = getCartQty(item.id);
          const inCart = qty > 0;
          return (
            <TouchableOpacity
              style={[styles.catalogCard, inCart && styles.catalogCardActive]}
              onPress={() => openQtyModal(item)}
              activeOpacity={0.85}
            >
              {item.image_uri ? (
                <Image source={{ uri: item.image_uri }} style={styles.catalogImage} resizeMode="cover" />
              ) : (
                <View style={styles.catalogImageEmpty}>
                  <Text style={styles.catalogImageIcon}>🌶️</Text>
                </View>
              )}
              <View style={styles.catalogInfo}>
                <Text style={styles.catalogName} numberOfLines={1}>{getName(item)}</Text>
                <Text style={styles.catalogNameSub} numberOfLines={1}>{getNameSub(item)}</Text>
                <Text style={styles.catalogPrice}>฿{item.price_wholesale} / กก.</Text>
              </View>
              {inCart ? (
                <View style={styles.inCartBadge}>
                  <Text style={styles.inCartText}>{qty} กก.</Text>
                </View>
              ) : (
                <View style={styles.addIcon}>
                  <Text style={styles.addIconText}>＋</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>ไม่พบสินค้า / No products</Text>
          </View>
        }
      />

      {/* FAB Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCart(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>🛒 {cart.length} รายการ · ฿{cartTotal.toFixed(2)}</Text>
          <Text style={styles.fabSub}>แตะเพื่อยืนยันออเดอร์ / Tap to confirm</Text>
        </TouchableOpacity>
      )}

      {renderQtyModal()}
      {renderCartModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  loadingBox:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:        { marginTop: 12, color: '#7f8c8d', fontSize: 15 },
  header:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b',
                        padding: 12, gap: 8 },
  backBtn:            { padding: 4 },
  backText:           { color: '#fff', fontSize: 15 },
  headerCenter:       { flex: 1 },
  headerTitle:        { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  headerShop:         { color: '#ffcccc', fontSize: 12, marginTop: 2 },
  cartBadge:          { backgroundColor: '#fff', borderRadius: 16,
                        paddingHorizontal: 12, paddingVertical: 4 },
  cartBadgeText:      { color: '#c0392b', fontWeight: 'bold', fontSize: 14 },
  orderNameBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                        paddingHorizontal: 12, paddingVertical: 8, gap: 8, elevation: 1 },
  orderNameLabel:     { fontSize: 13, color: '#7f8c8d', whiteSpace: 'nowrap' },
  orderNameInput:     { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
                        paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  searchBox:          { backgroundColor: '#fff', margin: 10, borderRadius: 10,
                        padding: 10, fontSize: 15, elevation: 1 },
  catalogContent:     { padding: 8, paddingBottom: 100 },
  catalogCard:        { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 12,
                        overflow: 'hidden', elevation: 2 },
  catalogCardActive:  { borderWidth: 2, borderColor: '#27ae60' },
  catalogImage:       { width: '100%', height: 110 },
  catalogImageEmpty:  { width: '100%', height: 110, backgroundColor: '#fdecea',
                        justifyContent: 'center', alignItems: 'center' },
  catalogImageIcon:   { fontSize: 40 },
  catalogInfo:        { padding: 8 },
  catalogName:        { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  catalogNameSub:     { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  catalogPrice:       { fontSize: 14, fontWeight: 'bold', color: '#c0392b', marginTop: 4 },
  inCartBadge:        { position: 'absolute', top: 8, right: 8, backgroundColor: '#27ae60',
                        borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  inCartText:         { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  addIcon:            { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)',
                        borderRadius: 12, width: 26, height: 26,
                        justifyContent: 'center', alignItems: 'center' },
  addIconText:        { color: '#fff', fontSize: 18, lineHeight: 22 },
  emptyBox:           { alignItems: 'center', padding: 48 },
  emptyIcon:          { fontSize: 48 },
  emptyText:          { fontSize: 16, color: '#7f8c8d', marginTop: 8 },
  fab:                { position: 'absolute', bottom: 20, left: 16, right: 16,
                        backgroundColor: '#c0392b', borderRadius: 14,
                        padding: 16, alignItems: 'center', elevation: 8 },
  fabText:            { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  fabSub:             { color: '#ffcccc', fontSize: 12, marginTop: 2 },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center', alignItems: 'center' },
  qtyModal:           { backgroundColor: '#fff', borderRadius: 16, padding: 20,
                        width: '85%', alignItems: 'center' },
  qtyModalTitle:      { fontSize: 17, fontWeight: 'bold', color: '#2c3e50',
                        textAlign: 'center', marginBottom: 8 },
  qtyModalImage:      { width: 90, height: 90, borderRadius: 12, marginBottom: 8 },
  qtyModalIcon:       { fontSize: 48, marginBottom: 8 },
  qtyModalPrice:      { fontSize: 15, color: '#c0392b', fontWeight: '600', marginBottom: 12 },
  qtyControls:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn:             { width: 44, height: 44, borderRadius: 22, backgroundColor: '#c0392b',
                        justifyContent: 'center', alignItems: 'center' },
  qtyBtnText:         { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  qtyInputField:      { width: 90, textAlign: 'center', fontSize: 28, fontWeight: 'bold',
                        color: '#2c3e50', borderBottomWidth: 2, borderColor: '#c0392b',
                        paddingBottom: 4 },
  qtyUnit:            { fontSize: 13, color: '#7f8c8d', marginTop: 4, marginBottom: 10 },
  quickRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6,
                        justifyContent: 'center', marginBottom: 10 },
  quickBtn:           { backgroundColor: '#ecf0f1', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 6 },
  quickBtnText:       { fontSize: 13, color: '#2c3e50', fontWeight: '600' },
  qtySubtotal:        { fontSize: 18, fontWeight: 'bold', color: '#27ae60', marginBottom: 12 },
  qtyModalBtns:       { flexDirection: 'row', gap: 10, width: '100%' },
  qtyCancelBtn:       { flex: 1, backgroundColor: '#ecf0f1', borderRadius: 10,
                        padding: 12, alignItems: 'center' },
  qtyCancelText:      { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  qtyConfirmBtn:      { flex: 2, backgroundColor: '#27ae60', borderRadius: 10,
                        padding: 12, alignItems: 'center' },
  qtyConfirmText:     { fontSize: 15, color: '#fff', fontWeight: 'bold' },
  cartModal:          { backgroundColor: '#fff', borderTopLeftRadius: 20,
                        borderTopRightRadius: 20, maxHeight: '90%', width: '100%',
                        position: 'absolute', bottom: 0 },
  cartHeader:         { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', padding: 16,
                        borderBottomWidth: 1, borderColor: '#eee' },
  cartTitle:          { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  cartClose:          { fontSize: 20, color: '#7f8c8d', padding: 4 },
  cartSection:        { paddingHorizontal: 16, paddingTop: 10 },
  cartSectionLabel:   { fontSize: 12, color: '#7f8c8d', marginBottom: 4 },
  cartInput:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
                        padding: 10, fontSize: 14, backgroundColor: '#fafafa' },
  cartItemList:       { maxHeight: 220, paddingHorizontal: 16, marginTop: 10 },
  cartItem:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9',
                        borderRadius: 8, padding: 10, marginBottom: 6, gap: 6 },
  cartItemName:       { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  cartItemSub:        { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  cartItemTotal:      { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  cartEditBtn:        { padding: 6 },
  cartRemoveBtn:      { padding: 6 },
  cartFooter:         { padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  cartTotalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTotalLabel:     { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  cartTotalValue:     { fontSize: 24, fontWeight: 'bold', color: '#c0392b' },
  cartTotalSub:       { fontSize: 12, color: '#7f8c8d', marginTop: 2, marginBottom: 12 },
  placeOrderBtn:      { backgroundColor: '#c0392b', borderRadius: 12,
                        padding: 16, alignItems: 'center', elevation: 3 },
  placeOrderBtnDisabled: { backgroundColor: '#95a5a6' },
  placeOrderBtnText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default CustomerOrderScreen;