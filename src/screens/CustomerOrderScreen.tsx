import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, ActivityIndicator, FlatList, Modal
} from 'react-native';
import { DatabaseService } from '../services/database';

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function CustomerOrderScreen({ navigation, route }: any) {
  const { customer } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderName, setOrderName] = useState(customer?.name_th || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const p = await DatabaseService.getProducts();
      setProducts(p);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name_th.includes(searchText) ||
    p.name_en.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddToCart = (product: any, qty: number = 0.5) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.product_id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity = Math.round((updated[existing].quantity + qty) * 100) / 100;
        updated[existing].total_price = Math.round(updated[existing].quantity * updated[existing].unit_price * 100) / 100;
        return updated;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name_th,
        quantity: qty,
        unit_price: product.retail_price,
        total_price: Math.round(qty * product.retail_price * 100) / 100,
      }];
    });
  };

  const handleChangeQty = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id !== productId) return item;
        const newQty = Math.round((item.quantity + delta) * 100) / 100;
        if (newQty <= 0) return item;
        return {
          ...item,
          quantity: newQty,
          total_price: Math.round(newQty * item.unit_price * 100) / 100,
        };
      });
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.total_price, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const getCartQty = (productId: number) => {
    const item = cart.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setSaving(true);
    try {
      const oid = await DatabaseService.createOrder({
        customer_id: customer.id,
        customer_name: orderName || customer.name_th,
        order_type: 'wholesale',
        status: 'pending',
        total_amount: totalAmount,
        notes: '',
      });
      for (const item of cart) {
        await DatabaseService.addOrderItem({
          order_id: oid,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: 'kg',
          unit_price: item.unit_price,
          total_price: item.total_price,
        });
      }
      setOrderId(oid);
      setShowConfirm(false);
      setOrderDone(true);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออเดอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  // ── ORDER DONE SCREEN ──
  if (orderDone) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✅ ส่งออเดอร์แล้ว</Text>
        </View>
        <ScrollView style={styles.body}>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>ส่งออเดอร์เรียบร้อย!</Text>
            <Text style={styles.successSub}>ออเดอร์ #{orderId} ของ {customer.name_th}</Text>
            <View style={styles.successDivider} />
            {cart.map((item, i) => (
              <View key={i} style={styles.receiptRow}>
                <Text style={styles.receiptItem}>{item.product_name}</Text>
                <Text style={styles.receiptQty}>{item.quantity} kg</Text>
                <Text style={styles.receiptPrice}>฿{item.total_price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.successDivider} />
            <View style={styles.receiptTotal}>
              <Text style={styles.receiptTotalLabel}>รวมทั้งหมด</Text>
              <Text style={styles.receiptTotalValue}>฿{totalAmount.toFixed(2)}</Text>
            </View>
            <Text style={styles.successNote}>⏳ Admin กำลังดำเนินการออเดอร์ของคุณ</Text>
          </View>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('CustomerOrderHistory', { customer })}
          >
            <Text style={styles.historyBtnText}>📋 ดูประวัติการสั่งซื้อ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newOrderBtn}
            onPress={() => {
              setCart([]);
              setOrderDone(false);
              setOrderId(null);
            }}
          >
            <Text style={styles.newOrderBtnText}>+ สั่งซื้อใหม่</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => navigation.navigate('CustomerLogin')}
          >
            <Text style={styles.logoutBtnText}>🚪 ออกจากระบบ</Text>
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
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerLogin')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← ออก</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛒 สั่งสินค้า</Text>
          <Text style={styles.headerSub}>{customer.name_th}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.historyIconBtn}
            onPress={() => navigation.navigate('CustomerOrderHistory', { customer })}
          >
            <Text style={styles.historyIconText}>📋</Text>
          </TouchableOpacity>
          {cart.length > 0 && (
            <TouchableOpacity style={styles.cartBadge} onPress={() => setShowCart(true)}>
              <Text style={styles.cartBadgeText}>🛒 {cart.length}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Order Name */}
      <View style={styles.orderNameBox}>
        <Text style={styles.orderNameLabel}>ชื่อออเดอร์:</Text>
        <TextInput
          style={styles.orderNameInput}
          value={orderName}
          onChangeText={setOrderName}
          placeholder="กรอกชื่อออเดอร์"
        />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="🔍 ค้นหาสินค้า..."
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) => {
          const qty = getCartQty(item.id);
          return (
            <View style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name_th}</Text>
                <Text style={styles.productNameSub}>{item.name_en}</Text>
                <Text style={styles.productPrice}>฿{item.retail_price} / kg</Text>
              </View>
              <View style={styles.productActions}>
                {qty > 0 ? (
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleChangeQty(item.id, -0.5)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty} kg</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleChangeQty(item.id, 0.5)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveFromCart(item.id)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Text style={styles.addBtnText}>+ 0.5 kg</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Bar */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarItems}>{cart.length} รายการ • {totalItems.toFixed(1)} kg</Text>
            <Text style={styles.bottomBarTotal}>฿{totalAmount.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowConfirm(true)}>
            <Text style={styles.checkoutBtnText}>ยืนยันออเดอร์ →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>🛒 รายการสินค้า</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.cartModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {cart.map((item, i) => (
                <View key={i} style={styles.cartModalItem}>
                  <View style={styles.cartModalItemLeft}>
                    <Text style={styles.cartModalItemName}>{item.product_name}</Text>
                    <Text style={styles.cartModalItemDetail}>{item.quantity} kg × ฿{item.unit_price}</Text>
                  </View>
                  <Text style={styles.cartModalItemPrice}>฿{item.total_price.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.cartModalTotal}>
                <Text style={styles.cartModalTotalLabel}>รวม</Text>
                <Text style={styles.cartModalTotalValue}>฿{totalAmount.toFixed(2)}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.cartModalCheckout}
              onPress={() => { setShowCart(false); setShowConfirm(true); }}
            >
              <Text style={styles.cartModalCheckoutText}>ยืนยันออเดอร์</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>📋 ยืนยันออเดอร์</Text>
            <Text style={styles.confirmShop}>ร้าน: {customer.name_th}</Text>
            <Text style={styles.confirmOrder}>ออเดอร์: {orderName}</Text>
            <View style={styles.confirmDivider} />
            {cart.map((item, i) => (
              <View key={i} style={styles.confirmRow}>
                <Text style={styles.confirmItem}>{item.product_name} {item.quantity} kg</Text>
                <Text style={styles.confirmPrice}>฿{item.total_price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.confirmDivider} />
            <View style={styles.confirmTotalRow}>
              <Text style={styles.confirmTotalLabel}>รวมทั้งหมด</Text>
              <Text style={styles.confirmTotalValue}>฿{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOkBtn, saving && styles.confirmOkBtnDisabled]}
                onPress={handleConfirmOrder}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmOkText}>✅ ส่งออเดอร์</Text>
                }
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
  },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyIconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  historyIconText: { fontSize: 16 },
  cartBadge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  cartBadgeText: { color: '#c0392b', fontWeight: 'bold', fontSize: 14 },
  orderNameBox: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  orderNameLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginRight: 10 },
  orderNameInput: { flex: 1, fontSize: 15, color: '#333', padding: 4 },
  searchBox: { backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10,
    fontSize: 15, borderWidth: 1, borderColor: '#eee',
  },
  productList: { paddingBottom: 100 },
  productRow: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  productNameSub: { fontSize: 11, color: '#aaa', marginTop: 1 },
  productPrice: { fontSize: 13, color: '#c0392b', fontWeight: '600', marginTop: 2 },
  productActions: { alignItems: 'flex-end' },
  addBtn: {
    backgroundColor: '#c0392b', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    backgroundColor: '#c0392b', borderRadius: 16,
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  qtyValue: { fontSize: 13, fontWeight: 'bold', color: '#333', minWidth: 50, textAlign: 'center' },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#e74c3c', fontSize: 16 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', elevation: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  bottomBarInfo: { flex: 1 },
  bottomBarItems: { fontSize: 12, color: '#888' },
  bottomBarTotal: { fontSize: 18, fontWeight: 'bold', color: '#c0392b' },
  checkoutBtn: {
    backgroundColor: '#c0392b', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  cartModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  cartModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cartModalClose: { fontSize: 20, color: '#888', padding: 4 },
  cartModalItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  cartModalItemLeft: { flex: 1 },
  cartModalItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  cartModalItemDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  cartModalItemPrice: { fontSize: 15, fontWeight: 'bold', color: '#c0392b' },
  cartModalTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12, paddingTop: 12,
    borderTopWidth: 2, borderTopColor: '#eee',
  },
  cartModalTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cartModalTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  cartModalCheckout: {
    backgroundColor: '#c0392b', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  cartModalCheckoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  confirmModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '85%',
  },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  confirmShop: { fontSize: 15, color: '#555', marginBottom: 2 },
  confirmOrder: { fontSize: 14, color: '#888', marginBottom: 12 },
  confirmDivider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
  },
  confirmItem: { fontSize: 14, color: '#333' },
  confirmPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  confirmTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  confirmTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  confirmTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#c0392b' },
  confirmBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  confirmCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  confirmCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  confirmOkBtn: {
    flex: 2, padding: 14, borderRadius: 12,
    backgroundColor: '#c0392b', alignItems: 'center',
  },
  confirmOkBtnDisabled: { backgroundColor: '#ccc' },
  confirmOkText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  successCard: {
    backgroundColor: '#fff', margin: 20, borderRadius: 16,
    padding: 24, elevation: 4, alignItems: 'center',
  },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#27ae60', marginBottom: 4 },
  successSub: { fontSize: 14, color: '#888', marginBottom: 16 },
  successDivider: { height: 1, backgroundColor: '#eee', width: '100%', marginVertical: 12 },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: 6,
  },
  receiptItem: { flex: 1, fontSize: 14, color: '#333' },
  receiptQty: { fontSize: 13, color: '#888', marginHorizontal: 8 },
  receiptPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  receiptTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', alignItems: 'center',
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  receiptTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  successNote: { fontSize: 13, color: '#e67e22', marginTop: 16, textAlign: 'center' },
  historyBtn: {
    backgroundColor: '#2980b9', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 12, elevation: 3,
  },
  historyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  newOrderBtn: {
    backgroundColor: '#27ae60', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 12, elevation: 3,
  },
  newOrderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: '#95a5a6', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 20, marginBottom: 30, elevation: 2,
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  body: { flex: 1, padding: 16 },
});