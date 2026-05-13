import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { DatabaseService } from '../services/database';

export default function AdminDashboard({ navigation }: any) {
  const [stats, setStats] = useState({
    todayRevenue: 0, todayOrders: 0, pendingOrders: 0,
    totalProducts: 0, totalCustomers: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'products'|'customers'>('overview');

  const loadData = useCallback(async () => {
    try {
      const [s, p, c] = await Promise.all([
        DatabaseService.getDashboardStats(),
        DatabaseService.getProducts(),
        DatabaseService.getCustomers(),
      ]);
      setStats(s);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>จ.รุ่งชิลลี่</Text>
            <Text style={styles.headerSub}>Admin Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('RoleSelect')}
        >
          <Text style={styles.logoutText}>🚪 ออก</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: '📊 ภาพรวม' },
          { key: 'products', label: '🌶️ สินค้า' },
          { key: 'customers', label: '👥 ลูกค้า' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c0392b']} />}
      >
        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>สถิติวันนี้</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#c0392b' }]}>
                <Text style={styles.statValue}>฿{stats.todayRevenue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>ยอดขายวันนี้</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#e67e22' }]}>
                <Text style={styles.statValue}>{stats.todayOrders}</Text>
                <Text style={styles.statLabel}>ออเดอร์วันนี้</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>สินค้าทั้งหมด</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#2980b9' }]}>
                <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                <Text style={styles.statLabel}>ลูกค้าทั้งหมด</Text>
              </View>
            </View>

            {stats.pendingOrders > 0 && (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>
                  ⚠️ มีออเดอร์รอดำเนินการ {stats.pendingOrders} รายการ
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>เมนูหลัก</Text>
            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.menuIcon}>➕</Text>
                <Text style={styles.menuLabel}>เพิ่มสินค้า</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('AddCustomer')}
              >
                <Text style={styles.menuIcon}>👤</Text>
                <Text style={styles.menuLabel}>เพิ่มลูกค้า</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('ProductManagement')}
              >
                <Text style={styles.menuIcon}>📦</Text>
                <Text style={styles.menuLabel}>จัดการสินค้า</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('CustomerManagement')}
              >
                <Text style={styles.menuIcon}>👥</Text>
                <Text style={styles.menuLabel}>จัดการลูกค้า</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('WeighingStation')}
              >
                <Text style={styles.menuIcon}>⚖️</Text>
                <Text style={styles.menuLabel}>ชั่งน้ำหนัก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('PrinterSettings')}
              >
                <Text style={styles.menuIcon}>🖨️</Text>
                <Text style={styles.menuLabel}>ตั้งค่าเครื่องพิมพ์</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TAB: PRODUCTS ── */}
        {activeTab === 'products' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.sectionTitle}>สินค้าทั้งหมด ({products.length} รายการ)</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.addBtnText}>+ เพิ่ม</Text>
              </TouchableOpacity>
            </View>
            {products.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>ยังไม่มีสินค้า</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AddProduct')}
                >
                  <Text style={styles.emptyBtnText}>+ เพิ่มสินค้าแรก</Text>
                </TouchableOpacity>
              </View>
            ) : (
              products.map(p => (
                <View key={p.id} style={styles.listCard}>
                  <View style={styles.listCardLeft}>
                    <Text style={styles.listCardTitle}>{p.name_th}</Text>
                    <Text style={styles.listCardSub}>{p.name_en} • {p.unit}</Text>
                  </View>
                  <View style={styles.listCardRight}>
                    <Text style={styles.priceRetail}>ปลีก ฿{p.retail_price}</Text>
                    <Text style={styles.priceWholesale}>ส่ง ฿{p.wholesale_price}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB: CUSTOMERS ── */}
        {activeTab === 'customers' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.sectionTitle}>ลูกค้าทั้งหมด ({customers.length} ราย)</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddCustomer')}
              >
                <Text style={styles.addBtnText}>+ เพิ่ม</Text>
              </TouchableOpacity>
            </View>
            {customers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>ยังไม่มีลูกค้า</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AddCustomer')}
                >
                  <Text style={styles.emptyBtnText}>+ เพิ่มลูกค้าคนแรก</Text>
                </TouchableOpacity>
              </View>
            ) : (
              customers.map(c => (
                <View key={c.id} style={styles.listCard}>
                  <View style={styles.listCardLeft}>
                    <Text style={styles.listCardTitle}>{c.name_th}</Text>
                    <Text style={styles.listCardSub}>📞 {c.phone} • {c.owner_name}</Text>
                    {c.notes ? <Text style={styles.listCardNote}>📝 {c.notes}</Text> : null}
                  </View>
                  <View style={styles.listCardRight}>
                    <Text style={styles.creditText}>เครดิต</Text>
                    <Text style={styles.creditValue}>฿{c.credit_limit?.toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#c0392b', fontSize: 16 },
  header: {
    backgroundColor: '#c0392b', paddingTop: 48, paddingBottom: 16,
    paddingHorizontal: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#ffcccc', fontSize: 12 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#c0392b' },
  tabText: { fontSize: 13, color: '#999' },
  tabTextActive: { color: '#c0392b', fontWeight: 'bold' },
  body: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '47%', borderRadius: 12, padding: 16, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  alertCard: {
    backgroundColor: '#fff3cd', borderRadius: 10, padding: 14,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#f39c12',
  },
  alertText: { color: '#856404', fontSize: 14, fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  menuCard: {
    width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  menuIcon: { fontSize: 28, marginBottom: 8 },
  menuLabel: { fontSize: 12, color: '#333', fontWeight: '600', textAlign: 'center' },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: '#c0392b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  listCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  listCardLeft: { flex: 1, marginRight: 10 },
  listCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  listCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  listCardNote: { fontSize: 11, color: '#e67e22', marginTop: 4 },
  listCardRight: { alignItems: 'flex-end' },
  priceRetail: { fontSize: 14, fontWeight: 'bold', color: '#c0392b' },
  priceWholesale: { fontSize: 12, color: '#888', marginTop: 2 },
  creditText: { fontSize: 11, color: '#888' },
  creditValue: { fontSize: 14, fontWeight: 'bold', color: '#27ae60' },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#aaa', marginBottom: 16 },
  emptyBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});