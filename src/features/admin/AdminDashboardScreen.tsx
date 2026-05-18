import React, { useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '🇹🇭' },
  { code: 'mm', flag: '🇲🇲' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'cn', flag: '🇨🇳' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { lang, setLang, logout, settings } = useAppStore();
  const [stats, setStats] = React.useState({
    revenueToday: 0, ordersToday: 0, pendingOrders: 0, overdueCredit: 0,
  });
  const [productCount, setProductCount] = React.useState(0);
  const [customerCount, setCustomerCount] = React.useState(0);
  const [cashierPin, setCashierPin] = React.useState('----');
  const [showPin, setShowPin] = React.useState(false);

  useFocusEffect(useCallback(() => {
    try {
      const s = DB.getDashboardStats();
      setStats(s);
      setProductCount(DB.getAllProducts().length);
      setCustomerCount(DB.getAllCustomers().length);
      // ดึง Cashier PIN ปัจจุบัน (หมุนอัตโนมัติถ้าครบ 5 วัน)
      const pin = DB.rotateCashierPinIfNeeded();
      setCashierPin(pin);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, []));

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')}\n${t(key, lang)}` : t(key, 'th');

  const lblInline = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#1a252f" barStyle="light-content" />

      {/* ── Navbar ── */}
      <View style={s.navbar}>
        <View style={s.navLeft}>
          <Text style={s.navTitle}>👑 {t('role_admin','th')}</Text>
          {lang !== 'th' && <Text style={s.navSub}>{t('role_admin', lang)}</Text>}
        </View>
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[s.langBtn, lang === l.code && s.langBtnOn]}
              onPress={() => setLang(l.code)}
            >
              <Text style={s.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() =>
          Alert.alert('ออกจากระบบ', 'ต้องการออก?', [
            { text: t('cancel','th'), style: 'cancel' },
            { text: t('confirm','th'), onPress: logout },
          ])
        }>
          <Text style={s.logoutTxt}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* ── Shop Name ── */}
        <View style={s.shopBanner}>
          <Text style={s.shopName}>🌶️ {settings?.shop_name || 'J.Rung Chilli'}</Text>
          <Text style={s.shopSub}>Mae Sot · {t('dashboard','th')}{lang !== 'th' ? ` / ${t('dashboard',lang)}` : ''}</Text>
        </View>

        {/* ── Stats Grid (กดได้เพื่อ drill-down) ── */}
        <View style={s.statsGrid}>
          <TouchableOpacity
            style={[s.statCard, { backgroundColor: '#27ae60' }]}
            onPress={() => navigation.navigate('AllOrders')}
            activeOpacity={0.85}
          >
            <Text style={s.statIcon}>💰</Text>
            <Text style={s.statVal}>฿{stats.revenueToday.toLocaleString()}</Text>
            <Text style={s.statLbl}>{t('revenue_today','th')}</Text>
            {lang !== 'th' && <Text style={s.statSub}>{t('revenue_today', lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.statCard, { backgroundColor: '#2980b9' }]}
            onPress={() => navigation.navigate('AllOrders')}
            activeOpacity={0.85}
          >
            <Text style={s.statIcon}>📋</Text>
            <Text style={s.statVal}>{stats.ordersToday}</Text>
            <Text style={s.statLbl}>{t('orders_today','th')}</Text>
            {lang !== 'th' && <Text style={s.statSub}>{t('orders_today', lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.statCard, { backgroundColor: '#e67e22' }]}
            onPress={() => navigation.navigate('AllOrders')}
            activeOpacity={0.85}
          >
            <Text style={s.statIcon}>⏳</Text>
            <Text style={s.statVal}>{stats.pendingOrders}</Text>
            <Text style={s.statLbl}>{t('pending_orders','th')}</Text>
            {lang !== 'th' && <Text style={s.statSub}>{t('pending_orders', lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.statCard, { backgroundColor: '#c0392b' }]}
            onPress={() => navigation.navigate('CustomerList')}
            activeOpacity={0.85}
          >
            <Text style={s.statIcon}>⚠️</Text>
            <Text style={s.statVal}>฿{stats.overdueCredit.toLocaleString()}</Text>
            <Text style={s.statLbl}>{t('overdue_credit','th')}</Text>
            {lang !== 'th' && <Text style={s.statSub}>{t('overdue_credit', lang)}</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Quick Summary ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryIcon}>📦</Text>
            <Text style={s.summaryVal}>{productCount}</Text>
            <Text style={s.summaryLbl}>{t('products','th')}</Text>
            {lang !== 'th' && <Text style={s.summarySub}>{t('products', lang)}</Text>}
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryIcon}>👥</Text>
            <Text style={s.summaryVal}>{customerCount}</Text>
            <Text style={s.summaryLbl}>{t('customers','th')}</Text>
            {lang !== 'th' && <Text style={s.summarySub}>{t('customers', lang)}</Text>}
          </View>
        </View>

        {/* ── Cashier PIN Card (Admin Only) ── */}
        <View style={s.pinCard}>
          <View style={s.pinCardLeft}>
            <Text style={s.pinCardIcon}>🔐</Text>
            <View>
              <Text style={s.pinCardTitle}>
                รหัสแคชเชียร์วันนี้{lang !== 'th' ? ` / Cashier PIN` : ''}
              </Text>
              <Text style={s.pinCardSub}>
                หมุนใหม่ทุก 5 วัน • เฉพาะ Admin เท่านั้น
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.pinToggleBtn}
            onPress={() => setShowPin(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={s.pinValue}>
              {showPin ? cashierPin : '● ● ● ●'}
            </Text>
            <Text style={s.pinEyeIcon}>{showPin ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Management Menu ── */}
        <Text style={s.sectionTitle}>
          ⚙️ {t('manage_system','th')}{lang !== 'th' ? ` / ${t('manage_system',lang)}` : ''}
        </Text>

        <View style={s.menuGrid}>
          {/* สินค้า */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#c0392b' }]} onPress={() => navigation.navigate('ProductList')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>📦</Text>
            <Text style={s.menuTitleTh}>{t('products','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('products', lang)}</Text>}
            <Text style={s.menuDesc}>{productCount} รายการ</Text>
          </TouchableOpacity>

          {/* เพิ่มสินค้า */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#8e44ad' }]} onPress={() => navigation.navigate('AddProduct')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>➕📦</Text>
            <Text style={s.menuTitleTh}>{t('add_product','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('add_product', lang)}</Text>}
            <Text style={s.menuDesc}>เพิ่มสินค้าใหม่</Text>
          </TouchableOpacity>

          {/* ลูกค้า */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#27ae60' }]} onPress={() => navigation.navigate('CustomerList')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>👥</Text>
            <Text style={s.menuTitleTh}>{t('customers','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('customers', lang)}</Text>}
            <Text style={s.menuDesc}>{customerCount} ราย</Text>
          </TouchableOpacity>

          {/* เพิ่มลูกค้า */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#2980b9' }]} onPress={() => navigation.navigate('AddCustomer')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>➕👤</Text>
            <Text style={s.menuTitleTh}>{t('add_customer','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('add_customer', lang)}</Text>}
            <Text style={s.menuDesc}>เพิ่มลูกค้าใหม่</Text>
          </TouchableOpacity>

          {/* ออเดอร์ */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#e67e22' }]} onPress={() => navigation.navigate('AllOrders')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>📋</Text>
            <Text style={s.menuTitleTh}>{t('orders','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('orders', lang)}</Text>}
            <Text style={s.menuDesc}>{stats.ordersToday} วันนี้</Text>
          </TouchableOpacity>

          {/* ปริ้นเตอร์ */}
          <TouchableOpacity style={[s.menuCard, { borderLeftColor: '#7f8c8d' }]} onPress={() => navigation.navigate('PrinterSettings')} activeOpacity={0.85}>
            <Text style={s.menuIcon}>🖨️</Text>
            <Text style={s.menuTitleTh}>{t('settings','th')}</Text>
            {lang !== 'th' && <Text style={s.menuTitleSub}>{t('settings', lang)}</Text>}
            <Text style={s.menuDesc}>Printer / เครื่องพิมพ์</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  navbar: { backgroundColor: '#1a252f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4, gap: 8 },
  navLeft: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  navSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: { padding: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
  langBtnOn: { backgroundColor: '#f39c12' },
  langFlag: { fontSize: 18 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 8 },
  logoutTxt: { fontSize: 18 },
  body: { flex: 1 },
  shopBanner: { backgroundColor: '#1a252f', paddingHorizontal: 16, paddingVertical: 14 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#f39c12' },
  shopSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
  statCard: { width: '47%', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  statIcon: { fontSize: 26, marginBottom: 6 },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center', fontWeight: '600' },
  statSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 8, marginBottom: 4 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  summaryIcon: { fontSize: 28, marginBottom: 4 },
  summaryVal: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  summaryLbl: { fontSize: 12, color: '#555', fontWeight: '600', marginTop: 2 },
  summarySub: { fontSize: 10, color: '#aaa', marginTop: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 8 },
  menuCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, borderLeftWidth: 4 },
  menuIcon: { fontSize: 28, marginBottom: 8 },
  menuTitleTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  menuTitleSub: { fontSize: 11, color: '#888', marginTop: 2 },
  menuDesc: { fontSize: 11, color: '#aaa', marginTop: 4 },
  // Cashier PIN Card
  pinCard: { marginHorizontal: 10, marginBottom: 8, backgroundColor: '#1a252f', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  pinCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pinCardIcon: { fontSize: 28 },
  pinCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#f39c12' },
  pinCardSub: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  pinToggleBtn: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, minWidth: 90 },
  pinValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 4, textAlign: 'center' },
  pinEyeIcon: { fontSize: 16, marginTop: 4 },
});