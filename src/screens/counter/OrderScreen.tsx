import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, SafeAreaView, ScrollView, Modal
} from 'react-native';
import { DatabaseService } from '../../services/database';
import { useAppStore } from '../../store/appStore';

interface CartItem {
  product: any;
  quantity_kg: number;
  unit_price: number;
}

export const OrderScreen: React.FC = () => {
  const { setCurrentUser } = useAppStore();
  const [products, setProducts]       = useState<any[]>([]);
  const [shopName, setShopName]       = useState('');
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [history, setHistory]         = useState<any[]>([]);
  const [tab, setTab]                 = useState<'catalog'|'history'>('catalog');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    DatabaseService.getAllProducts().then(setProducts);
  }, []);

  const addItem = (product: any) => {
    const idx = cart.findIndex(c => c.product.id === product.id);
    if (idx >= 0) {
      const updated = [...cart];
      updated[idx].quantity_kg = Math.round((updated[idx].quantity_kg + 0.5) * 10) / 10;
      setCart(updated);
    } else {
      setCart(prev => [...prev, {
        product,
        quantity_kg: 0.5,
        unit_price: product.price_retail,
      }]);
    }
  };

  const removeItem = (product: any) => {
    const idx = cart.findIndex(c => c.product.id === product.id);
    if (idx < 0) return;
    const updated = [...cart];
    const newQty = Math.round((updated[idx].quantity_kg - 0.5) * 10) / 10;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.product.id !== product.id));
    } else {
      updated[idx].quantity_kg = newQty;
      setCart(updated);
    }
  };

  const getQty = (productId: string) =>
    cart.find(c => c.product.id === productId)?.quantity_kg ?? 0;

  const total = cart.reduce((s, i) => s + i.quantity_kg * i.unit_price, 0);

  const loadHistory = async () => {
    if (!shopName.trim()) { Alert.alert('⚠️','กรุณากรอกชื่อร้านก่อน'); return; }
    const all = await DatabaseService.getOrdersToday();
    setHistory(all.filter((o: any) => o.customer_name === shopName.trim()));
    setTab('history');
  };

  const handleConfirmOrder = async () => {
    if (!shopName.trim()) { Alert.alert('⚠️','กรุณากรอกชื่อร้าน'); return; }
    if (cart.length === 0)  { Alert.alert('⚠️','กรุณาเลือกสินค้าก่อน'); return; }
    setShowConfirm(true);
  };

  const submitOrder = async () => {
    try {
      const orderId     = `ord_${Date.now()}`;
      const orderNumber = `JRC${Date.now().toString().slice(-6)}`;
      const now         = new Date().toISOString();
      const items = cart.map((item, i) => ({
        id:              `item_${Date.now()}_${i}`,
        order_id:        orderId,
        product_id:      item.product.id,
        product_name_th: item.product.name_th,
        product_name_mm: item.product.name_mm ?? '',
        product_name_en: item.product.name_en ?? '',
        product_name_cn: item.product.name_cn ?? '',
        quantity_kg:     item.quantity_kg,
        unit_price:      item.unit_price,
        total_price:     item.quantity_kg * item.unit_price,
        is_packed:       false,
      }));
      const order = {
        id:             orderId,
        order_number:   orderNumber,
        customer_name:  shopName.trim(),
        customer_phone: '',
        subtotal:       total,
        discount:       0,
        total:          total,
        payment_method: 'credit',
        payment_status: 'pending',
        status:         'pending',
        notes:          '',
        created_at:     now,
        updated_at:     now,
        is_synced:      false,
      };
      await DatabaseService.saveOrder(order, items);
      setShowConfirm(false);
      setCart([]);
      Alert.alert('✅ สั่งสินค้าสำเร็จ',
        `ออเดอร์ #${orderNumber}\nร้าน: ${shopName}\nยอดรวม: ฿${total.toFixed(2)}`,
        [{ text: 'ตกลง' }]);
    } catch(e) {
      Alert.alert('❌','บันทึกออเดอร์ไม่สำเร็จ');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🛒 สั่งสินค้า / Order</Text>
        <TouchableOpacity onPress={() => setCurrentUser(null)}>
          <Text style={s.homeBtn}>🏠 ออก</Text>
        </TouchableOpacity>
      </View>

      {/* Shop Name */}
      <View style={s.shopRow}>
        <TextInput
          style={s.shopInput}
          value={shopName}
          onChangeText={setShopName}
          placeholder="🏪 กรอกชื่อร้านของท่าน / Enter shop name"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={s.historyBtn} onPress={loadHistory}>
          <Text style={s.historyBtnText}>📋 ประวัติ</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, tab === 'catalog' && s.tabActive]}
          onPress={() => setTab('catalog')}>
          <Text style={[s.tabText, tab === 'catalog' && s.tabTextActive]}>🌶️ สินค้า</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'history' && s.tabActive]}
          onPress={loadHistory}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>📋 ประวัติสั่งซื้อ</Text>
        </TouchableOpacity>
      </View>

      {/* Catalog */}
      {tab === 'catalog' && (
        <FlatList
          data={products}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding:12, gap:8, paddingBottom:120 }}
          renderItem={({ item }) => {
            const qty = getQty(item.id);
            return (
              <View style={s.productCard}>
                <View style={s.productInfo}>
                  <Text style={s.productName}>{item.name_th}</Text>
                  <Text style={s.productSub}>{item.name_mm || item.name_en || ''}</Text>
                  <Text style={s.productPrice}>฿{item.price_retail}/กก.</Text>
                </View>
                <View style={s.qtyControl}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => removeItem(item)}>
                    <Text style={s.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyText}>{qty > 0 ? `${qty} กก.` : '0'}</Text>
                  <TouchableOpacity style={[s.qtyBtn, s.qtyBtnAdd]} onPress={() => addItem(item)}>
                    <Text style={[s.qtyBtnText, { color:'#fff' }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* History */}
      {tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding:12, gap:8 }}
          ListEmptyComponent={
            <View style={{ alignItems:'center', padding:48 }}>
              <Text style={{ fontSize:40 }}>📭</Text>
              <Text style={{ color:'#9ca3af', marginTop:8 }}>ยังไม่มีประวัติสั่งซื้อ</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.historyCard}>
              <Text style={s.historyNum}>#{item.order_number}</Text>
              <Text style={s.historyTotal}>฿{(item.total||0).toLocaleString()}</Text>
              <Text style={s.historyStatus}>{item.status}</Text>
            </View>
          )}
        />
      )}

      {/* Cart Summary FAB */}
      {cart.length > 0 && tab === 'catalog' && (
        <TouchableOpacity style={s.fab} onPress={handleConfirmOrder} activeOpacity={0.85}>
          <Text style={s.fabText}>🛒 {cart.length} รายการ  ฿{total.toFixed(2)}</Text>
          <Text style={s.fabSub}>แตะเพื่อยืนยันสั่งสินค้า</Text>
        </TouchableOpacity>
      )}

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>✅ ยืนยันคำสั่งซื้อ</Text>
            <Text style={s.confirmShop}>🏪 {shopName}</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {cart.map((item, i) => (
                <View key={i} style={s.confirmRow}>
                  <Text style={s.confirmItem}>{item.product.name_th}</Text>
                  <Text style={s.confirmQty}>{item.quantity_kg} กก.</Text>
                  <Text style={s.confirmPrice}>฿{(item.quantity_kg * item.unit_price).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={s.confirmTotalRow}>
              <Text style={s.confirmTotalLabel}>ยอดรวมทั้งหมด</Text>
              <Text style={s.confirmTotalValue}>฿{total.toFixed(2)}</Text>
            </View>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={s.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.submitBtn} onPress={submitOrder}>
                <Text style={s.submitBtnText}>✅ ยืนยันสั่งสินค้า</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#fffbeb' },
  header:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                      backgroundColor:'#92400e', padding:16 },
  headerTitle:      { color:'#fff', fontSize:18, fontWeight:'bold' },
  homeBtn:          { color:'#fde68a', fontSize:14, fontWeight:'600' },
  shopRow:          { flexDirection:'row', padding:12, gap:8,
                      backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#e5e7eb' },
  shopInput:        { flex:1, backgroundColor:'#fef3c7', borderRadius:10, padding:12,
                      fontSize:14, borderWidth:1, borderColor:'#fde68a', color:'#111' },
  historyBtn:       { backgroundColor:'#92400e', borderRadius:10,
                      paddingHorizontal:14, justifyContent:'center' },
  historyBtnText:   { color:'#fff', fontWeight:'bold', fontSize:13 },
  tabRow:           { flexDirection:'row', backgroundColor:'#fff',
                      borderBottomWidth:1, borderColor:'#e5e7eb' },
  tab:              { flex:1, padding:12, alignItems:'center' },
  tabActive:        { borderBottomWidth:2, borderBottomColor:'#92400e' },
  tabText:          { fontSize:14, color:'#9ca3af', fontWeight:'600' },
  tabTextActive:    { color:'#92400e' },
  productCard:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                      backgroundColor:'#fff', borderRadius:12, padding:14, elevation:2 },
  productInfo:      { flex:1 },
  productName:      { fontSize:15, fontWeight:'bold', color:'#78350f' },
  productSub:       { fontSize:12, color:'#9ca3af', marginTop:2 },
  productPrice:     { fontSize:14, fontWeight:'700', color:'#92400e', marginTop:4 },
  qtyControl:       { flexDirection:'row', alignItems:'center', gap:10 },
  qtyBtn:           { width:34, height:34, borderRadius:17, backgroundColor:'#f3f4f6',
                      justifyContent:'center', alignItems:'center', elevation:1 },
  qtyBtnAdd:        { backgroundColor:'#92400e' },
  qtyBtnText:       { fontSize:20, fontWeight:'bold', color:'#374151', lineHeight:26 },
  qtyText:          { fontSize:14, fontWeight:'700', color:'#78350f',
                      minWidth:52, textAlign:'center' },
  historyCard:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                      backgroundColor:'#fff', borderRadius:10, padding:14, elevation:2 },
  historyNum:       { fontSize:14, fontWeight:'bold', color:'#92400e' },
  historyTotal:     { fontSize:15, fontWeight:'bold', color:'#27ae60' },
  historyStatus:    { fontSize:12, color:'#9ca3af' },
  fab:              { position:'absolute', bottom:20, left:20, right:20,
                      backgroundColor:'#92400e', borderRadius:14, padding:16,
                      alignItems:'center', elevation:8 },
  fabText:          { color:'#fff', fontSize:16, fontWeight:'bold' },
  fabSub:           { color:'#fde68a', fontSize:12, marginTop:2 },
  modalOverlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.5)',
                      justifyContent:'flex-end' },
  confirmBox:       { backgroundColor:'#fff', borderTopLeftRadius:20,
                      borderTopRightRadius:20, padding:24 },
  confirmTitle:     { fontSize:18, fontWeight:'bold', color:'#2c3e50', marginBottom:8 },
  confirmShop:      { fontSize:15, color:'#92400e', fontWeight:'600', marginBottom:12 },
  confirmRow:       { flexDirection:'row', justifyContent:'space-between',
                      paddingVertical:6, borderBottomWidth:1, borderColor:'#f3f4f6' },
  confirmItem:      { flex:1, fontSize:14, color:'#374151' },
  confirmQty:       { fontSize:14, color:'#6b7280', marginHorizontal:8 },
  confirmPrice:     { fontSize:14, fontWeight:'600', color:'#92400e' },
  confirmTotalRow:  { flexDirection:'row', justifyContent:'space-between',
                      alignItems:'center', marginTop:12, marginBottom:16 },
  confirmTotalLabel:{ fontSize:16, fontWeight:'bold', color:'#2c3e50' },
  confirmTotalValue:{ fontSize:24, fontWeight:'bold', color:'#27ae60' },
  confirmBtns:      { flexDirection:'row', gap:10 },
  cancelBtn:        { flex:1, backgroundColor:'#f3f4f6', borderRadius:10,
                      padding:14, alignItems:'center' },
  cancelBtnText:    { color:'#374151', fontWeight:'600', fontSize:15 },
  submitBtn:        { flex:2, backgroundColor:'#92400e', borderRadius:10,
                      padding:14, alignItems:'center' },
  submitBtnText:    { color:'#fff', fontWeight:'bold', fontSize:15 },
});

export default OrderScreen;