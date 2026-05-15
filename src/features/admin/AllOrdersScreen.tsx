import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";

export default function AllOrdersScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [orders, setOrders]         = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    loadOrders();
  }, []));

  const loadOrders = () => {
    setLoading(true);
    try {
      setOrders(DB.getOrdersToday());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openOrder = (order: any) => {
    try {
      setOrderItems(DB.getOrderItems(order.id));
      setSelected(order);
    } catch (e) {
      console.error(e);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed':  return '#27ae60';
      case 'pending':    return '#f39c12';
      case 'cancelled':  return '#e74c3c';
      case 'delivered':  return '#2980b9';
      default:           return '#aaa';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':  return '✅ ยืนยัน';
      case 'pending':    return '⏳ รอดำเนินการ';
      case 'cancelled':  return '❌ ยกเลิก';
      case 'delivered':  return '🚚 จัดส่งแล้ว';
      default:           return status;
    }
  };

  const payLabel = (method: string) => {
    switch (method) {
      case 'cash':     return `💵 ${t('cash','th')}${lang !== 'th' ? ` / ${t('cash',lang)}` : ''}`;
      case 'transfer': return `🏦 ${t('transfer','th')}${lang !== 'th' ? ` / ${t('transfer',lang)}` : ''}`;
      case 'credit':   return `💳 ${t('credit','th')}${lang !== 'th' ? ` / ${t('credit',lang)}` : ''}`;
      default:         return method;
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      (o.order_number   || '').toLowerCase().includes(q) ||
      (o.customer_name  || '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#e67e22" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>📋 {t('orders','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('orders', lang)}</Text>}
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={loadOrders}>
          <Text style={s.refreshTxt}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`🔍 ${t('search','th')}${lang !== 'th' ? ` / ${t('search',lang)}` : ''}...`}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* ── Summary Bar ── */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{filtered.length}</Text>
          <Text style={s.summaryLbl}>
            {t('orders_today','th')}{lang !== 'th' ? `\n${t('orders_today',lang)}` : ''}
          </Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>฿{totalRevenue.toLocaleString()}</Text>
          <Text style={s.summaryLbl}>
            {t('revenue_today','th')}{lang !== 'th' ? `\n${t('revenue_today',lang)}` : ''}
          </Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>
            {filtered.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={s.summaryLbl}>
            {t('pending_orders','th')}{lang !== 'th' ? `\n${t('pending_orders',lang)}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Order List ── */}
      {loading ? (
        <ActivityIndicator color="#e67e22" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTxt}>
                ไม่มีออเดอร์วันนี้{lang !== 'th' ? `\n${t('orders',lang)}` : ''}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => openOrder(item)}
              activeOpacity={0.85}
            >
              {/* Row 1: เลขออเดอร์ + status */}
              <View style={s.cardTop}>
                <Text style={s.orderNum}>#{item.order_number?.slice(-8) || item.id?.slice(-8)}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Text style={[s.statusTxt, { color: statusColor(item.status) }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              </View>

              {/* Row 2: ลูกค้า + วิธีจ่าย */}
              <View style={s.cardMid}>
                <Text style={s.customerName} numberOfLines={1}>
                  👤 {item.customer_name || 'ลูกค้าทั่วไป'}
                </Text>
                <Text style={s.payMethod}>{payLabel(item.payment_method)}</Text>
              </View>

              {/* Row 3: ราคา + เวลา */}
              <View style={s.cardBottom}>
                <Text style={s.orderTime}>
                  🕐 {item.created_at
                    ? new Date(item.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </Text>
                <Text style={s.orderTotal}>฿{(item.total || 0).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ─── Order Detail Modal ─── */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Header */}
              <View style={m.header}>
                <View>
                  <Text style={m.title}>
                    📋 #{selected?.order_number?.slice(-8) || selected?.id?.slice(-8)}
                  </Text>
                  <Text style={m.titleSub}>
                    {selected
                      ? new Date(selected.created_at).toLocaleString('th-TH')
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={m.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ลูกค้า + สถานะ */}
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>
                  👤 {t('customers','th')}{lang !== 'th' ? ` / ${t('customers',lang)}` : ''}
                </Text>
                <Text style={m.infoVal}>{selected?.customer_name || '-'}</Text>
              </View>
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>📊 Status</Text>
                <Text style={[m.infoVal, { color: statusColor(selected?.status) }]}>
                  {statusLabel(selected?.status)}
                </Text>
              </View>
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>
                  💳 {t('confirm_pay','th')}{lang !== 'th' ? ` / ${t('confirm_pay',lang)}` : ''}
                </Text>
                <Text style={m.infoVal}>{payLabel(selected?.payment_method)}</Text>
              </View>

              {/* รายการสินค้า */}
              <Text style={m.sectionTitle}>
                🛒 {t('bill_items','th')}{lang !== 'th' ? ` / ${t('bill_items',lang)}` : ''}
              </Text>
              {orderItems.map((oi, i) => {
                const nameTh  = oi.product_name_th || '-';
                const nameSec = lang !== 'th'
                  ? (lang === 'mm' ? oi.product_name_mm
                  : lang === 'en' ? oi.product_name_en
                  : oi.product_name_cn) || ''
                  : '';
                return (
                  <View key={oi.id || i} style={m.itemRow}>
                    <View style={m.itemInfo}>
                      <Text style={m.itemNameTh} numberOfLines={1}>{nameTh}</Text>
                      {!!nameSec && (
                        <Text style={m.itemNameSub} numberOfLines={1}>{nameSec}</Text>
                      )}
                      <Text style={m.itemDetail}>
                        {oi.quantity_kg} kg × ฿{oi.unit_price}
                      </Text>
                    </View>
                    <Text style={m.itemTotal}>฿{oi.total_price?.toFixed(2) || '0.00'}</Text>
                  </View>
                );
              })}

              {/* สรุป */}
              <View style={m.totalBox}>
                <View style={m.totalRow}>
                  <Text style={m.totalLbl}>
                    {t('total','th')}{lang !== 'th' ? ` / ${t('total',lang)}` : ''}
                  </Text>
                  <Text style={m.totalVal}>฿{selected?.subtotal?.toFixed(2) || '0.00'}</Text>
                </View>
                {(selected?.discount || 0) > 0 && (
                  <View style={m.totalRow}>
                    <Text style={m.totalLbl}>
                      {t('discount','th')}{lang !== 'th' ? ` / ${t('discount',lang)}` : ''}
                    </Text>
                    <Text style={[m.totalVal, { color: '#27ae60' }]}>
                      -฿{selected?.discount?.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[m.totalRow, m.totalRowBig]}>
                  <Text style={m.totalLblBig}>
                    {t('net_total','th')}{lang !== 'th' ? ` / ${t('net_total',lang)}` : ''}
                  </Text>
                  <Text style={m.totalValBig}>฿{selected?.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              {/* ปุ่มปิด */}
              <TouchableOpacity style={m.closeFullBtn} onPress={() => setSelected(null)}>
                <Text style={m.closeFullBtnTxt}>
                  {t('cancel','th')}{lang !== 'th' ? ` / ${t('cancel',lang)}` : ''}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#e67e22', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  refreshBtn: { width: 60, alignItems: 'flex-end' },
  refreshTxt: { fontSize: 22 },
  searchBox: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, elevation: 1 },
  searchInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },
  summaryBar: { backgroundColor: '#fff', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, marginBottom: 2, elevation: 1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: 'bold', color: '#e67e22' },
  summaryLbl: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2, lineHeight: 14 },
  summaryDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  listContent: { padding: 10, paddingBottom: 24 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNum: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt: { fontSize: 12, fontWeight: 'bold' },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 13, color: '#555', flex: 1 },
  payMethod: { fontSize: 12, color: '#888' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTime: { fontSize: 12, color: '#aaa' },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#e67e22' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  titleSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  closeBtn: { fontSize: 20, color: '#aaa', fontWeight: 'bold', padding: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  infoLbl: { fontSize: 13, color: '#888', fontWeight: '600' },
  infoVal: { fontSize: 13, color: '#333', fontWeight: 'bold', textAlign: 'right', flex: 1, marginLeft: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 14, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  itemInfo: { flex: 1 },
  itemNameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  itemNameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  itemDetail: { fontSize: 12, color: '#aaa', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#e67e22', marginLeft: 8 },
  totalBox: { backgroundColor: '#fef9f5', borderRadius: 10, padding: 12, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig: { borderTopWidth: 1, borderColor: '#e0e0e0', marginTop: 6, paddingTop: 8 },
  totalLbl: { fontSize: 13, color: '#555' },
  totalVal: { fontSize: 13, fontWeight: '600', color: '#333' },
  totalLblBig: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalValBig: { fontSize: 20, fontWeight: 'bold', color: '#e67e22' },
  closeFullBtn: { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  closeFullBtnTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
});