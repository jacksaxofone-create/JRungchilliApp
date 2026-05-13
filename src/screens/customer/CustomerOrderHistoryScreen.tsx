import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Modal, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DatabaseService } from '../../services/database';
import { tSingle } from '../../i18n/translations';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  pending:   { color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  packing:   { color: '#1e40af', bg: '#dbeafe', icon: '📦' },
  ready:     { color: '#065f46', bg: '#d1fae5', icon: '✅' },
  delivered: { color: '#374151', bg: '#f3f4f6', icon: '🚚' },
};

const PAYMENT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  unpaid:  { color: '#991b1b', bg: '#fee2e2', icon: '❌' },
  paid:    { color: '#065f46', bg: '#d1fae5', icon: '✅' },
  credit:  { color: '#6d28d9', bg: '#ede9fe', icon: '💳' },
  overdue: { color: '#92400e', bg: '#fef3c7', icon: '⚠️' },
};

export const CustomerOrderHistoryScreen: React.FC = () => {
  const { primaryLanguage, secondaryLanguage, currentUser } = useAppStore();
  const t = (key: any) => tSingle(key, primaryLanguage);
  const ts = (key: any) => tSingle(key, secondaryLanguage);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [creditRecords, setCreditRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'credit'>('orders');

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [ordersData, creditData] = await Promise.all([
        DatabaseService.getOrdersByCustomer(currentUser.id),
        DatabaseService.getCreditByCustomer(currentUser.id),
      ]);
      setOrders(ordersData);
      setCreditRecords(creditData);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    const items = await DatabaseService.getOrderItems(order.id);
    setOrderItems(items);
    setShowDetail(true);
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? { color: '#374151', bg: '#f3f4f6', icon: '❓' };

  const getPaymentConfig = (status: string) =>
    PAYMENT_CONFIG[status] ?? { color: '#374151', bg: '#f3f4f6', icon: '❓' };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return dateStr; }
  };

  const totalCredit = creditRecords
    .filter(c => c.status !== 'paid')
    .reduce((sum, c) => sum + (c.amount - c.amount_paid), 0);

  const renderOrder = ({ item }: { item: any }) => {
    const sc = getStatusConfig(item.status);
    const pc = getPaymentConfig(item.payment_status);
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => openOrderDetail(item)}>
        <View style={styles.orderTop}>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.orderMiddle}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.icon} {t(item.status as any)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: pc.bg }]}>
            <Text style={[styles.statusText, { color: pc.color }]}>{pc.icon} {t(item.payment_status as any)}</Text>
          </View>
        </View>
        <View style={styles.orderBottom}>
          <View style={styles.orderInfo}>
            {item.delivery ? (
              <Text style={styles.orderInfoText}>🚚 {t('delivery')}</Text>
            ) : (
              <Text style={styles.orderInfoText}>🏪 {t('pickupAtShop')}</Text>
            )}
            {item.pickup_time ? (
              <Text style={styles.orderInfoText}>⏰ {item.pickup_time}</Text>
            ) : null}
          </View>
          <Text style={styles.orderTotal}>฿{item.total.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCredit = ({ item }: { item: any }) => {
    const pc = getPaymentConfig(item.status);
    const remaining = item.amount - item.amount_paid;
    return (
      <View style={styles.creditCard}>
        <View style={styles.creditTop}>
          <Text style={styles.creditOrderNum}>#{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: pc.bg }]}>
            <Text style={[styles.statusText, { color: pc.color }]}>{pc.icon} {t(item.status as any)}</Text>
          </View>
        </View>
        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>ยอดเต็ม</Text>
          <Text style={styles.creditValue}>฿{item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>ชำระแล้ว</Text>
          <Text style={[styles.creditValue, { color: '#15803d' }]}>฿{item.amount_paid.toLocaleString()}</Text>
        </View>
        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>คงค้าง</Text>
          <Text style={[styles.creditValue, { color: '#dc2626', fontWeight: '800' }]}>฿{remaining.toLocaleString()}</Text>
        </View>
        <View style={styles.creditRow}>
          <Text style={styles.creditLabel}>ครบกำหนด</Text>
          <Text style={styles.creditValue}>{item.due_date}</Text>
        </View>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyText}>{t('selectShop')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📋 {t('orderHistory')}</Text>
          <Text style={styles.headerSub}>🏪 {currentUser.shop_name}</Text>
        </View>
        {totalCredit > 0 && (
          <View style={styles.creditAlertBadge}>
            <Text style={styles.creditAlertText}>💳 ฿{totalCredit.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}>
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            📦 {t('orders')} ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'credit' && styles.tabActive]}
          onPress={() => setActiveTab('credit')}>
          <Text style={[styles.tabText, activeTab === 'credit' && styles.tabTextActive]}>
            💳 {t('credit')} ({creditRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0e7490" />
        </View>
      ) : activeTab === 'orders' ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0e7490']} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>{t('noOrders')}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={creditRecords}
          keyExtractor={item => item.id}
          renderItem={renderCredit}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0e7490']} />}
          ListHeaderComponent={
            totalCredit > 0 ? (
              <View style={styles.creditSummaryBox}>
                <Text style={styles.creditSummaryLabel}>💳 ยอดเครดิตคงค้างทั้งหมด</Text>
                <Text style={styles.creditSummaryValue}>฿{totalCredit.toLocaleString()}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>{t('noOrders')}</Text>
            </View>
          }
        />
      )}

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                📋 #{selectedOrder?.order_number}
              </Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {selectedOrder && (
                <>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>{t('orderNumber')}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.order_number}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>วันที่สั่ง</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>{t('pickupTime')}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.pickup_time || '-'}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>{t('notes')}</Text>
                    <Text style={styles.detailValue}>{selectedOrder.notes || '-'}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSectionTitle}>🌶️ รายการสินค้า</Text>
                  {orderItems.map(item => (
                    <View key={item.id} style={styles.detailItem}>
                      <Text style={styles.detailItemName}>{item.product_name_th}</Text>
                      <Text style={styles.detailItemSub}>
                        {item.quantity_kg} กก. × ฿{item.unit_price} = ฿{item.total_price.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.detailDivider} />
                  <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>{t('total')}</Text>
                    <Text style={styles.detailTotalValue}>฿{selectedOrder.total.toLocaleString()}</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfeff' },
  header: {
    backgroundColor: '#0e7490', paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#a5f3fc', marginTop: 2 },
  creditAlertBadge: { backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  creditAlertText: { color: '#6d28d9', fontWeight: '800', fontSize: 14 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#0e7490' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#0e7490' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    elevation: 1, borderWidth: 1, borderColor: '#cffafe',
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNumber: { fontSize: 16, fontWeight: '800', color: '#0e7490' },
  orderDate: { fontSize: 12, color: '#6b7280' },
  orderMiddle: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderInfo: { gap: 2 },
  orderInfoText: { fontSize: 12, color: '#6b7280' },
  orderTotal: { fontSize: 20, fontWeight: '800', color: '#0e7490' },
  creditCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    elevation: 1, borderWidth: 1, borderColor: '#ede9fe',
  },
  creditTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  creditOrderNum: { fontSize: 15, fontWeight: '800', color: '#6d28d9' },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  creditLabel: { fontSize: 13, color: '#6b7280' },
  creditValue: { fontSize: 14, fontWeight: '700', color: '#374151' },
  creditSummaryBox: {
    backgroundColor: '#ede9fe', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  creditSummaryLabel: { fontSize: 14, fontWeight: '700', color: '#6d28d9' },
  creditSummaryValue: { fontSize: 22, fontWeight: '800', color: '#6d28d9' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%', padding: 20,
  },
  detailHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#0e7490' },
  closeBtn: { fontSize: 20, color: '#6b7280', padding: 4 },
  detailInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  detailLabel: { fontSize: 14, color: '#6b7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },
  detailDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8 },
  detailItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailItemName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  detailItemSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  detailTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  detailTotalLabel: { fontSize: 18, fontWeight: '700', color: '#374151' },
  detailTotalValue: { fontSize: 24, fontWeight: '800', color: '#0e7490' },
});