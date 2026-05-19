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
import {
  CHILLI, FONT, SPACE, RADIUS, shadow,
  orderStatusColor, orderStatusLabel,
  packStatusColor, packStatusLabel,
} from "../../core/theme";

// ─── Main ─────────────────────────────────────────────────────────────────────
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
      const today   = DB.getOrdersToday();
      const pending = DB.getPendingPackOrders().filter(
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

  // ─── Status Actions ────────────────────────────────────────────────────────
  const updateStatus = (orderId: string, newStatus: string, label: string) => {
    Alert.alert(
      `${label}?`,
      `เปลี่ยนสถานะเป็น "${label}"`,
      [
        { text: t('cancel','th'), style: 'cancel' },
        {
          text: t('confirm','th'),
          onPress: () => {
            try {
              DB.updateOrderStatus(orderId, newStatus);
              loadOrders();
              setSelected((prev: any) => prev ? { ...prev, status: newStatus } : null);
            } catch (e: any) {
              Alert.alert('❌', String(e?.message || e));
            }
          },
        },
      ]
    );
  };

  const getNextStatusActions = (order: any) => {
    const actions: { label: string; status: string; color: string }[] = [];
    switch (order.status) {
      case 'pending':
        actions.push({ label: '✅ ยืนยัน',     status: 'confirmed',     color: CHILLI.green });
        actions.push({ label: '❌ ยกเลิก',      status: 'cancelled',     color: CHILLI.flame });
        break;
      case 'confirmed':
        actions.push({ label: '📦 เริ่มแพ็ค',   status: 'packing',       color: CHILLI.purple });
        actions.push({ label: '❌ ยกเลิก',      status: 'cancelled',     color: CHILLI.flame });
        break;
      case 'packing':
        actions.push({ label: '🟢 พร้อมส่ง',    status: 'ready_to_ship', color: CHILLI.blue });
        break;
      case 'ready_to_ship':
        actions.push({ label: '✅ ส่งแล้ว',     status: 'delivered',     color: CHILLI.dark });
        break;
    }
    return actions;
  };

  const payLabel = (method: string) => {
    switch (method) {
      case 'cash':     return `💵 ${t('cash','th')}${lang !== 'th' ? ` / ${t('cash',lang)}` : ''}`;
      case 'transfer': return `🏦 ${t('transfer','th')}${lang !== 'th' ? ` / ${t('transfer',lang)}` : ''}`;
      case 'credit':   return `💳 ${t('credit','th')}${lang !== 'th' ? ` / ${t('credit',lang)}` : ''}`;
      default:         return method || '-';
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

  const countByStatus = (st: string) => filtered.filter(o => o.status === st).length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>📋 ออเดอร์ทั้งหมด</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('orders','th')}</Text>}
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={loadOrders} activeOpacity={0.75}>
          <Text style={{ fontSize: 22 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={`${t('search','th')} ชื่อร้าน / เลขออเดอร์`}
            placeholderTextColor={CHILLI.textLight}
          />
        </View>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={s.filterRow}>
        {([
          { key: 'all',       label: '📋 ทั้งหมด' },
          { key: 'walkin',    label: '🛒 หน้าร้าน' },
          { key: 'pre_order', label: '📅 พรีออเดอร์' },
        ] as const).map(ft => (
          <TouchableOpacity
            key={ft.key}
            style={[s.filterBtn, filterType === ft.key && s.filterBtnOn]}
            onPress={() => setFilterType(ft.key)}
            activeOpacity={0.75}
          >
            <Text style={[s.filterTxt, filterType === ft.key && s.filterTxtOn]}>
              {ft.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Status Flow Strip (5 ขั้น) ── */}
      <View style={s.statusStrip}>
        {[
          { st: 'pending',       emoji: '🟡', short: 'รอยืนยัน' },
          { st: 'confirmed',     emoji: '🔵', short: 'ยืนยัน' },
          { st: 'packing',       emoji: '🟠', short: 'แพ็ค' },
          { st: 'ready_to_ship', emoji: '🟢', short: 'พร้อมส่ง' },
          { st: 'delivered',     emoji: '✅', short: 'ส่งแล้ว' },
        ].map((item, idx, arr) => {
          const cnt = countByStatus(item.st);
          return (
            <React.Fragment key={item.st}>
              <TouchableOpacity
                style={s.statusChip}
                onPress={() => setSearch(item.short)}
                activeOpacity={0.7}
              >
                <Text style={s.statusChipEmoji}>{item.emoji}</Text>
                <Text style={s.statusChipLbl}>{item.short}</Text>
                {cnt > 0 && (
                  <View style={[s.statusCount, { backgroundColor: orderStatusColor(item.st) }]}>
                    <Text style={s.statusCountTxt}>{cnt}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {idx < arr.length - 1 && <Text style={s.statusArrow}>›</Text>}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Summary Bar ── */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{filtered.length}</Text>
          <Text style={s.summaryLbl}>{t('orders_today','th')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: CHILLI.green }]}>
            ฿{totalRevenue.toLocaleString()}
          </Text>
          <Text style={s.summaryLbl}>{t('revenue_today','th')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: CHILLI.amber }]}>
            {countByStatus('pending')}
          </Text>
          <Text style={s.summaryLbl}>รอยืนยัน</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: CHILLI.blue }]}>
            {countByStatus('ready_to_ship')}
          </Text>
          <Text style={s.summaryLbl}>พร้อมส่ง</Text>
        </View>
      </View>

      {/* ── Order List ── */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={CHILLI.red} size="large" />
          <Text style={{ color: CHILLI.textSecondary, marginTop: 12 }}>{t('loading','th')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>ไม่มีออเดอร์</Text>
              <Text style={s.emptyHint}>ลองเปลี่ยน filter หรือกด 🔄 refresh</Text>
            </View>
          }
          renderItem={({ item }) => {
            const accentColor = orderStatusColor(item.status);
            return (
              <TouchableOpacity
                style={[s.card, { borderLeftColor: accentColor }]}
                onPress={() => openOrder(item)}
                activeOpacity={0.82}
              >
                {/* Top Row */}
                <View style={s.cardTop}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.orderNum}>
                      #{item.order_number?.slice(-6) || item.id?.slice(-6)}
                    </Text>
                    {item.order_type === 'pre_order' && (
                      <View style={s.preOrderBadge}>
                        <Text style={s.preOrderBadgeTxt}>📅 Pre</Text>
                      </View>
                    )}
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: accentColor + '20' }]}>
                    <Text style={[s.statusTxt, { color: accentColor }]}>
                      {orderStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                {/* Customer + Payment */}
                <View style={s.cardMid}>
                  <Text style={s.customerName} numberOfLines={1}>
                    👤 {item.customer_name || 'ลูกค้าทั่วไป'}
                  </Text>
                  <Text style={s.payMethod}>{payLabel(item.payment_method)}</Text>
                </View>

                {/* Pack Status row (pre_order) */}
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

                {/* Bottom Row */}
                <View style={s.cardBottom}>
                  <Text style={s.orderTime}>
                    🕐 {item.created_at
                      ? new Date(item.created_at).toLocaleString('th-TH', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '-'}
                  </Text>
                  <Text style={[s.orderTotal, { color: accentColor === CHILLI.amber ? CHILLI.orange : accentColor }]}>
                    ฿{(item.total || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ─── Order Detail Modal ─────────────────────────────────────────────── */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Modal Header */}
              <View style={[m.header, { backgroundColor: orderStatusColor(selected?.status) }]}>
                <View style={{ flex: 1 }}>
                  <Text style={m.title}>
                    📋 #{selected?.order_number?.slice(-6) || selected?.id?.slice(-6)}
                    {selected?.order_type === 'pre_order' && '  📅 Pre-order'}
                  </Text>
                  <Text style={m.titleSub}>
                    {orderStatusLabel(selected?.status)}
                    {selected?.created_at
                      ? `  •  ${new Date(selected.created_at).toLocaleString('th-TH')}`
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)} activeOpacity={0.75}>
                  <Text style={m.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Info Rows */}
              <View style={m.infoSection}>
                <View style={m.infoRow}>
                  <Text style={m.infoLbl}>👤 {t('customers','th')}</Text>
                  <Text style={m.infoVal}>{selected?.customer_name || 'ลูกค้าทั่วไป'}</Text>
                </View>
                <View style={m.infoRow}>
                  <Text style={m.infoLbl}>💳 การชำระ</Text>
                  <Text style={m.infoVal}>{payLabel(selected?.payment_method)}</Text>
                </View>
                {selected?.order_type === 'pre_order' && !!selected?.pack_status && (
                  <View style={m.infoRow}>
                    <Text style={m.infoLbl}>📦 สถานะแพ็ค</Text>
                    <Text style={[m.infoVal, { color: packStatusColor(selected?.pack_status) }]}>
                      {packStatusLabel(selected?.pack_status)}
                    </Text>
                  </View>
                )}
                {!!selected?.scheduled_date && (
                  <View style={m.infoRow}>
                    <Text style={m.infoLbl}>📅 {t('scheduled_date','th')}</Text>
                    <Text style={m.infoVal}>{selected?.scheduled_date}</Text>
                  </View>
                )}
              </View>

              {/* Status Flow (5 ขั้น) */}
              <View style={m.statusFlow}>
                {[
                  { st: 'pending',       emoji: '🟡', lbl: 'รอยืนยัน' },
                  { st: 'confirmed',     emoji: '🔵', lbl: 'ยืนยัน' },
                  { st: 'packing',       emoji: '🟠', lbl: 'แพ็ค' },
                  { st: 'ready_to_ship', emoji: '🟢', lbl: 'พร้อมส่ง' },
                  { st: 'delivered',     emoji: '✅', lbl: 'ส่งแล้ว' },
                ].map((step, idx, arr) => {
                  const statusOrder = ['pending','confirmed','packing','ready_to_ship','delivered','cancelled'];
                  const curIdx  = statusOrder.indexOf(selected?.status);
                  const stepIdx = statusOrder.indexOf(step.st);
                  const isDone  = stepIdx <= curIdx;
                  const isCur   = step.st === selected?.status;
                  return (
                    <React.Fragment key={step.st}>
                      <View style={[m.flowStep, isCur && m.flowStepCur, isDone && !isCur && m.flowStepDone]}>
                        <Text style={m.flowEmoji}>{step.emoji}</Text>
                        <Text style={[m.flowLbl, isCur && m.flowLblCur]}>{step.lbl}</Text>
                      </View>
                      {idx < arr.length - 1 && (
                        <Text style={[m.flowArrow, isDone && idx < curIdx && m.flowArrowDone]}>›</Text>
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Products */}
              <Text style={m.sectionTitle}>🛒 {t('bill_items','th')}</Text>
              {orderItems.map((oi, i) => {
                const nameTh  = oi.product_name_th || '-';
                const nameSec = lang !== 'th'
                  ? (lang === 'mm' ? oi.product_name_mm
                  : lang === 'en' ? oi.product_name_en
                  : oi.product_name_cn) || ''
                  : '';
                return (
                  <View key={oi.id || i} style={m.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={m.itemNameTh} numberOfLines={1}>{nameTh}</Text>
                      {!!nameSec && <Text style={m.itemNameSub}>{nameSec}</Text>}
                      <Text style={m.itemDetail}>
                        {oi.requested_kg || oi.quantity_kg} kg × ฿{oi.unit_price}
                        {oi.actual_weight_kg ? `  (จริง: ${oi.actual_weight_kg} kg)` : ''}
                      </Text>
                      {!!oi.item_notes && <Text style={m.itemNotes}>📝 {oi.item_notes}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={m.itemTotal}>฿{oi.total_price?.toFixed(2) || '0.00'}</Text>
                      {oi.is_packed ? (
                        <Text style={m.packedTxt}>✅ แพ็คแล้ว</Text>
                      ) : selected?.order_type === 'pre_order' ? (
                        <Text style={m.waitingTxt}>⏳ รอแพ็ค</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* Total */}
              <View style={m.totalBox}>
                {(selected?.discount || 0) > 0 && (
                  <View style={m.totalRow}>
                    <Text style={m.totalLbl}>{t('discount','th')}</Text>
                    <Text style={[m.totalVal, { color: CHILLI.green }]}>
                      -฿{selected?.discount?.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[m.totalRow, m.totalRowBig]}>
                  <Text style={m.totalLblBig}>{t('net_total','th')}</Text>
                  <Text style={m.totalValBig}>฿{selected?.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              {/* Action Buttons — ตาม 5-status flow */}
              {getNextStatusActions(selected || {}).length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  {getNextStatusActions(selected || {}).map((act) => (
                    <TouchableOpacity
                      key={act.status}
                      style={[m.actionBtn, { backgroundColor: act.color, flex: 1 }]}
                      onPress={() => updateStatus(selected.id, act.status, act.label)}
                      activeOpacity={0.82}
                    >
                      <Text style={m.actionBtnTxt}>{act.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Close */}
              <TouchableOpacity style={m.closeFullBtn} onPress={() => setSelected(null)} activeOpacity={0.75}>
                <Text style={m.closeFullBtnTxt}>
                  {t('close','th')}{lang !== 'th' ? ` / ${t('close',lang)}` : ''}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  header: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm + 2,
    ...shadow(3),
  },
  backBtn:    { width: 64, paddingVertical: 6 },
  backTxt:    { color: '#fff', fontSize: FONT.size.base, fontWeight: FONT.weight.semibold },
  headerTitle:{ fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: '#fff' },
  headerSub:  { fontSize: FONT.size.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  refreshBtn: { width: 44, alignItems: 'flex-end' },

  searchWrap: {
    backgroundColor: CHILLI.white,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    ...shadow(1),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHILLI.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: CHILLI.borderLight,
    paddingHorizontal: SPACE.sm,
    gap: 6,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: FONT.size.md,
    color: CHILLI.textPrimary,
  },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: CHILLI.white,
    paddingHorizontal: SPACE.sm,
    paddingBottom: SPACE.sm,
    gap: 6,
  },
  filterBtn: {
    flex: 1, paddingVertical: 7, borderRadius: RADIUS.sm,
    borderWidth: 1.5, borderColor: CHILLI.borderLight,
    alignItems: 'center', backgroundColor: '#fafafa',
  },
  filterBtnOn: { borderColor: CHILLI.red, backgroundColor: '#fff0ec' },
  filterTxt:   { fontSize: 11, color: CHILLI.textSecondary, fontWeight: FONT.weight.semibold },
  filterTxtOn: { color: CHILLI.red, fontWeight: FONT.weight.bold },

  // Status Strip
  statusStrip: {
    backgroundColor: CHILLI.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm - 2,
    borderBottomWidth: 1,
    borderColor: CHILLI.borderLight,
    gap: 2,
  },
  statusChip: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    position: 'relative',
  },
  statusChipEmoji: { fontSize: 14 },
  statusChipLbl:   { fontSize: 9, color: CHILLI.textSecondary, marginTop: 1, fontWeight: FONT.weight.semibold },
  statusArrow:     { fontSize: 12, color: CHILLI.textLight },
  statusCount: {
    position: 'absolute', top: -2, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  statusCountTxt: { fontSize: 9, color: '#fff', fontWeight: FONT.weight.bold },

  // Summary Bar
  summaryBar: {
    backgroundColor: CHILLI.white,
    flexDirection: 'row',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderColor: CHILLI.borderLight,
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryVal:     { fontSize: FONT.size.lg, fontWeight: FONT.weight.extrabold, color: CHILLI.textPrimary },
  summaryLbl:     { fontSize: 9, color: CHILLI.textLight, textAlign: 'center', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: CHILLI.borderLight, marginHorizontal: 2 },

  // List
  listContent:  { padding: SPACE.md, paddingBottom: 28 },
  emptyBox:     { alignItems: 'center', paddingVertical: 56 },
  emptyIcon:    { fontSize: 52, marginBottom: 12 },
  emptyTitle:   { fontSize: FONT.size.lg, color: CHILLI.textSecondary, fontWeight: FONT.weight.semibold },
  emptyHint:    { fontSize: FONT.size.sm, color: CHILLI.textLight, marginTop: 6 },

  // Order Card
  card: {
    backgroundColor: CHILLI.white,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    marginBottom: SPACE.sm,
    borderLeftWidth: 4,
    ...shadow(2),
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNum:   { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary },

  preOrderBadge:    { backgroundColor: '#f5edff', borderRadius: RADIUS.sm, paddingHorizontal: 7, paddingVertical: 2 },
  preOrderBadgeTxt: { fontSize: 10, color: CHILLI.purple, fontWeight: FONT.weight.bold },

  statusBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:   { fontSize: 11, fontWeight: FONT.weight.bold },

  cardMid:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName:{ fontSize: FONT.size.sm, color: CHILLI.textSecondary, flex: 1 },
  payMethod:   { fontSize: 11, color: CHILLI.textLight },

  packRow:       { flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' },
  packBadge:     { borderWidth: 1.5, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  packBadgeTxt:  { fontSize: 10, fontWeight: FONT.weight.semibold },
  scheduledTxt:  { fontSize: 11, color: CHILLI.purple },

  cardBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTime:   { fontSize: 11, color: CHILLI.textLight },
  orderTotal:  { fontSize: FONT.size.lg, fontWeight: FONT.weight.extrabold },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  box: {
    backgroundColor: CHILLI.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACE.lg,
    maxHeight: '94%',
    ...shadow(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: -SPACE.lg,
    marginTop: -SPACE.lg,
    padding: SPACE.lg,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    marginBottom: SPACE.md,
  },
  title:   { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: '#fff' },
  titleSub:{ fontSize: FONT.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  closeBtn:{ fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: FONT.weight.bold, padding: 4 },

  infoSection: {
    backgroundColor: CHILLI.cream,
    borderRadius: RADIUS.md,
    padding: SPACE.sm,
    marginBottom: SPACE.md,
  },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLbl:  { fontSize: FONT.size.sm, color: CHILLI.textSecondary, fontWeight: FONT.weight.semibold },
  infoVal:  { fontSize: FONT.size.sm, color: CHILLI.textPrimary, fontWeight: FONT.weight.bold, flex: 1, textAlign: 'right', marginLeft: 8 },

  // Status flow
  statusFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHILLI.cream,
    borderRadius: RADIUS.md,
    padding: SPACE.sm,
    marginBottom: SPACE.md,
    gap: 2,
    flexWrap: 'wrap',
  },
  flowStep: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    opacity: 0.45,
  },
  flowStepCur: {
    backgroundColor: CHILLI.red + '18',
    opacity: 1,
    borderWidth: 1.5,
    borderColor: CHILLI.red,
  },
  flowStepDone: { opacity: 0.7 },
  flowEmoji:   { fontSize: 14 },
  flowLbl:     { fontSize: 9, color: CHILLI.textSecondary, marginTop: 1, fontWeight: FONT.weight.semibold },
  flowLblCur:  { color: CHILLI.red, fontWeight: FONT.weight.bold },
  flowArrow:   { fontSize: 14, color: CHILLI.textLight },
  flowArrowDone: { color: CHILLI.green },

  sectionTitle:{ fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary, marginBottom: SPACE.sm },

  itemRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACE.sm, borderBottomWidth: 1, borderColor: CHILLI.grayLight },
  itemNameTh:  { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary },
  itemNameSub: { fontSize: FONT.size.xs, color: CHILLI.textSecondary, marginTop: 1 },
  itemDetail:  { fontSize: FONT.size.sm, color: CHILLI.textLight, marginTop: 2 },
  itemNotes:   { fontSize: 11, color: CHILLI.textSecondary, marginTop: 2, fontStyle: 'italic' },
  itemTotal:   { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: CHILLI.orange, marginLeft: 8 },
  packedTxt:   { fontSize: 10, color: CHILLI.green, marginTop: 2 },
  waitingTxt:  { fontSize: 10, color: CHILLI.amber, marginTop: 2 },

  totalBox:    { backgroundColor: '#fff8f0', borderRadius: RADIUS.md, padding: SPACE.md, marginTop: SPACE.md },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowBig: { borderTopWidth: 1, borderColor: CHILLI.borderLight, marginTop: 6, paddingTop: 8 },
  totalLbl:    { fontSize: FONT.size.sm, color: CHILLI.textSecondary },
  totalVal:    { fontSize: FONT.size.sm, fontWeight: FONT.weight.semibold, color: CHILLI.textPrimary },
  totalLblBig: { fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary },
  totalValBig: { fontSize: FONT.size['2xl'], fontWeight: FONT.weight.extrabold, color: CHILLI.orange },

  actionBtn:      { borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', ...shadow(2) },
  actionBtnTxt:   { color: '#fff', fontWeight: FONT.weight.bold, fontSize: FONT.size.md },
  closeFullBtn:   { backgroundColor: CHILLI.grayLight, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: SPACE.md },
  closeFullBtnTxt:{ fontSize: FONT.size.md, color: CHILLI.textSecondary, fontWeight: FONT.weight.semibold },
});
