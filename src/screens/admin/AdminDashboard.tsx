import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Alert
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DatabaseService } from '../../services/database';
import { tBilingual } from '../../i18n/translations';

interface DashboardStats {
  revenueToday: number;
  ordersToday: number;
  pendingOrders: number;
  overdueCredit: number;
}

export const AdminDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { primaryLanguage, secondaryLanguage } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({
    revenueToday: 0, ordersToday: 0, pendingOrders: 0, overdueCredit: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const t = (key: string) => tBilingual(key, primaryLanguage, secondaryLanguage);

  const loadData = async () => {
    try {
      const s = await DatabaseService.getDashboardStats();
      setStats(s);
      const orders = await DatabaseService.getOrdersToday();
      setRecentOrders(orders.slice(0, 5));
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statCards = [
    { label: 'รายได้วันนี้ / Today Revenue', value: `฿${stats.revenueToday.toLocaleString()}`, color: '#27ae60', icon: '💰' },
    { label: 'ออเดอร์วันนี้ / Orders Today',  value: stats.ordersToday.toString(),             color: '#2980b9', icon: '📦' },
    { label: 'รอดำเนินการ / Pending',          value: stats.pendingOrders.toString(),           color: '#e67e22', icon: '⏳' },
    { label: 'เครดิตค้างชำระ / Overdue',       value: `฿${stats.overdueCredit.toLocaleString()}`, color: '#c0392b', icon: '⚠️' },
  ];

  const menuButtons = [
    { label: 'เพิ่มสินค้า\nAdd Product',    icon: '➕🌶️', color: '#e74c3c', screen: 'AddProduct'      },
    { label: 'จัดการสินค้า\nProducts',       icon: '📋',    color: '#8e44ad', screen: 'ProductManagement'},
    { label: 'เพิ่มลูกค้า\nAdd Customer',   icon: '➕👤', color: '#27ae60', screen: 'AddCustomer'     },
    { label: 'จัดการลูกค้า\nCustomers',      icon: '👥',    color: '#2980b9', screen: 'CustomerManagement'},
    { label: 'ออเดอร์ทั้งหมด\nAll Orders',  icon: '🗂️',    color: '#e67e22', screen: 'AllOrders'       },
    { label: 'รายงานเครดิต\nCredit Report', icon: '💳',    color: '#16a085', screen: 'CreditReport'    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return '#e67e22';
      case 'confirmed': return '#2980b9';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#c0392b';
      default:          return '#7f8c8d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':   return '⏳ รอยืนยัน';
      case 'confirmed': return '✅ ยืนยันแล้ว';
      case 'delivered': return '🚚 จัดส่งแล้ว';
      case 'cancelled': return '❌ ยกเลิก';
      default:          return status;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.headerTitle}>🛡️ Admin Dashboard</Text>
          <Text style={styles.headerSub}>ร้านเจริญชิลลี่ J.Rung Chilli</Text>
        </View>
      </View>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <View key={i} style={[styles.statCard, { borderLeftColor: card.color }]}>
            <Text style={styles.statIcon}>{card.icon}</Text>
            <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu Buttons */}
      <Text style={styles.sectionTitle}>⚙️ จัดการระบบ / Management</Text>
      <View style={styles.menuGrid}>
        {menuButtons.map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuBtn, { backgroundColor: btn.color }]}
            onPress={() => navigation.navigate(btn.screen)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>{btn.icon}</Text>
            <Text style={styles.menuLabel}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>📋 ออเดอร์ล่าสุด / Recent Orders</Text>
      {recentOrders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>ยังไม่มีออเดอร์วันนี้</Text>
          <Text style={styles.emptyText}>No orders today</Text>
        </View>
      ) : (
        recentOrders.map((order, i) => (
          <TouchableOpacity
            key={i}
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
          >
            <View style={styles.orderRow}>
              <Text style={styles.orderNum}>#{order.order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
              </View>
            </View>
            <Text style={styles.orderShop}>🏪 {order.customer_name || 'ลูกค้าทั่วไป'}</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderItems}>🛒 {order.total_items || 0} รายการ</Text>
              <Text style={styles.orderTotal}>฿{(order.total_amount || 0).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b',
                    padding: 16, gap: 12 },
  logo:           { width: 48, height: 48, borderRadius: 8 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub:      { color: '#ffcccc', fontSize: 12 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard:       { width: '48%', margin: '1%', backgroundColor: '#fff', borderRadius: 10,
                    padding: 12, borderLeftWidth: 4, elevation: 2 },
  statIcon:       { fontSize: 22 },
  statValue:      { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  statLabel:      { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  sectionTitle:   { fontSize: 15, fontWeight: 'bold', color: '#2c3e50',
                    marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  menuGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  menuBtn:        { width: '30%', margin: '1.5%', borderRadius: 12, padding: 14,
                    alignItems: 'center', elevation: 3 },
  menuIcon:       { fontSize: 26 },
  menuLabel:      { color: '#fff', fontSize: 11, textAlign: 'center', marginTop: 6, fontWeight: '600' },
  emptyBox:       { backgroundColor: '#fff', margin: 16, borderRadius: 10,
                    padding: 24, alignItems: 'center' },
  emptyText:      { color: '#95a5a6', fontSize: 14 },
  orderCard:      { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
                    borderRadius: 10, padding: 14, elevation: 2 },
  orderRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum:       { fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },
  statusBadge:    { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:     { color: '#fff', fontSize: 11, fontWeight: '600' },
  orderShop:      { fontSize: 13, color: '#7f8c8d', marginVertical: 4 },
  orderItems:     { fontSize: 13, color: '#7f8c8d' },
  orderTotal:     { fontSize: 15, fontWeight: 'bold', color: '#27ae60' },
});

export default AdminDashboard;