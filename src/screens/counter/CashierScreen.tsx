import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DatabaseService } from '../../services/database';
import { LanguageToggle } from '../../components/LanguageToggle';
import { tSingle } from '../../i18n/translations';
import { Product, Order, OrderItem, PaymentMethod } from '../../types';

interface CartItem {
  product: Product;
  quantity_kg: number;
  unit_price: number;
  price_type: 'retail' | 'wholesale';
}

export const CashierScreen: React.FC = () => {
  const { secondaryLanguage, products, setProducts, addOrder } = useAppStore();
  const t = (key: any) => tSingle(key, secondaryLanguage);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showPayModal, setShowPayModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputQty, setInputQty] = useState('');
  const [inputPriceType, setInputPriceType] = useState<'retail' | 'wholesale'>('retail');

  useEffect(() => {
    DatabaseService.getAllProducts().then(setProducts);
  }, [setProducts]);

  const filtered = products.filter(p =>
    p.name_th.includes(search) ||
    p.name_en.toLowerCase().includes(search.toLowerCase()),
  );

  const subtotal = cart.reduce((sum, item) => sum + item.quantity_kg * item.unit_price, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = (parseFloat(cashReceived) || 0) - total;

  const openQtyModal = (product: Product) => {
    setSelectedProduct(product);
    setInputQty('');
    setInputPriceType('retail');
    setShowQtyModal(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const qty = parseFloat(inputQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่น้ำหนักให้ถูกต้อง');
      return;
    }
    const unitPrice =
      inputPriceType === 'retail'
        ? selectedProduct.price_retail
        : selectedProduct.price_wholesale;

    const existingIndex = cart.findIndex(
      c => c.product.id === selectedProduct.id && c.price_type === inputPriceType,
    );
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity_kg += qty;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          product: selectedProduct,
          quantity_kg: qty,
          unit_price: unitPrice,
          price_type: inputPriceType,
        },
      ]);
    }
    setShowQtyModal(false);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาเพิ่มสินค้าในรายการก่อน');
      return;
    }
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      if (received < total) {
        Alert.alert('แจ้งเตือน', `รับเงินไม่พอ\nยอดรวม ฿${total.toFixed(2)}\nรับมา ฿${received.toFixed(2)}`);
        return;
      }
    }
    setProcessing(true);
    try {
      const orderId = `ord_${Date.now()}`;
      const orderNumber = `JRC${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const items: OrderItem[] = cart.map((item, i) => ({
        id: `item_${Date.now()}_${i}`,
        order_id: orderId,
        product_id: item.product.id,
        product_name_th: item.product.name_th,
        product_name_mm: item.product.name_mm,
        product_name_en: item.product.name_en,
        product_name_cn: item.product.name_cn,
        quantity_kg: item.quantity_kg,
        unit_price: item.unit_price,
        total_price: item.quantity_kg * item.unit_price,
        is_packed: false,
      }));

      const order: Order = {
        id: orderId,
        order_number: orderNumber,
        customer_name: customerName || 'ลูกค้าทั่วไป',
        customer_phone: customerPhone,
        items,
        subtotal,
        discount: discountAmount,
        total,
        payment_method: paymentMethod,
        payment_status: 'paid',
        status: 'pending',
        notes,
        created_at: now,
        updated_at: now,
        is_synced: false,
      };

      await DatabaseService.saveOrder(order);
      addOrder(order);

      setProcessing(false);
      setShowPayModal(false);

      Alert.alert(
        '✅ ชำระเงินสำเร็จ',
        `ออเดอร์: ${orderNumber}\nยอดรวม: ฿${total.toFixed(2)}${
          paymentMethod === 'cash'
            ? `\nรับมา: ฿${parseFloat(cashReceived).toFixed(2)}\nเงินทอน: ฿${change.toFixed(2)}`
            : '\nโอนเงินเรียบร้อย'
        }`,
        [{ text: 'ตกลง', onPress: resetCart }],
      );
    } catch (e) {
      setProcessing(false);
      Alert.alert('❌ ผิดพลาด', 'บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const resetCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount('0');
    setCashReceived('');
    setNotes('');
    setPaymentMethod('cash');
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.product.name_th}</Text>
        <Text style={styles.cartItemDetail}>
          {item.quantity_kg.toFixed(3)} กก. × ฿{item.unit_price} =
          <Text style={styles.cartItemTotal}>
            {' '}฿{(item.quantity_kg * item.unit_price).toFixed(2)}
          </Text>
        </Text>
        <Text style={styles.cartItemPriceType}>
          {item.price_type === 'retail' ? '🏪 ราคาปลีก' : '🏭 ราคาส่ง'}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(index)}>
        <Text style={styles.removeBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => openQtyModal(item)}>
      <View style={styles.productItemInfo}>
        <Text style={styles.productItemName}>{item.name_th}</Text>
        <Text style={styles.productItemSub}>
          {secondaryLanguage === 'mm' && item.name_mm}
          {secondaryLanguage === 'en' && item.name_en}
          {secondaryLanguage === 'cn' && item.name_cn}
        </Text>
      </View>
      <View style={styles.productItemPrice}>
        <Text style={styles.priceRetail}>฿{item.price_retail}</Text>
        <Text style={styles.priceUnit}>/กก.</Text>
      </View>
      <View style={styles.addToCartBtn}>
        <Text style={styles.addToCartText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 แคชเชียร์</Text>
          <Text style={styles.headerSub}>Cashier | {t('cashier')}</Text>
        </View>
        <LanguageToggle />
      </View>

      <View style={styles.body}>
        {/* LEFT – รายการสินค้า */}
        <View style={styles.leftPanel}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 ค้นหาสินค้า..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderProductItem}
            contentContainerStyle={{ gap: 6, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* RIGHT – ตะกร้า */}
        <View style={styles.rightPanel}>
          <Text style={styles.cartTitle}>🛒 รายการ ({cart.length})</Text>

          {/* ชื่อลูกค้า */}
          <TextInput
            style={styles.customerInput}
            placeholder="👤 ชื่อลูกค้า"
            value={customerName}
            onChangeText={setCustomerName}
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.customerInput}
            placeholder="📞 เบอร์โทร"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />

          {/* รายการในตะกร้า */}
          <FlatList
            data={cart}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderCartItem}
            contentContainerStyle={{ gap: 6 }}
            style={styles.cartList}
            ListEmptyComponent={
              <Text style={styles.emptyCart}>ยังไม่มีสินค้า{'\n'}แตะสินค้าทางซ้ายเพื่อเพิ่ม</Text>
            }
          />

          {/* ส่วนลด */}
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>ส่วนลด (฿)</Text>
            <TextInput
              style={styles.discountInput}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* สรุปยอด */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ยอดรวม</Text>
              <Text style={styles.summaryValue}>฿{subtotal.toFixed(2)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ส่วนลด</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  -฿{discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>ยอดสุทธิ</Text>
              <Text style={styles.totalValue}>฿{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* ปุ่มชำระเงิน */}
          <TouchableOpacity
            style={[styles.checkoutBtn, cart.length === 0 && styles.checkoutBtnDisabled]}
            onPress={() => setShowPayModal(true)}
            disabled={cart.length === 0}>
            <Text style={styles.checkoutBtnText}>💳 ชำระเงิน ฿{total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal ใส่จำนวน */}
      <Modal visible={showQtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qtyModalBox}>
            <Text style={styles.qtyModalTitle}>
              {selectedProduct?.name_th}
            </Text>
            <Text style={styles.qtyModalSub}>ใส่น้ำหนัก (กิโลกรัม)</Text>

            {/* ประเภทราคา */}
            <View style={styles.priceTypeRow}>
              <TouchableOpacity
                style={[styles.priceTypeBtn, inputPriceType === 'retail' && styles.priceTypeBtnActive]}
                onPress={() => setInputPriceType('retail')}>
                <Text style={[styles.priceTypeTxt, inputPriceType === 'retail' && styles.priceTypeTxtActive]}>
                  ปลีก ฿{selectedProduct?.price_retail}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceTypeBtn, inputPriceType === 'wholesale' && styles.priceTypeBtnActive]}
                onPress={() => setInputPriceType('wholesale')}>
                <Text style={[styles.priceTypeTxt, inputPriceType === 'wholesale' && styles.priceTypeTxtActive]}>
                  ส่ง ฿{selectedProduct?.price_wholesale}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.qtyInput}
              value={inputQty}
              onChangeText={setInputQty}
              keyboardType="decimal-pad"
              placeholder="0.000"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {inputQty && selectedProduct && (
              <Text style={styles.qtyPreview}>
                = ฿{((parseFloat(inputQty) || 0) * (inputPriceType === 'retail' ? selectedProduct.price_retail : selectedProduct.price_wholesale)).toFixed(2)}
              </Text>
            )}

            <View style={styles.qtyBtns}>
              <TouchableOpacity style={styles.qtyCancelBtn} onPress={() => setShowQtyModal(false)}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qtyConfirmBtn} onPress={addToCart}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>➕ เพิ่มลงตะกร้า</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ชำระเงิน */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.payModalBox}>
            <Text style={styles.payModalTitle}>💳 ชำระเงิน</Text>
            <Text style={styles.payModalTotal}>฿{total.toFixed(2)}</Text>

            {/* วิธีชำระ */}
            <View style={styles.payMethodRow}>
              <TouchableOpacity
                style={[styles.payMethodBtn, paymentMethod === 'cash' && styles.payMethodBtnActive]}
                onPress={() => setPaymentMethod('cash')}>
                <Text style={styles.payMethodIcon}>💵</Text>
                <Text style={[styles.payMethodTxt, paymentMethod === 'cash' && styles.payMethodTxtActive]}>
                  เงินสด
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.payMethodBtn, paymentMethod === 'transfer' && styles.payMethodBtnActive]}
                onPress={() => setPaymentMethod('transfer')}>
                <Text style={styles.payMethodIcon}>📱</Text>
                <Text style={[styles.payMethodTxt, paymentMethod === 'transfer' && styles.payMethodTxtActive]}>
                  โอนเงิน
                </Text>
              </TouchableOpacity>
            </View>

            {/* เงินสด – รับมา/ทอน */}
            {paymentMethod === 'cash' && (
              <View>
                <Text style={styles.fieldLabel}>รับเงินมา (฿)</Text>
                <TextInput
                  style={styles.cashInput}
                  value={cashReceived}
                  onChangeText={setCashReceived}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  autoFocus
                />
                {parseFloat(cashReceived) >= total && (
                  <View style={styles.changeBox}>
                    <Text style={styles.changeLabel}>เงินทอน</Text>
                    <Text style={styles.changeValue}>฿{change.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* โอนเงิน */}
            {paymentMethod === 'transfer' && (
              <View style={styles.transferBox}>
                <Text style={styles.transferText}>📲 แจ้งลูกค้าโอนเงิน</Text>
                <Text style={styles.transferAmount}>฿{total.toFixed(2)}</Text>
                <Text style={styles.transferNote}>ตรวจสอบสลิปก่อนกดยืนยัน</Text>
              </View>
            )}

            {/* หมายเหตุ */}
            <Text style={styles.fieldLabel}>หมายเหตุ</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="หมายเหตุออเดอร์ (ถ้ามี)"
              placeholderTextColor="#9ca3af"
            />

            {/* ปุ่ม */}
            <View style={styles.payBtns}>
              <TouchableOpacity
                style={styles.payCancelBtn}
                onPress={() => setShowPayModal(false)}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.payConfirmBtn, processing && { opacity: 0.6 }]}
                onPress={handleCheckout}
                disabled={processing}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {processing ? 'กำลังบันทึก...' : '✅ ยืนยันชำระเงิน'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffbeb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#92400e',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#fde68a', marginTop: 2 },
  body: { flex: 1, flexDirection: 'row' },
  leftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 10,
  },
  rightPanel: {
    width: 320,
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 8,
  },
  productItemInfo: { flex: 1 },
  productItemName: { fontSize: 14, fontWeight: '600', color: '#78350f' },
  productItemSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  productItemPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceRetail: { fontSize: 16, fontWeight: '700', color: '#92400e' },
  priceUnit: { fontSize: 11, color: '#9ca3af' },
  addToCartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#92400e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 28 },
  cartTitle: { fontSize: 15, fontWeight: '700', color: '#78350f', marginBottom: 8 },
  customerInput: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#fde68a',
    color: '#111827',
    marginBottom: 6,
  },
  cartList: { flex: 1, marginVertical: 8 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fef9f0',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#78350f' },
  cartItemDetail: { fontSize: 12, color: '#374151', marginTop: 2 },
  cartItemTotal: { fontWeight: '700', color: '#92400e' },
  cartItemPriceType: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 18 },
  emptyCart: { textAlign: 'center', color: '#9ca3af', paddingVertical: 24, lineHeight: 24 },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discountLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  discountInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: 90,
    textAlign: 'right',
    color: '#111827',
  },
  summaryBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#374151' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#78350f' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#92400e' },
  checkoutBtn: {
    backgroundColor: '#92400e',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnDisabled: { backgroundColor: '#9ca3af' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qtyModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  qtyModalTitle: { fontSize: 18, fontWeight: '800', color: '#78350f', marginBottom: 4 },
  qtyModalSub: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  priceTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priceTypeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priceTypeBtnActive: { backgroundColor: '#92400e', borderColor: '#92400e' },
  priceTypeTxt: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  priceTypeTxtActive: { color: '#fff' },
  qtyInput: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#fde68a',
    color: '#78350f',
  },
  qtyPreview: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 8,
  },
  qtyBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  qtyCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  qtyConfirmBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#92400e',
    alignItems: 'center',
  },
  payModalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  payModalTitle: { fontSize: 20, fontWeight: '800', color: '#78350f', marginBottom: 4 },
  payModalTotal: {
    fontSize: 36,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 16,
  },
  payMethodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  payMethodBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  payMethodBtnActive: { backgroundColor: '#fef3c7', borderColor: '#92400e' },
  payMethodIcon: { fontSize: 24 },
  payMethodTxt: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  payMethodTxtActive: { color: '#92400e' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  cashInput: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#fde68a',
    color: '#78350f',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  changeLabel: { fontSize: 16, fontWeight: '700', color: '#14532d' },
  changeValue: { fontSize: 24, fontWeight: '800', color: '#15803d' },
  transferBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  transferText: { fontSize: 14, color: '#1e40af', fontWeight: '600' },
  transferAmount: { fontSize: 32, fontWeight: '800', color: '#1e40af', marginVertical: 4 },
  transferNote: { fontSize: 12, color: '#6b7280' },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
    marginBottom: 16,
  },
  payBtns: { flexDirection: 'row', gap: 10 },
  payCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  payConfirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#92400e',
    alignItems: 'center',
  },
});
