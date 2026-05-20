import React, { useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, FONT, SPACE, RADIUS, shadow } from "../../core/theme";

const LANGS: { code: Lang; flag: string }[] = [
  { code: 'th', flag: '๐น๐ญ' },
  { code: 'mm', flag: '๐ฒ๐ฒ' },
  { code: 'en', flag: '๐ฌ๐ง' },
  { code: 'cn', flag: '๐จ๐ณ' },
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
      setProductCount(DB.getAllProducts().length);
      setCustomerCount(DB.getAllCustomers().length);
      const pin = DB.rotateCashierPinIfNeeded();
      setCashierPin(pin);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, []));

  const bi = (key: string) =>
    lang !== 'th' ? `${t(key,'th')} / ${t(key,lang)}` : t(key,'th');

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* โ”€โ”€ Navbar โ”€โ”€ */}
      <View style={s.navbar}>
        <View style={{ flex: 1 }}>
          <Text style={s.navTitle}>๐‘‘ {t('role_admin','th')}</Text>
          {lang !== 'th' && <Text style={s.navSub}>{t('role_admin', lang)}</Text>}
        </View>
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[s.langBtn, lang === l.code && s.langBtnOn]}
              onPress={() => setLang(l.code)}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 18 }}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() =>
            Alert.alert(
              bi('logout'),
              bi('confirm_logout'),
              [
                { text: t('cancel','th'), style: 'cancel' },
                { text: t('confirm','th'), onPress: logout },
              ]
            )
          }
          activeOpacity={0.75}
        >
          <Text style={{ fontSize: 18 }}>๐ช</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* โ”€โ”€ Shop Hero Banner โ”€โ”€ */}
        <View style={s.heroBanner}>
          <View style={s.heroDecor} />
          <View style={s.heroDecor2} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.heroLogoRing}>
              <Text style={{ fontSize: 32 }}>๐ถ๏ธ</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroShopName}>{settings?.shop_name || 'J.Rung Chilli'}</Text>
              <Text style={s.heroShopSub}>
                Mae Sot ยท {t('dashboard','th')}{lang !== 'th' ? ` / ${t('dashboard',lang)}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* โ”€โ”€ Stats Grid โ”€โ”€ */}
        <View style={s.statsSection}>
          <Text style={s.sectionLabel}>
            ๐“ เธชเธ–เธดเธ•เธดเธงเธฑเธเธเธตเน{lang !== 'th' ? ` / ${t('today',lang)}` : ''}
          </Text>
          <View style={s.statsGrid}>

            {/* Revenue */}
            <TouchableOpacity
              style={[s.statCard, { borderTopColor: CHILLI.green }]}
              onPress={() => navigation.navigate('AllOrders')}
              activeOpacity={0.82}
            >
              <View style={[s.statIconBg, { backgroundColor: '#e8f8f0' }]}>
                <Text style={s.statIconEmoji}>๐’ฐ</Text>
              </View>
              <Text style={s.statVal}>เธฟ{stats.revenueToday.toLocaleString()}</Text>
              <Text style={s.statLblTh}>{t('revenue_today','th')}</Text>
              {lang !== 'th' && <Text style={s.statLblSub}>{t('revenue_today',lang)}</Text>}
              <View style={[s.statIndicator, { backgroundColor: CHILLI.green }]} />
            </TouchableOpacity>

            {/* Orders Today */}
            <TouchableOpacity
              style={[s.statCard, { borderTopColor: CHILLI.blue }]}
              onPress={() => navigation.navigate('AllOrders')}
              activeOpacity={0.82}
            >
              <View style={[s.statIconBg, { backgroundColor: '#e8f4fd' }]}>
                <Text style={s.statIconEmoji}>๐“</Text>
              </View>
              <Text style={s.statVal}>{stats.ordersToday}</Text>
              <Text style={s.statLblTh}>{t('orders_today','th')}</Text>
              {lang !== 'th' && <Text style={s.statLblSub}>{t('orders_today',lang)}</Text>}
              <View style={[s.statIndicator, { backgroundColor: CHILLI.blue }]} />
            </TouchableOpacity>

            {/* Pending */}
            <TouchableOpacity
              style={[s.statCard, { borderTopColor: CHILLI.orange }]}
              onPress={() => navigation.navigate('AllOrders')}
              activeOpacity={0.82}
            >
              <View style={[s.statIconBg, { backgroundColor: '#fef5ea' }]}>
                <Text style={s.statIconEmoji}>โณ</Text>
              </View>
              <Text style={s.statVal}>{stats.pendingOrders}</Text>
              <Text style={s.statLblTh}>{t('pending_orders','th')}</Text>
              {lang !== 'th' && <Text style={s.statLblSub}>{t('pending_orders',lang)}</Text>}
              <View style={[s.statIndicator, { backgroundColor: CHILLI.orange }]} />
            </TouchableOpacity>

            {/* Overdue Credit */}
            <TouchableOpacity
              style={[s.statCard, { borderTopColor: CHILLI.red }]}
              onPress={() => navigation.navigate('CustomerList')}
              activeOpacity={0.82}
            >
              <View style={[s.statIconBg, { backgroundColor: '#fceaea' }]}>
                <Text style={s.statIconEmoji}>โ ๏ธ</Text>
              </View>
              <Text style={[s.statVal, stats.overdueCredit > 0 && { color: CHILLI.red }]}>
                เธฟ{stats.overdueCredit.toLocaleString()}
              </Text>
              <Text style={s.statLblTh}>{t('overdue_credit','th')}</Text>
              {lang !== 'th' && <Text style={s.statLblSub}>{t('overdue_credit',lang)}</Text>}
              <View style={[s.statIndicator, { backgroundColor: CHILLI.red }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* โ”€โ”€ Summary Row โ”€โ”€ */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderLeftColor: CHILLI.red }]}>
            <Text style={s.summaryIcon}>๐“ฆ</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryVal}>{productCount} <Text style={s.summaryUnit}>เธฃเธฒเธขเธเธฒเธฃ</Text></Text>
              <Text style={s.summaryLblTh}>{t('products','th')}</Text>
              {lang !== 'th' && <Text style={s.summaryLblSub}>{t('products',lang)}</Text>}
            </View>
            <TouchableOpacity
              style={s.summaryLink}
              onPress={() => navigation.navigate('ProductList')}
              activeOpacity={0.75}
            >
              <Text style={s.summaryLinkTxt}>เธ”เธนเธ—เธฑเนเธเธซเธกเธ” โ€บ</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: CHILLI.blue }]}>
            <Text style={s.summaryIcon}>๐‘ฅ</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryVal}>{customerCount} <Text style={s.summaryUnit}>เธฃเธฒเธข</Text></Text>
              <Text style={s.summaryLblTh}>{t('customers','th')}</Text>
              {lang !== 'th' && <Text style={s.summaryLblSub}>{t('customers',lang)}</Text>}
            </View>
            <TouchableOpacity
              style={s.summaryLink}
              onPress={() => navigation.navigate('CustomerList')}
              activeOpacity={0.75}
            >
              <Text style={s.summaryLinkTxt}>เธ”เธนเธ—เธฑเนเธเธซเธกเธ” โ€บ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* โ”€โ”€ Cashier PIN Card โ”€โ”€ */}
        <View style={s.pinSection}>
          <View style={s.pinCard}>
            <View style={s.pinLeft}>
              <View style={s.pinIconBg}>
                <Text style={{ fontSize: 26 }}>๐”</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.pinTitle}>
                  {t('cashier_pin_card','th')}
                  {lang !== 'th' ? ` / ${t('cashier_pin_card',lang)}` : ''}
                </Text>
                <Text style={s.pinSub}>
                  {t('pin_rotates','th')}{lang !== 'th' ? ` / ${t('pin_rotates',lang)}` : ''} โ€ข Admin only
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.pinToggleBtn}
              onPress={() => setShowPin(v => !v)}
              activeOpacity={0.75}
            >
              <Text style={s.pinValue}>
                {showPin ? cashierPin : 'โ— โ— โ— โ—'}
              </Text>
              <Text style={s.pinEye}>{showPin ? '๐' : '๐‘๏ธ'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* โ”€โ”€ Management Menu โ”€โ”€ */}
        <View style={s.menuSection}>
          <Text style={s.sectionLabel}>
            โ๏ธ {t('manage_system','th')}{lang !== 'th' ? ` / ${t('manage_system',lang)}` : ''}
          </Text>
          <View style={s.menuGrid}>

            {[
              {
                icon:'๐“ฆ', titleKey:'products', desc:`${productCount} เธฃเธฒเธขเธเธฒเธฃ`,
                nav:'ProductList', accentColor: CHILLI.red,
              },
              {
                icon:'โ•', titleKey:'add_product', desc:'เน€เธเธดเนเธกเธชเธดเธเธเนเธฒเนเธซเธกเน',
                nav:'AddProduct', accentColor: CHILLI.purple,
              },
              {
                icon:'๐‘ฅ', titleKey:'customers', desc:`${customerCount} เธฃเธฒเธข`,
                nav:'CustomerList', accentColor: CHILLI.green,
              },
              {
                icon:'๐‘ค', titleKey:'add_customer', desc:'เน€เธเธดเนเธกเธฅเธนเธเธเนเธฒเนเธซเธกเน',
                nav:'AddCustomer', accentColor: CHILLI.blue,
              },
              {
                icon:'๐“', titleKey:'orders', desc:`${stats.ordersToday} เธงเธฑเธเธเธตเน`,
                nav:'AllOrders', accentColor: CHILLI.orange,
              },
              {
                icon:'๐–จ๏ธ', titleKey:'printer_settings', desc:'Bluetooth Printer',
                nav:'PrinterSettings', accentColor: CHILLI.gray,
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={s.menuCard}
                onPress={() => navigation.navigate(item.nav)}
                activeOpacity={0.82}
              >
                <View style={[s.menuIconBg, { backgroundColor: item.accentColor + '18' }]}>
                  <Text style={s.menuIconEmoji}>{item.icon}</Text>
                </View>
                <View style={[s.menuAccent, { backgroundColor: item.accentColor }]} />
                <Text style={s.menuTitleTh}>{t(item.titleKey,'th')}</Text>
                {lang !== 'th' && (
                  <Text style={s.menuTitleSub}>{t(item.titleKey,lang)}</Text>
                )}
                <Text style={s.menuDesc}>{item.desc}</Text>
                <Text style={[s.menuArrow, { color: item.accentColor }]}>โ€บ</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* โ”€โ”€ Footer โ”€โ”€ */}
        <Text style={s.footer}>๐ถ๏ธ JRungChilli POS v2.8 ยฉ 2025</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// โ”€โ”€โ”€ Styles โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  // Navbar
  navbar: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm + 2,
    gap: 8,
    ...shadow(3),
  },
  navTitle: { fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: '#fff' },
  navSub:   { fontSize: FONT.size.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  langRow:  { flexDirection: 'row', gap: 4 },
  langBtn:  { padding: 5, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtnOn:{ backgroundColor: CHILLI.orangeLight },
  logoutBtn:{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.sm, padding: 7 },

  // Hero Banner
  heroBanner: {
    backgroundColor: CHILLI.dark,
    paddingHorizontal: SPACE.lg,
    paddingVertical: 18,
    overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute', right: -30, top: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(192,57,43,0.25)',
  },
  heroDecor2: {
    position: 'absolute', left: -20, bottom: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(230,126,34,0.15)',
  },
  heroLogoRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(192,57,43,0.35)',
    borderWidth: 2, borderColor: 'rgba(192,57,43,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroShopName: { fontSize: FONT.size.xl, fontWeight: FONT.weight.extrabold, color: CHILLI.orangeLight },
  heroShopSub:  { fontSize: FONT.size.sm, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  // Stats
  statsSection: { padding: SPACE.md },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '47.5%',
    backgroundColor: CHILLI.white,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    borderTopWidth: 4,
    overflow: 'hidden',
    ...shadow(2),
  },
  statIconBg: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  statIconEmoji: { fontSize: 22 },
  statVal:    { fontSize: FONT.size['2xl'], fontWeight: FONT.weight.extrabold, color: CHILLI.textPrimary },
  statLblTh:  { fontSize: FONT.size.sm, color: CHILLI.textSecondary, marginTop: 4, fontWeight: FONT.weight.semibold },
  statLblSub: { fontSize: 10, color: CHILLI.textLight, marginTop: 1 },
  statIndicator: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: 3,
  },

  sectionLabel: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
    color: CHILLI.textSecondary,
    marginBottom: SPACE.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.md,
    gap: 8,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: CHILLI.white,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    gap: 10,
    ...shadow(1),
  },
  summaryIcon:    { fontSize: 26 },
  summaryVal:     { fontSize: FONT.size.xl, fontWeight: FONT.weight.extrabold, color: CHILLI.textPrimary },
  summaryUnit:    { fontSize: FONT.size.sm, fontWeight: FONT.weight.normal, color: CHILLI.textSecondary },
  summaryLblTh:   { fontSize: FONT.size.sm, color: CHILLI.textSecondary, fontWeight: FONT.weight.semibold, marginTop: 1 },
  summaryLblSub:  { fontSize: FONT.size.xs, color: CHILLI.textLight },
  summaryLink:    { paddingVertical: 4 },
  summaryLinkTxt: { fontSize: FONT.size.xs, color: CHILLI.red, fontWeight: FONT.weight.bold },

  // PIN Card
  pinSection: { paddingHorizontal: SPACE.md, marginBottom: 8 },
  pinCard: {
    backgroundColor: CHILLI.dark,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow(2),
  },
  pinLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pinIconBg: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(192,57,43,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  pinTitle: { fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: CHILLI.orangeLight },
  pinSub:   { fontSize: FONT.size.xs, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  pinToggleBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pinValue: {
    fontSize: 20, fontWeight: FONT.weight.extrabold,
    color: '#fff', letterSpacing: 5, textAlign: 'center',
  },
  pinEye: { fontSize: 14, marginTop: 4 },

  // Management Menu
  menuSection: { paddingHorizontal: SPACE.md, marginBottom: 4 },
  menuGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuCard: {
    width: '47.5%',
    backgroundColor: CHILLI.white,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    position: 'relative',
    overflow: 'hidden',
    ...shadow(2),
  },
  menuIconBg: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  menuIconEmoji: { fontSize: 22 },
  menuAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4,
  },
  menuTitleTh:  { fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary, paddingLeft: 4 },
  menuTitleSub: { fontSize: FONT.size.xs, color: CHILLI.textSecondary, marginTop: 1, paddingLeft: 4 },
  menuDesc:     { fontSize: FONT.size.xs, color: CHILLI.textLight, marginTop: 4, paddingLeft: 4 },
  menuArrow: {
    position: 'absolute', right: 12, bottom: 12,
    fontSize: 20, fontWeight: FONT.weight.bold,
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: CHILLI.textLight,
    marginTop: 12,
  },
});

