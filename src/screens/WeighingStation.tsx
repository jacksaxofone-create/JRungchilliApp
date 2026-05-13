import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, ActivityIndicator, FlatList
} from 'react-native';
import { DatabaseService } from '../services/database';

interface CartItem {
  product_id: number;
  product_name: string;
  weight: number;
  unit_price: number;
  total_price: number;
}

export default function WeighingStation({ navigation, onLogout }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [orderName, setOrderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'select'|'weigh'|'cart'|'confirm'>('select');
  const [searchText, setSearchText] = useState('');

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
    p.name_th.includes(searchText) || p.name_en.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setWeight('');
    setStep('weigh');
  };

  const handleAddToCart = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกน้ำหนักให้ถูกต้อง');
      return;
    }
    const total = w * selectedProduct.retail_price;
    const newItem: CartItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name_th,
      weight: w,
      unit_price: selectedProduct.retail_price,
      total_price: Math.round(total * 100) / 100,
    };
    setCart(prev => [...prev, newItem]);
    setStep('cart');
    setSelectedProduct(null);
    setWeight('');
  };

  const handleRemoveFromCart = (index: number) => {
    Alert.alert('ลบรายการ', `ต้องการลบ "${cart[index].product_name}" ออกจากรายการ?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => {
        setCart(prev => prev.filter((_, i) => i !== index));
      }},
    ]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total_price, 0);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setSaving(true);
    try {
      const orderId = await DatabaseService.createOrder({
        customer_name: orderName || 'ลูกค้าทั่วไป',
        order_type: 'retail',
        status: 'completed',
        total_amount: totalAmount,
        notes: '',
      });
      for (const item of cart) {
        await DatabaseService.addOrderItem({
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.weight,
          unit: 'kg',
          unit_price: item.unit_price,
          total_price: item.total_price,
        });
      }
      setStep('confirm');
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกออเดอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setOrderName('');
    setSelectedProduct(null);
    setWeight('');
    setStep('select');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
      </View>
    );
  }

  // ── STEP: CONFIRM (สติ๊กเกอร์) ──
  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✅ พิมพ์สติ๊กเกอร์</Text>
        </View>
        <ScrollView style={styles.body}>
          <View style={styles.stickerCard}>
            <Text style={styles.stickerTitle}>🌶️ จ.รุ่งชิลลี่</Text>
            <Text style={styles.stickerSub}>Mae Sot Fresh Vegetables</Text>
            <View style={styles.stickerDivider} />
            {orderName ? <Text style={styles.stickerCustomer}>ลูกค้า: {orderName}</Text> : null}
            {cart.map((item, i) => (
              <View key={i} style={styles.stickerRow}>
                <Text style={styles.stickerItem}>{item.product_name}</Text>
                <Text style={styles.stickerQty}>{item.weight} kg × ฿{item.unit_price}</Text>
                <Text style={styles.stickerPrice}>฿{item.total_price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.stickerDivider} />
            <View style={styles.stickerTotal}>
              <Text style={styles.stickerTotalLabel}>รวมทั้งหมด</Text>
              <Text style={styles.stickerTotalValue}>฿{totalAmount.toFixed(2)}</Text>
            </View>
            <Text style={styles.stickerDate}>
              {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.printBtn}>
            <Text style={styles.printBtnText}>🖨️ พิมพ์สติ๊กเกอร์</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newOrderBtn} onPress={handleNewOrder}>
            <Text style={styles.newOrderBtnText}>+ ออเดอร์ใหม่</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onLogout}>
            <Text style={styles.homeBtnText}>🏠 กลับหน้าหลัก</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── STEP: WEIGH ──
  if (step === 'weigh') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn}>
            <Text style={styles.backText}>← กลับ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚖️ ชั่งน้ำหนัก</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.weighCard}>
            <Text style={styles.weighProductName}>{selectedProduct?.name_th}</Text>
            <Text style={styles.weighProductPrice}>฿{selectedProduct?.retail_price} / kg</Text>
            <Text style={styles.weighLabel}>น้ำหนัก (kg)</Text>
            <TextInput
              style={styles.weighInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="0.000"
              keyboardType="numeric"
              autoFocus
            />
            {weight && parseFloat(weight) > 0 && (
              <View style={styles.weighResult}>
                <Text style={styles.weighResultLabel}>ราคารวม</Text>
                <Text style={styles.weighResultValue}>
                  ฿{(parseFloat(weight) * (selectedProduct?.retail_price || 0)).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>✅ เพิ่มในรายการ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STEP: CART ──
  if (step === 'cart') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn}>
            <Text style={styles.backText}>← เพิ่มสินค้า</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🛒 รายการสินค้า</Text>
          <TouchableOpacity onPress={onLogout} style={styles.homeIconBtn}>
            <Text style={styles.homeIconText}>🏠</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body}>
          <Text style={styles.sectionLabel}>ชื่อลูกค้า / ออเดอร์</Text>
          <TextInput
            style={styles.orderNameInput}
            value={orderName}
            onChangeText={setOrderName}
            placeholder="กรอกชื่อลูกค้า (ไม่บังคับ)"
          />
          <Text style={styles.sectionLabel}>รายการสินค้า ({cart.length} รายการ)</Text>
          {cart.map((item, i) => (
            <TouchableOpacity key={i} style={styles.cartItem} onLongPress={() => handleRemoveFromCart(i)}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName}>{item.product_name}</Text>
                <Text style={styles.cartItemDetail}>{item.weight} kg × ฿{item.unit_price}</Text>
              </View>
              <View style={styles.cartItemRight}>
                <Text style={styles.cartItemPrice}>฿{item.total_price.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleRemoveFromCart(i)}>
                  <Text style={styles.cartItemRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.cartTotal}>
            <Text style={styles.cartTotalLabel}>รวมทั้งหมด</Text>
            <Text style={styles.cartTotalValue}>฿{totalAmount.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
            onPress={handleConfirmOrder}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.confirmBtnText}>✅ ยืนยันและพิมพ์สติ๊กเกอร์</Text>
            }
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ── STEP: SELECT PRODUCT ──
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌶️ เลือกสินค้า</Text>
        <View style={styles.headerRight}>
          {cart.length > 0 && (
            <TouchableOpacity style={styles.cartBadge} onPress={() => setStep('cart')}>
              <Text style={styles.cartBadgeText}>🛒 {cart.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onLogout} style={styles.homeIconBtn}>
            <Text style={styles.homeIconText}>🏠</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="🔍 ค้นหาสินค้า..."
        />
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleSelectProduct(item)}
          >
            <Text style={styles.productName}>{item.name_th}</Text>
            <Text style={styles.productNameEn}>{item.name_en}</Text>
            <Text style={styles.productPrice}>฿{item.retail_price} / kg</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#c0392b', fontSize: 16 },
  header: {
    backgroundColor: '#c0392b', paddingTop: 48, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  homeIconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  homeIconText: { fontSize: 18 },
  cartBadge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  cartBadgeText: { color: '#c0392b', fontWeight: 'bold', fontSize: 14 },
  body: { flex: 1, padding: 16 },
  searchBox: { padding: 12, backgroundColor: '#fff', elevation: 1 },
  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10,
    fontSize: 15, borderWidth: 1, borderColor: '#eee',
  },
  productGrid: { padding: 12 },
  productCard: {
    flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  productNameEn: { fontSize: 11, color: '#999', marginTop: 2 },
  productPrice: { fontSize: 14, color: '#c0392b', fontWeight: '600', marginTop: 6 },
  weighCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', elevation: 4, marginBottom: 20,
  },
  weighProductName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  weighProductPrice: { fontSize: 16, color: '#888', marginBottom: 20 },
  weighLabel: { fontSize: 14, color: '#555', marginBottom: 8 },
  weighInput: {
    fontSize: 40, fontWeight: 'bold', color: '#c0392b',
    borderBottomWidth: 3, borderBottomColor: '#c0392b',
    width: 200, textAlign: 'center', paddingBottom: 8,
  },
  weighResult: { marginTop: 20, alignItems: 'center' },
  weighResultLabel: { fontSize: 14, color: '#888' },
  weighResultValue: { fontSize: 32, fontWeight: 'bold', color: '#27ae60' },
  addToCartBtn: {
    backgroundColor: '#27ae60', borderRadius: 14, padding: 18,
    alignItems: 'center', elevation: 3,
  },
  addToCartText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 12 },
  orderNameInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 8,
  },
  cartItem: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8, elevation: 2,
  },
  cartItemLeft: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cartItemDetail: { fontSize: 13, color: '#888', marginTop: 2 },
  cartItemRight: { alignItems: 'flex-end' },
  cartItemPrice: { fontSize: 16, fontWeight: 'bold', color: '#c0392b' },
  cartItemRemove: { fontSize: 18, color: '#e74c3c', marginTop: 4, padding: 4 },
  cartTotal: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, elevation: 3,
  },
  cartTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cartTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#c0392b' },
  confirmBtn: {
    backgroundColor: '#c0392b', borderRadius: 14, padding: 18,
    alignItems: 'center', elevation: 3,
  },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stickerCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    margin: 16, elevation: 4,
  },
  stickerTitle: { fontSize: 24, fontWeight: 'bold', color: '#c0392b', textAlign: 'center' },
  stickerSub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 12 },
  stickerDivider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  stickerCustomer: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  stickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stickerItem: { flex: 1, fontSize: 14, color: '#333' },
  stickerQty: { fontSize: 13, color: '#888', marginHorizontal: 8 },
  stickerPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  stickerTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stickerTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  stickerTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#c0392b' },
  stickerDate: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 12 },
  printBtn: {
    backgroundColor: '#2980b9', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 12, elevation: 3,
  },
  printBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  newOrderBtn: {
    backgroundColor: '#27ae60', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 12, elevation: 3,
  },
  newOrderBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  homeBtn: {
    backgroundColor: '#95a5a6', borderRadius: 14, padding: 16,
    alignItems: 'center', marginHorizontal: 16, marginBottom: 24, elevation: 2,
  },
  homeBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});