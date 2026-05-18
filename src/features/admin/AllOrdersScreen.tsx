import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert,
  ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";

// ─── helpers ──────────────────────────────────────────────
function statusColor(status: string) {
  switch (status) {
    case 'confirmed':  return '#27ae60';
    case 'pending':    return '#f39c12';
    case 'cancelled':  return '#e74c3c';
    case 'delivered':  return '#2980b9';
    case 'packing':    return '#8e44ad';
    default:           return '#aaa';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'confirmed':  return '✅ ยืนยัน';
    case 'pending':    return '⏳ รอดำเนินการ';
    case 'cancelled':  return '❌ ยกเลิก';
    case 'delivered':  return '🚚 จัดส่งแล้ว';
    case 'packing':    return '📦 กำลังแพ็ค';
    default:           return status;
  }
}

function packStatusLabel(ps: string) {
  switch (ps) {
    case 'waiting': return '🟡 รอแพ็ค';
    case 'packing': return '🔵 กำลังแพ็ค';
    case 'packed':  return '🟢 แพ็คแล้ว';
    default:        return '';
  }
}

function packStatusColor(ps: string) {
  switch (ps) {
    case 'waiting': return '#f39c12';
    case 'packing': return '#2980b9';
    case 'packed':  return '#27ae60';
    default:        return '#ccc';
  }
}

// ─── Main ─────────────────────────────────────────────────
export default function AllOrdersScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [orders, setOrders]         = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'walkin' | 'pre_order'>('all');

  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const loadOrders = () => {
    setLoading(true);
    try {
      // โหลดทั้ง today + รวม pre-orders pending
      const today     = DB.getOrdersToday();
      const pending   = DB.getPendingPackOrders().filter(
        p => !today.find((d: any) => d.id === p.id)
      );
      setOrders([...today, ...pending]);
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
    } catch (e) { console.error(e); }
  };

  const confirmOrder = (orderId: string) => {
    Alert.alert(
      t('confirm_order', 'th'),
      'ยืนยันออเดอร์นี้?',
      [
        { text: t('cancel', 'th'), style: 'cancel' },
        {
          text: t('confirm', 'th'),
          onPress: () => {
            try {
              DB.updateOrderStatus(orderId, 'confirmed');
              loadOrders();
              setSelected(null);
            } catch (e: any) {
              Alert.alert('❌', String(e?.message || e));
            }
          },
        },
      ]
    );
  };

  const cancelOrder = (orderId: string) => {
    Alert.alert(
      t('cancel', 'th'),
      'ยกเลิกออเดอร์นี้?',
      [
        { text: 'ไม่', style: 'cancel' },
        {
          text: t('cancel', 'th'), style: 'destructive',
          onPress: () => {
            try {
              DB.updateOrderStatus(orderId, 'cancelled');
              loadOrders();
              setSelected(null);
            } catch (e: any) {
              Alert.alert('❌', String(e?.message || e));
            }
          },
        },
      ]
    );
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
    const matchSearch = (
      (o.order_number  || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q)
    );
    const matchType = filterType === 'all'
      || (filterType === 'walkin'    && (o.order_type === 'walkin'    || !o.order_type))
      || (filterType === 'pre_order' && o.order_type === 'pre_order');
    return matchSearch && matchType;
  });

  const totalRevenue = filtered
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#e67e22" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            📋 {t('all_orders','th')}{lang !== 'th' ? ` / ${t('all_orders',lang)}` : ''}
          </Text>
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
          placeholder={`🔍 ${t('search','th')}...`}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* ── Filter tabs ── */}
      <View style={s.filterRow}>
        {(['all','walkin','pre_order'] as const).map(ft => (
          <TouchableOpacity
            key={ft}
            style={[s.filterBtn, filterType === ft && s.filterBtnOn]}
            onPress={() => setFilterType(ft)}
          >
            <Text style={[s.filterTxt, filterType === ft && s.filterTxtOn]}>
              {ft === 'all'      ? '📋 ทั้งหมด'
               : ft === 'walkin'  ? '🛒 หน้าร้าน'
               :                   '📅 พรีออเดอร์'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Summary Bar ── */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{filtered.length}</Text>
          <Text style={s.summaryLbl}>{t('orders_today','th')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>฿{totalRevenue.toLocaleString()}</Text>
          <Text style={s.summaryLbl}>{t('revenue_today','th')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>
            {filtered.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={s.summaryLbl}>{t('pending_orders','th')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>
            {filtered.filter(o => o.order_type === 'pre_order' && o.pack_status !== 'packed').length}
          </Text>
          <Text style={s.summaryLbl}>รอแพ็ค</Text>
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
              <Text style={s.emptyTxt}>ไม่มีออเดอร์</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                s.card,
                item.order_type === 'pre_order' && s.cardPreOrder,
              ]}
              onPress={() => openOrder(item)}
              activeOpacity={0.85}
            >
              {/* Row 1: เลขออเดอร์ + status + order_type badge */}
              <View style={s.cardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Text style={s.orderNum}>#{item.order_number?.slice(-8) || item.id?.slice(-8)}</Text>
                  {item.order_type === 'pre_order' && (
                    <View style={s.preOrderBadge}>
                      <Text style={s.preOrderBadgeTxt}>📅 Pre</Text>
                    </View>
                  )}
                </View>
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

              {/* Row 3: pack_status (ถ้าเป็น pre_order) + วันที่นัด */}
              {item.order_type === 'pre_order' && (
                <View style={s.packRow}>
                  {!!item.pack_status && (
                    <View style={[s.packBadge, { borderColor: packStatusColor(item.pack_status) }]}>
                      <Text style={[s.packBadgeTxt, { color: packStatusColor(item.pack_status) }]}>
                        {packStatusLabel(item.pack_status)}
                      </Text>
                    </View>
                  )}
                  {!!item.scheduled_date && (
                    <Text style={s.scheduledTxt}>📅 {item.scheduled_date}</Text>
                  )}
                </View>
              )}

              {/* Row 4: ราคา + เวลา */}
              <View style={s.cardBottom}>
                <Text style={s.orderTime}>
                  🕐 {item.created_at
                    ? new Date(item.created_at).toLocaleString('th-TH', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
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
                <View style={{ flex: 1 }}>
                  <Text style={m.title}>
                    📋 #{selected?.order_number?.slice(-8) || selected?.id?.slice(-8)}
                    {selected?.order_type === 'pre_order' && (
                      <Text style={{ color: '#8e44ad' }}> · พรีออเดอร์</Text>
                    )}
                  </Text>
                  <Text style={m.titleSub}>
                    {selected ? new Date(selected.created_at).toLocaleString('th-TH') : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={m.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ลูกค้า */}
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>👤 {t('customers','th')}</Text>
                <Text style={m.infoVal}>{selected?.customer_name || '-'}</Text>
              </View>

              {/* สถานะ */}
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>📊 Status</Text>
                <Text style={[m.infoVal, { color: statusColor(selected?.status) }]}>
                  {statusLabel(selected?.status)}
                </Text>
              </View>

              {/* Pack Status (ถ้ามี) */}
              {selected?.order_type === 'pre_order' && (
                <View style={m.infoRow}>
                  <Text style={m.infoLbl}>📦 แพ็คสถานะ</Text>
                  <Text style={[m.infoVal, { color: packStatusColor(selected?.pack_status) }]}>
                    {packStatusLabel(selected?.pack_status || 'waiting')}
                  </Text>
                </View>
              )}

              {/* วันที่นัดรับ */}
              {!!selected?.scheduled_date && (
                <View style={m.infoRow}>
                  <Text style={m.infoLbl}>📅 {t('scheduled_date','th')}</Text>
                  <Text style={m.infoVal}>{selected?.scheduled_date}</Text>
                </View>
              )}

              {/* วิธีชำระ */}
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>💳 {t('confirm_pay','th')}</Text>
                <Text style={m.infoVal}>{payLabel(selected?.payment_method)}</Text>
              </View>

              {/* รายการสินค้า */}
              <Text style={m.sectionTitle}>
                🛒 {t('bill_items','th')}
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
                        {oi.requested_kg || oi.quantity_kg} kg × ฿{oi.unit_price}
                        {oi.actual_weight_kg ? `  (จริง: ${oi.actual_weight_kg} kg)` : ''}
                      </Text>
                      {!!oi.item_notes && (
                        <Text style={m.itemNotes}>📝 {oi.item_notes}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={m.itemTotal}>฿{oi.total_price?.toFixed(2) || '0.00'}</Text>
                      {oi.is_packed ? (
                        <Text style={{ fontSize: 11, color: '#27ae60' }}>✅ แพ็คแล้ว</Text>
                      ) : selected?.order_type === 'pre_order' ? (
                        <Text style={{ fontSize: 11, color: '#f39c12' }}>⏳ รอแพ็ค</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* สรุปยอด */}
              <View style={m.totalBox}>
                {(selected?.discount || 0) > 0 && (
                  <View style={m.totalRow}>
                    <Text style={m.totalLbl}>{t('discount','th')}</Text>
                    <Text style={[m.totalVal, { color: '#27ae60' }]}>
                      -฿{selected?.discount?.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[m.totalRow, m.totalRowBig]}>
                  <Text style={m.totalLblBig}>{t('net_total','th')}</Text>
                  <Text style={m.totalValBig}>฿{selected?.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              {selected?.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[m.actionBtn, { backgroundColor: '#27ae60', flex: 1 }]}
                    onPress={() => confirmOrder(selected.id)}
                  >
                    <Text style={m.actionBtnTxt}>✅ ยืนยัน</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[m.actionBtn, { backgroundColor: '#e74c3c', flex: 1 }]}
                    onPress={() => cancelOrder(selected.id)}
                  >
                    <Text style={m.actionBtnTxt}>❌ ยกเลิก</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ปิด */}
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
  safe:         { flex: 1, backgroundColor: '#f0f0f0' },
  header:       { backgroundColor: '#e67e22', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn:      { width: 60, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  refreshBtn:   { width: 60, alignItems: 'flex-end' },
  refreshTxt:   { fontSize: 22 },
  searchBox:    { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, elevation: 1 },
  searchInput:  { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },

  filterRow:    { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, paddingBottom: 8, gap: 6 },
  filterBtn:    { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center' },
  filterBtnOn:  { borderColor: '#e67e22', backgroundColor: '#fff8f0' },
  filterTxt:    { fontSize: 11, color: '#888', fontWeight: '600' },
  filterTxtOn:  { color: '#e67e22' },

  summaryBar:      { backgroundColor: '#fff', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, marginBottom: 2, elevation: 1 },
  summaryItem:     { flex: 1, alignItems: 'center' },
  summaryVal:      { fontSize: 16, fontWeight: 'bold', color: '#e67e22' },
  summaryLbl:      { fontSize: 9, color: '#888', textAlign: 'center', marginTop: 2, lineHeight: 13 },
  summaryDivider:  { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 2 },

  listContent:  { padding: 10, paddingBottom: 24 },
  emptyBox:     { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTxt:     { fontSize: 15, color: '#aaa', textAlign: 'center' },

  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardPreOrder: { borderColor: '#8e44ad', borderLeftWidth: 4, borderLeftColor: '#8e44ad' },

  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNum:     { fontSize: 14, fontWeight: 'bold', color: '#333' },

  preOrderBadge:    { backgroundColor: '#f5edff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  preOrderBadgeTxt: { fontSize: 10, color: '#8e44ad', fontWeight: 'bold' },

  statusBadge:  { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:    { fontSize: 12, fontWeight: 'bold' },

  cardMid:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { fontSize: 13, color: '#555', flex: 1 },
  payMethod:    { fontSize: 12, color: '#888' },

  packRow:        { flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  packBadge:      { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  packBadgeTxt:   { fontSize: 11, fontWeight: '600' },
  scheduledTxt:   { fontSize: 12, color: '#8e44ad' },

  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTime:    { fontSize: 12, color: '#aaa' },
  orderTotal:   { fontSize: 16, fontWeight: 'bold', color: '#e67e22' },
});

const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '94%' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:        { fontSize: 16, fontWeight: 'bold', color: '#333' },
  titleSub:     { fontSize: 12, color: '#aaa', marginTop: 2 },
  closeBtn:     { fontSize: 20, color: '#aaa', fontWeight: 'bold', padding: 4 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  infoLbl:      { fontSize: 13, color: '#888', fontWeight: '600' },
  infoVal:      { fontSize: 13, color: '#333', fontWeight: 'bold', textAlign: 'right', flex: 1, marginLeft: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 14, marginBottom: 8 },
  itemRow:      { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  itemInfo:     { flex: 1 },
  itemNameTh:   { fontSize: 14, fontWeight: 'bold', color: '#333' },
  itemNameSub:  { fontSize: 11, color: '#888', marginTop: 1 },
  itemDetail:   { fontSize: 12, color: '#aaa', marginTop: 2 },
  itemNotes:    { fontSize: 11, color: '#888', marginTop: 2, fontStyle: 'italic' },
  itemTotal:    { fontSize: 14, fontWeight: 'bold', color: '#e67e22', marginLeft: 8 },
  totalBox:     { backgroundColor: '#fef9f5', borderRadius: 10, padding: 12, marginTop: 12 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig:  { borderTopWidth: 1, borderColor: '#e0e0e0', marginTop: 6, paddingTop: 8 },
  totalLbl:     { fontSize: 13, color: '#555' },
  totalVal:     { fontSize: 13, fontWeight: '600', color: '#333' },
  totalLblBig:  { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalValBig:  { fontSize: 20, fontWeight: 'bold', color: '#e67e22' },
  actionBtn:    { borderRadius: 12, paddingVertical: 13, alignItems: 'center', elevation: 2 },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  closeFullBtn: { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  closeFullBtnTxt: { fontSize: 14, color: '#555', fontWeight: '600' },
});
