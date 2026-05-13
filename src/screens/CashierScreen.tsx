import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, FlatList, Modal, Alert, ActivityIndicator
} from 'react-native';
import { DatabaseService } from '../services/database';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  weight: number;
  unit_price: number;
  subtotal: number;
}

export default function CashierScreen({ navigation, onLogout }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [manualWeight, setManualWeight] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orderDone, setOrderDone] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [stickerProduct, setStickerProduct] = useState<any>(null);
  const [stickerWeight, setStickerWeight] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getCustomers(),
      ]);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name_th.includes(searchText) ||
    (p.name_en || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const getWeight = () => parseFloat(manualWeight) || 0;

  const getPreviewTotal = () => {
    if (!selectedProduct) return 0;
    return Math.round(getWeight() * selectedProduct.retail_price * 100) / 100;
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(prev => prev?.id === product.id ? null : product);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) { Alert.alert('แจ้งเตือน', 'กรุณาเลือกสินค้าก่อน'); return; }
    const w = getWeight();
    if (w <= 0) { Alert.alert('แจ้งเตือน', 'กรุณากรอกน้ำหนัก'); return; }
    const newItem: CartItem = {
      id: Date.now(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name_th,
      weight: w,
      unit_price: selectedProduct.retail_price,
      subtotal: Math.round(w * selectedProduct.retail_price * 100) / 100,
    };
    setCart(prev => [...prev, newItem]);
    setManualWeight('');
    setSelectedProduct(null);
  };

  const handlePrintSticker = () => {
    if (!selectedProduct) { Alert.alert('แจ้งเตือน', 'กรุณาเลือกสินค้าก่อน'); return; }
    const w = getWeight();
    if (w <= 0) { Alert.alert('แจ้งเตือน', 'กรุณากรอกน้ำหนัก'); return; }
    setStickerProduct(selectedProduct);
    setStickerWeight(w);
    setShowStickerModal(true);
  };

  const handleRemoveFromCart = (id: number) => {
    Alert.alert('ลบรายการ', 'ต้องการลบรายการนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => setCart(prev => prev.filter(i => i.id !== id)) },
    ]);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    Alert.alert('ล้างรายการ', 'ต้องการล้างรายการทั้งหมด?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ล้าง', style: 'destructive', onPress: () => setCart([]) },
    ]);
  };

  const totalAmount = cart.reduce((s, i) => s + i.subtotal, 0);
  const cashAmount = parseFloat(cashInput) || 0;
  const changeAmount = cashAmount - totalAmount;

  const openPayModal = () => {
    if (cart.length === 0) { Alert.alert('แจ้งเตือน', 'ยังไม่มีสินค้าในบิล'); return; }
    setCashInput('');
    setSelectedCustomer(null);
    setShowPayModal(true);
  };

  const handleConfirmPayment = async () => {
    if (cashAmount < totalAmount) { Alert.alert('แจ้งเตือน', 'รับเงินไม่พอ'); return; }
    setSaving(true);
    try {
      const orderId = await DatabaseService.createOrder({
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name_th || 'ลูกค้าทั่วไป',
        order_type: 'retail',
        status: 'completed',
        total_amount: totalAmount,
        notes: `รับเงิน ฿${cashAmount} ทอน ฿${changeAmount.toFixed(2)}`,
      });
      for (const item of cart) {
        await DatabaseService.addOrderItem({
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.weight,
          unit: 'kg',
          unit_price: item.unit_price,
          total_price: item.subtotal,
        });
      }
      setLastOrderId(orderId);
      setShowPayModal(false);
      setOrderDone(true);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการขายได้');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBill = () => {
    setCart([]);
    setOrderDone(false);
    setLastOrderId(null);
    setSelectedProduct(null);
    setManualWeight('');
  };

  const formatMoney = (n: number) => `฿${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── ORDER DONE ──
  if (orderDone) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✅ ชำระเงินสำเร็จ</Text>
        </View>
        <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>ชำระเงินเรียบร้อย!</Text>
            <Text style={styles.successSub}>บิล #{lastOrderId}</Text>
            <View style={styles.divider} />
            {cart.map((item, i) => (
              <View key={i} style={styles.receiptRow}>
                <Text style={styles.receiptItem}>{item.product_name}</Text>
                <Text style={styles.receiptQty}>{item.weight.toFixed(3)} kg</Text>
                <Text style={styles.receiptPrice}>{formatMoney(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>รวม</Text>
              <Text style={styles.receiptTotalValue}>{formatMoney(totalAmount)}</Text>
            </View>
            <View style={styles.receiptTotalRow}>
              <Text style={[styles.receiptTotalLabel, { fontSize: 14, color: '#888' }]}>รับเงิน</Text>
              <Text style={[styles.receiptTotalValue, { fontSize: 18, color: '#2980b9' }]}>{formatMoney(cashAmount)}</Text>
            </View>
            <View style={[styles.changeBox, { marginTop: 12 }]}>
              <Text style={styles.changeLabel}>เงินทอน</Text>
              <Text style={styles.changeValue}>{formatMoney(changeAmount)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.printReceiptBtn}>
            <Text style={styles.printReceiptBtnText}>🖨️ พิมพ์ใบเสร็จ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBillBtn} onPress={handleNewBill}>
            <Text style={styles.newBillBtnText}>+ บิลใหม่</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onLogout}>
            <Text style={styles.homeBtnText}>🏠 กลับหน้าหลัก</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout} style={styles.backBtn}>
          <Text style={styles.backText}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌶️ PepperPOS</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>💵 {formatMoney(totalAmount)}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Weight Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚖️ กรอกน้ำหนัก (กิโลกรัม)</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              value={manualWeight}
              onChangeText={setManualWeight}
              placeholder="0.000"
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={styles.clearWeightBtn}
              onPress={() => { setManualWeight(''); setSelectedProduct(null); }}
            >
              <Text style={styles.clearWeightText}>✖</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌶️ เลือกสินค้า</Text>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="🔍 ค้นหาสินค้า..."
          />
          <View style={styles.productGrid}>
            {filteredProducts.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.productBtn, selectedProduct?.id === p.id && styles.productBtnActive]}
                onPress={() => handleSelectProduct(p)}
              >
                <Text style={styles.productName}>{p.name_th}</Text>
                <Text style={styles.productPrice}>฿{p.retail_price}/kg</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Preview */}
        {selectedProduct && getWeight() > 0 && (
          <View style={styles.pricePreview}>
            <Text style={styles.priceFormula}>
              {selectedProduct.name_th}  {getWeight().toFixed(3)} kg × ฿{selectedProduct.retail_price}/kg
            </Text>
            <Text style={styles.priceTotal}>{formatMoney(getPreviewTotal())}</Text>
            <View style={styles.previewBtnRow}>
              <TouchableOpacity style={[styles.previewBtn, { backgroundColor: '#c0392b' }]} onPress={handleAddToCart}>
                <Text style={styles.previewBtnText}>➕ เพิ่มในบิล</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewBtn, { backgroundColor: '#8e44ad' }]} onPress={handlePrintSticker}>
                <Text style={styles.previewBtnText}>🏷️ พิมพ์สติ๊กเกอร์</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cart */}
        <View style={styles.card}>
          <View style={styles.cartHeader}>
            <Text style={styles.cardTitle}>🛒 รายการในบิล</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length} รายการ</Text>
            </View>
          </View>
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>ยังไม่มีรายการ{'\n'}เลือกสินค้าและกด "เพิ่มในบิล"</Text>
            </View>
          ) : (
            cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.product_name}</Text>
                  <Text style={styles.cartItemDetail}>
                    {item.weight.toFixed(3)} kg × ฿{item.unit_price}/kg
                  </Text>
                </View>
                <Text style={styles.cartItemAmount}>{formatMoney(item.subtotal)}</Text>
                <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} style={styles.cartDelBtn}>
                  <Text style={styles.cartDelText}>✖</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTotal}>{formatMoney(totalAmount)}</Text>
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart}>
            <Text style={styles.clearBtnText}>🗑️ ล้าง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={openPayModal}>
            <Text style={styles.payBtnText}>💵 ชำระเงิน</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PAY MODAL */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💵 ชำระเงิน</Text>

            <Text style={styles.modalLabel}>ลูกค้า (ไม่บังคับ)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.custChip, !selectedCustomer && styles.custChipActive]}
                onPress={() => setSelectedCustomer(null)}
              >
                <Text style={[styles.custChipText, !selectedCustomer && styles.custChipTextActive]}>
                  ทั่วไป
                </Text>
              </TouchableOpacity>
              {customers.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.custChip, selectedCustomer?.id === c.id && styles.custChipActive]}
                  onPress={() => setSelectedCustomer(c)}
                >
                  <Text style={[styles.custChipText, selectedCustomer?.id === c.id && styles.custChipTextActive]}>
                    {c.name_th}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>ยอดรวม:</Text>
              <Text style={styles.modalTotalValue}>{formatMoney(totalAmount)}</Text>
            </View>

            <Text style={styles.modalLabel}>รับเงินมา (บาท)</Text>
            <TextInput
              style={styles.cashInputField}
              value={cashInput}
              onChangeText={setCashInput}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />

            {/* Quick Cash */}
            <View style={styles.quickCash}>
              {[20, 50, 100, 500, 1000].map(v => (
                <TouchableOpacity
                  key={v}
                  style={styles.quickBtn}
                  onPress={() => setCashInput(v.toString())}
                >
                  <Text style={styles.quickBtnText}>฿{v}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => setCashInput(totalAmount.toFixed(2))}
              >
                <Text style={styles.quickBtnText}>พอดี</Text>
              </TouchableOpacity>
            </View>

            {/* Change */}
            <View style={[styles.changeBox, { marginBottom: 16 }]}>
              <Text style={styles.changeLabel}>เงินทอน</Text>
              <Text style={[styles.changeValue, { color: changeAmount >= 0 ? '#27ae60' : '#e74c3c' }]}>
                {formatMoney(changeAmount >= 0 ? changeAmount : 0)}
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPayModal(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, saving && { backgroundColor: '#ccc' }]}
                onPress={handleConfirmPayment}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>✅ ยืนยันชำระเงิน</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STICKER MODAL */}
      <Modal visible={showStickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🏷️ ตัวอย่างสติ๊กเกอร์</Text>
            <View style={styles.stickerPreview}>
              <Text style={styles.stickerShop}>🌶️ จ.รุ่งชิลลี่</Text>
              <View style={styles.stickerDivider} />
              <Text style={styles.stickerProductName}>{stickerProduct?.name_th}</Text>
              <Text style={styles.stickerDetail}>น้ำหนัก: {stickerWeight.toFixed(3)} กก.</Text>
              <Text style={styles.stickerDetail}>ราคา: ฿{stickerProduct?.retail_price}/kg</Text>
              <View style={styles.stickerDivider} />
              <Text style={styles.stickerTotal}>
                {formatMoney((stickerWeight * (stickerProduct?.retail_price || 0)))}
              </Text>
              <Text style={styles.stickerDate}>{today}</Text>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowStickerModal(false)}>
                <Text style={styles.modalCancelText}>ปิด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#8e44ad' }]}
                onPress={() => {
                  setShowStickerModal(false);
                  Alert.alert('🖨️ พิมพ์สติ๊กเกอร์', 'ส่งพิมพ์แล้ว! (ยังไม่ได้เชื่อมต่อเครื่องพิมพ์)');
                }}
              >
                <Text style={styles.modalConfirmText}>🖨️ ส่งพิมพ์จริง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#c0392b', fontSize: 16 },

  header: {
    backgroundColor: '#c0392b', paddingTop: 48, paddingBottom: 14,
    paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  body: { flex: 1 },
  card: {
    backgroundColor: '#fff', margin: 12, marginBottom: 0,
    borderRadius: 12, padding: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#c0392b', marginBottom: 10 },

  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#27ae60', borderRadius: 8,
    padding: 12, fontSize: 28, fontWeight: 'bold', color: '#27ae60',
    textAlign: 'center', fontFamily: 'monospace',
  },
  clearWeightBtn: {
    backgroundColor: '#95a5a6', borderRadius: 8,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  clearWeightText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  searchInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: '#f9f9f9', marginBottom: 10,
  },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productBtn: {
    width: '47%', borderWidth: 2, borderColor: '#eee', borderRadius: 10,
    padding: 10, backgroundColor: '#fff',
  },
  productBtnActive: { borderColor: '#e74c3c', backgroundColor: '#fff0ee' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  productPrice: { fontSize: 13, color: '#e74c3c', marginTop: 2 },

  pricePreview: {
    backgroundColor: '#fffbea', borderWidth: 2, borderColor: '#f1c40f',
    borderRadius: 12, padding: 14, margin: 12, marginBottom: 0,
  },
  priceFormula: { fontSize: 13, color: '#555', marginBottom: 6 },
  priceTotal: { fontSize: 28, fontWeight: 'bold', color: '#e74c3c', marginBottom: 10 },
  previewBtnRow: { flexDirection: 'row', gap: 10 },
  previewBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  previewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cartBadge: { backgroundColor: '#eee', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  cartBadgeText: { fontSize: 12, color: '#555', fontWeight: '600' },
  emptyCart: { paddingVertical: 24, alignItems: 'center' },
  emptyCartText: { color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cartItemDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  cartItemAmount: { fontSize: 15, fontWeight: 'bold', color: '#e74c3c', marginRight: 8 },
  cartDelBtn: { padding: 6 },
  cartDelText: { color: '#e74c3c', fontSize: 16 },

  footer: {
    backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: '#eee',
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  footerTotal: { fontSize: 22, fontWeight: 'bold', color: '#27ae60' },
  footerBtns: { flexDirection: 'row', gap: 10 },
  clearBtn: {
    backgroundColor: '#95a5a6', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  clearBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  payBtn: {
    backgroundColor: '#27ae60', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    minWidth: 120, alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#c0392b', marginBottom: 14 },
  modalLabel: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '600' },
  modalTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  modalTotalLabel: { fontSize: 15, color: '#555' },
  modalTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#e74c3c' },
  cashInputField: {
    borderWidth: 1.5, borderColor: '#27ae60', borderRadius: 10,
    padding: 14, fontSize: 24, textAlign: 'right',
    fontWeight: 'bold', color: '#333', marginBottom: 10,
  },
  quickCash: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickBtn: {
    backgroundColor: '#f0f0f0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  quickBtnText: { fontSize: 14, color: '#333', fontWeight: '600' },
  changeBox: {
    backgroundColor: '#eafaf1', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  changeLabel: { fontSize: 13, color: '#888' },
  changeValue: { fontSize: 28, fontWeight: 'bold', color: '#27ae60', marginTop: 4 },
  custChip: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  custChipActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  custChipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  custChipTextActive: { color: '#fff' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  modalCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  modalConfirmBtn: {
    flex: 2, padding: 14, borderRadius: 12,
    backgroundColor: '#27ae60', alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  stickerPreview: {
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    borderRadius: 10, padding: 16, backgroundColor: '#fff',
    alignItems: 'center', marginBottom: 16,
  },
  stickerShop: { fontSize: 16, fontWeight: 'bold', color: '#c0392b', marginBottom: 4 },
  stickerDivider: { height: 1, borderTopWidth: 1, borderTopColor: '#ddd', borderStyle: 'dashed', width: '100%', marginVertical: 8 },
  stickerProductName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stickerDetail: { fontSize: 13, color: '#555', marginTop: 3 },
  stickerTotal: { fontSize: 24, fontWeight: 'bold', color: '#e74c3c', marginTop: 4 },
  stickerDate: { fontSize: 11, color: '#aaa', marginTop: 6 },

  successCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    elevation: 4, alignItems: 'center', marginBottom: 16,
  },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#27ae60', marginBottom: 4 },
  successSub: { fontSize: 14, color: '#888', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', width: '100%', marginVertical: 10 },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: 6,
  },
  receiptItem: { flex: 1, fontSize: 14, color: '#333' },
  receiptQty: { fontSize: 13, color: '#888', marginHorizontal: 8 },
  receiptPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  receiptTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', alignItems: 'center', marginTop: 4,
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  receiptTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  printReceiptBtn: {
    backgroundColor: '#2980b9', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 12, elevation: 3,
  },
  printReceiptBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  newBillBtn: {
    backgroundColor: '#27ae60', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 12, elevation: 3,
  },
  newBillBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  homeBtn: {
    backgroundColor: '#95a5a6', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 24, elevation: 2,
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});