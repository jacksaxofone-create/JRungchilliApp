import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert
} from 'react-native';
import { DatabaseService } from '../services/database';

export default function CustomerOrderHistoryScreen({ navigation, route }: any) {
  const { customer } = route.params;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<{ [key: number]: any[] }>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const o = await DatabaseService.getOrders(customer.id);
      setOrders(o);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!orderItems[orderId]) {
      try {
        const items = await DatabaseService.getOrderItems(orderId);
        setOrderItems(prev => ({ ...prev, [orderId]: items }));
      } catch (e) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายการได้');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'pending': return '#e67e22';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '✅ เสร็จสิ้น';
      case 'pending': return '⏳ รอดำเนินการ';
      case 'cancelled': return '❌ ยกเลิก';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดประวัติ...</Text>
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
          <Text style={styles.headerTitle}>📋 ประวัติการสั่งซื้อ</Text>
          <Text style={styles.headerSub}>{customer.name_th}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีประวัติการสั่งซื้อ</Text>
          <Text style={styles.emptySub}>เมื่อคุณสั่งสินค้า ประวัติจะแสดงที่นี่</Text>
          <TouchableOpacity
            style={styles.orderNowBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.orderNowBtnText}>🛒 สั่งสินค้าเลย</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              ออเดอร์ทั้งหมด {orders.length} รายการ
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => handleExpand(item.id)}
              activeOpacity={0.8}
            >
              {/* Order Header */}
              <View style={styles.orderCardHeader}>
                <View style={styles.orderCardLeft}>
                  <Text style={styles.orderNumber}>ออเดอร์ #{item.id}</Text>
                  <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>฿{Number(item.total_amount).toFixed(2)}</Text>
                </View>
              </View>

              {/* Expand Arrow */}
              <View style={styles.expandRow}>
                <Text style={styles.expandText}>
                  {expandedId === item.id ? '▲ ซ่อนรายการ' : '▼ ดูรายการ'}
                </Text>
              </View>

              {/* Order Items (expanded) */}
              {expandedId === item.id && (
                <View style={styles.itemsBox}>
                  <View style={styles.itemsDivider} />
                  {orderItems[item.id] ? (
                    orderItems[item.id].length > 0 ? (
                      orderItems[item.id].map((oi, i) => (
                        <View key={i} style={styles.itemRow}>
                          <Text style={styles.itemName}>{oi.product_name}</Text>
                          <Text style={styles.itemQty}>{oi.quantity} kg</Text>
                          <Text style={styles.itemPrice}>฿{Number(oi.total_price).toFixed(2)}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noItemsText}>ไม่มีรายการสินค้า</Text>
                    )
                  ) : (
                    <ActivityIndicator size="small" color="#c0392b" style={{ marginVertical: 8 }} />
                  )}
                  <View style={styles.itemsDivider} />
                  <View style={styles.itemsTotalRow}>
                    <Text style={styles.itemsTotalLabel}>รวม</Text>
                    <Text style={styles.itemsTotalValue}>฿{Number(item.total_amount).toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
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
  backBtn: { padding: 4, width: 60 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  listHeader: { fontSize: 14, color: '#888', marginBottom: 12 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  orderCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderCardLeft: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderDate: { fontSize: 12, color: '#888', marginTop: 2 },
  orderCardRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#c0392b' },
  expandRow: { marginTop: 8, alignItems: 'center' },
  expandText: { fontSize: 12, color: '#aaa' },
  itemsBox: { marginTop: 8 },
  itemsDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemQty: { fontSize: 13, color: '#888', marginHorizontal: 8 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  noItemsText: { fontSize: 13, color: '#aaa', textAlign: 'center', padding: 8 },
  itemsTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  itemsTotalLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemsTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#c0392b' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  orderNowBtn: {
    backgroundColor: '#c0392b', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  orderNowBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});