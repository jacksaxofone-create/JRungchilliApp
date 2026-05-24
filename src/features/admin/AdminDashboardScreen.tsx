import React, { useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, FONT, SPACE, RADIUS, shadow } from "../../core/theme";

const LOGO = require("../../assets/logo.png");

const LANGS: { code: Lang; label: string }[] = [
  { code: 'th', label: 'TH' },
  { code: 'mm', label: 'MM' },
  { code: 'en', label: 'EN' },
  { code: 'cn', label: 'CN' },
];

const MENU = [
  { icon: '📦', key: 'products',        screen: 'ProductList'     },
  { icon: '➕', key: 'add_product',     screen: 'AddProduct'      },
  { icon: '👥', key: 'customers',       screen: 'CustomerList'    },
  { icon: '➕', key: 'add_customer',    screen: 'AddCustomer'     },
  { icon: '📋', key: 'orders',          screen: 'AllOrders'       },
  { icon: '🖨️', key: 'printer',         screen: 'PrinterSettings' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { lang, setLang, logout, settings, setProducts, setCustomers } = useAppStore();
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
      const prods = DB.getAllProducts();
      const custs = DB.getAllCustomers();
      setProducts(prods);
      setCustomers(custs);
      setProductCount(prods.length);
      setCustomerCount(custs.length);
      const pin = DB.rotateCashierPinIfNeeded();
      setCashierPin(pin);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, []));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Navbar */}
      <View style={s.navbar}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <View style={s.navCenter}>
          <Text style={s.navTitle}>{settings.shop_name || 'JRung Chilli'}</Text>
          <Text style={s.navSub}>{settings.shop_address || 'Mae Sot'}</Text>
        </View>
        <View style={s.navRight}>
          <View style={s.langRow}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnOn]}
                onPress={() => setLang(l.code)}
                activeOpacity={0.75}
              >
                <Text style={[s.langTxt, lang === l.code && s.langTxtOn]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); navigation.replace('Login'); }}>
            <Text style={s.logoutTxt}>🚪 {lang === 'th' ? 'ออก' : lang === 'mm' ? 'ထွက်' : 'Out'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats Grid */}
        <Text style={s.sectionTitle}>📊 {t('today','th')}{lang !== 'th' ? ` / ${t('today',lang)}` : ''}</Text>
        <View style={s.statsGrid}>
          <TouchableOpacity style={s.statCard} onPress={() => navigation.navigate('AllOrders')}>
            <Text style={s.statVal}>฿{stats.revenueToday.toLocaleString()}</Text>
            <Text style={s.statLblTh}>{t('revenue_today','th')}</Text>
            {lang !== 'th' && <Text style={s.statLblSub}>{t('revenue_today',lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => navigation.navigate('AllOrders')}>
            <Text style={s.statVal}>{stats.ordersToday}</Text>
            <Text style={s.statLblTh}>{t('orders_today','th')}</Text>
            {lang !== 'th' && <Text style={s.statLblSub}>{t('orders_today',lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => navigation.navigate('AllOrders')}>
            <Text style={s.statVal}>{stats.pendingOrders}</Text>
            <Text style={s.statLblTh}>{t('pending_orders','th')}</Text>
            {lang !== 'th' && <Text style={s.statLblSub}>{t('pending_orders',lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => navigation.navigate('AllOrders')}>
            <Text style={s.statVal}>{stats.overdueCredit}</Text>
            <Text style={s.statLblTh}>{t('overdue_credit','th')}</Text>
            {lang !== 'th' && <Text style={s.statLblSub}>{t('overdue_credit',lang)}</Text>}
          </TouchableOpacity>
        </View>

        {/* Summary Row */}
        <View style={s.summaryRow}>
          <TouchableOpacity style={s.summaryCard} onPress={() => navigation.navigate('ProductList')}>
            <Text style={s.summaryVal}>{productCount}</Text>
            <Text style={s.summaryLblTh}>{t('products','th')}</Text>
            {lang !== 'th' && <Text style={s.summaryLblSub}>{t('products',lang)}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.summaryCard} onPress={() => navigation.navigate('CustomerList')}>
            <Text style={s.summaryVal}>{customerCount}</Text>
            <Text style={s.summaryLblTh}>{t('customers','th')}</Text>
            {lang !== 'th' && <Text style={s.summaryLblSub}>{t('customers',lang)}</Text>}
          </TouchableOpacity>
        </View>

        {/* Cashier PIN */}
        <View style={s.pinCard}>
          <Text style={s.pinTitle}>🔑 {t('cashier_pin_card','th')}{lang !== 'th' ? ` / ${t('cashier_pin_card',lang)}` : ''}</Text>
          <TouchableOpacity onPress={() => setShowPin(!showPin)}>
            <Text style={s.pinVal}>{showPin ? cashierPin : '••••'}</Text>
          </TouchableOpacity>
          <Text style={s.pinSub}>{t('pin_rotates','th')}{lang !== 'th' ? ` / ${t('pin_rotates',lang)}` : ''}</Text>
        </View>

        {/* Menu */}
        <Text style={s.sectionTitle}>⚙️ {lang === 'th' ? 'จัดการ' : lang === 'mm' ? 'စီမံ' : lang === 'en' ? 'Manage' : '管理'}</Text>
        <View style={s.menuGrid}>
          {MENU.map(item => (
            <TouchableOpacity
              key={item.key}
              style={s.menuCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <Text style={s.menuIcon}>{item.icon}</Text>
              <Text style={s.menuLblTh}>{t(item.key,'th')}</Text>
              {lang !== 'th' && <Text style={s.menuLblSub}>{t(item.key,lang)}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.footer}>JRungChilli POS v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: CHILLI.bg },
  scroll:       { paddingBottom: 40 },
  navbar:       { flexDirection:'row', alignItems:'center', backgroundColor: CHILLI.dark,
                  paddingHorizontal: SPACE.md, paddingVertical: 10, gap: SPACE.sm },
  logo:         { width: 44, height: 44, borderRadius: 8 },
  navCenter:    { flex: 1 },
  navTitle:     { color:'#fff', fontSize: FONT.md, fontWeight:'800' },
  navSub:       { color: CHILLI.accent, fontSize: FONT.xs },
  navRight:     { alignItems:'flex-end', gap: 4 },
  langRow:      { flexDirection:'row', gap: 2 },
  langBtn:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm, backgroundColor:'rgba(255,255,255,0.1)' },
  langBtnOn:    { backgroundColor: CHILLI.primary },
  langTxt:      { color:'rgba(255,255,255,0.6)', fontSize: 10, fontWeight:'600' },
  langTxtOn:    { color:'#fff' },
  logoutBtn:    { paddingHorizontal: 8, paddingVertical: 2, backgroundColor:'rgba(255,255,255,0.1)', borderRadius: RADIUS.sm },
  logoutTxt:    { color:'#fff', fontSize: FONT.xs },
  sectionTitle: { marginHorizontal: SPACE.md, marginTop: SPACE.md, marginBottom: SPACE.xs,
                  fontSize: FONT.md, fontWeight:'700', color: CHILLI.dark },
  statsGrid:    { flexDirection:'row', flexWrap:'wrap', marginHorizontal: SPACE.sm, gap: SPACE.sm },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor:'#fff', borderRadius: RADIUS.md,
                  padding: SPACE.md, ...shadow },
  statVal:      { fontSize: FONT.xl, fontWeight:'800', color: CHILLI.primary },
  statLblTh:    { fontSize: FONT.sm, color: CHILLI.dark, fontWeight:'600', marginTop: 2 },
  statLblSub:   { fontSize: FONT.xs, color: CHILLI.muted },
  summaryRow:   { flexDirection:'row', marginHorizontal: SPACE.sm, marginTop: SPACE.sm, gap: SPACE.sm },
  summaryCard:  { flex: 1, backgroundColor:'#fff', borderRadius: RADIUS.md, padding: SPACE.md,
                  alignItems:'center', ...shadow },
  summaryVal:   { fontSize: 32, fontWeight:'900', color: CHILLI.primary },
  summaryLblTh: { fontSize: FONT.sm, color: CHILLI.dark, fontWeight:'600' },
  summaryLblSub:{ fontSize: FONT.xs, color: CHILLI.muted },
  pinCard:      { margin: SPACE.md, backgroundColor: CHILLI.dark, borderRadius: RADIUS.lg,
                  padding: SPACE.md, alignItems:'center', ...shadow },
  pinTitle:     { color: CHILLI.accent, fontSize: FONT.sm, marginBottom: SPACE.xs },
  pinVal:       { color:'#fff', fontSize: 40, fontWeight:'900', letterSpacing: 8 },
  pinSub:       { color: CHILLI.muted, fontSize: FONT.xs, marginTop: SPACE.xs },
  menuGrid:     { flexDirection:'row', flexWrap:'wrap', marginHorizontal: SPACE.sm, gap: SPACE.sm },
  menuCard:     { width: '30%', backgroundColor:'#fff', borderRadius: RADIUS.md,
                  padding: SPACE.sm, alignItems:'center', ...shadow, minHeight: 80 },
  menuIcon:     { fontSize: 28, marginBottom: 4 },
  menuLblTh:    { fontSize: FONT.xs, fontWeight:'700', color: CHILLI.dark, textAlign:'center' },
  menuLblSub:   { fontSize: 9, color: CHILLI.muted, textAlign:'center' },
  footer:       { textAlign:'center', color: CHILLI.muted, fontSize: FONT.xs, marginTop: SPACE.lg },
});