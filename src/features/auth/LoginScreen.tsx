import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  StyleSheet, StatusBar, Animated,
  ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, FONT, SPACE, RADIUS, shadow } from "../../core/theme";

const LANGS: { code: Lang; flag: string; label: string; labelNative: string }[] = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย',    labelNative: 'ไทย' },
  { code: 'mm', flag: '🇲🇲', label: 'မြန်မာ', labelNative: 'မြန်မာ' },
  { code: 'en', flag: '🇬🇧', label: 'English', labelNative: 'ENG' },
  { code: 'cn', flag: '🇨🇳', label: '中文',    labelNative: '中文' },
];

// ─── Admin PIN Modal ──────────────────────────────────────────────────────────
function AdminPinModal({
  visible, lang, onClose, onSuccess,
}: {
  visible: boolean; lang: Lang; onClose: () => void; onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1, useNativeDriver: true, tension: 120, friction: 8,
      }).start();
      setPin('');
    } else {
      scaleAnim.setValue(0.85);
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (val: string) => {
    if (pin.length >= 10) return;
    const next = pin + val;
    setPin(next);
    if (next.length >= 4) {
      try {
        const stored = DB.getSetting('admin_pin') || '4840402036';
        if (next === stored) {
          setPin('');
          onSuccess();
          return;
        }
        if (next.length >= stored.length) {
          shake();
          setTimeout(() => setPin(''), 700);
          Alert.alert(
            lang !== 'th' ? `⚠️ ${t('wrong_pin','th')} / ${t('wrong_pin',lang)}` : `⚠️ ${t('wrong_pin','th')}`,
            lang !== 'th' ? `${t('enter_pin','th')}\n${t('enter_pin',lang)}` : t('enter_pin','th'),
          );
          return;
        }
        // check prefix mismatch
        if (!stored.startsWith(next)) {
          shake();
          setTimeout(() => setPin(''), 700);
        }
      } catch {
        shake();
        setTimeout(() => setPin(''), 700);
      }
    }
  };

  const handleDel = () => setPin(p => p.slice(0, -1));
  if (!visible) return null;

  return (
    <View style={pm.overlay}>
      <Animated.View style={[pm.box, { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }]}>
        {/* Header */}
        <View style={pm.header}>
          <Text style={pm.headerEmoji}>🔐</Text>
          <Text style={pm.title}>{t('enter_pin', 'th')}</Text>
          {lang !== 'th' && <Text style={pm.titleSub}>{t('enter_pin', lang)}</Text>}
          <Text style={pm.hint}>Admin PIN (10 หลัก)</Text>
        </View>

        {/* Dots */}
        <View style={pm.dots}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={[pm.dot, pin.length > i && pm.dotFill]}
            />
          ))}
        </View>

        {/* Keypad */}
        <View style={pm.grid}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[pm.key, k === '' && pm.keyEmpty, k === '⌫' && pm.keyDel]}
              onPress={() => k === '⌫' ? handleDel() : k !== '' ? handlePress(k) : null}
              disabled={k === ''}
              activeOpacity={0.65}
            >
              <Text style={[pm.keyTxt, k === '⌫' && pm.keyDelTxt]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel */}
        <TouchableOpacity style={pm.cancelBtn} onPress={() => { setPin(''); onClose(); }} activeOpacity={0.75}>
          <Text style={pm.cancelTxt}>
            {t('cancel', 'th')}{lang !== 'th' ? ` / ${t('cancel', lang)}` : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Main Login Screen ────────────────────────────────────────────────────────
export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { lang, setLang, setUserRole, setAuthenticated } = useAppStore();
  const [showAdminPin, setShowAdminPin] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  let shopName = 'เจรุ่งชิลลี่';
  try { shopName = DB.getSetting('shop_name') || shopName; } catch {}

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAdminSuccess = () => { setUserRole('admin'); setAuthenticated(true); };
  const handleCashier = () => { setUserRole('cashier'); setAuthenticated(true); };
  const handleCustomer = () => { navigation.navigate('CustomerEntry'); };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.redDeep} barStyle="light-content" />

      <AdminPinModal
        visible={showAdminPin}
        lang={lang}
        onClose={() => setShowAdminPin(false)}
        onSuccess={handleAdminSuccess}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Header ── */}
        <Animated.View style={[s.hero, { opacity: fadeAnim }]}>
          {/* Decorative chilli pattern */}
          <View style={s.heroDecor1} />
          <View style={s.heroDecor2} />
          <View style={s.heroDecor3} />

          <View style={s.logoRing}>
            <Text style={s.logoEmoji}>🌶️</Text>
          </View>
          <Text style={s.heroTitle}>{shopName}</Text>
          <Text style={s.heroSub}>J.Rung Chilli • Mae Sot</Text>

          {/* Chilli decorative icons */}
          <View style={s.chilliRow}>
            {['🌶️','🫑','🌿','🌶️','🌿','🫑','🌶️'].map((e, i) => (
              <Text key={i} style={[s.chilliDeco, { opacity: 0.35 + (i % 3) * 0.15 }]}>{e}</Text>
            ))}
          </View>
        </Animated.View>

        {/* ── Language Card ── */}
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardHeaderEmoji}>🌐</Text>
            <Text style={s.cardHeaderTxt}>
              {t('select_language', 'th')}
              {lang !== 'th' && <Text style={s.cardHeaderSub}>  {t('select_language', lang)}</Text>}
            </Text>
          </View>

          <View style={s.langGrid}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnOn]}
                onPress={() => setLang(l.code)}
                activeOpacity={0.75}
              >
                <Text style={s.langFlag}>{l.flag}</Text>
                <Text style={[s.langLabel, lang === l.code && s.langLabelOn]}>
                  {l.labelNative}
                </Text>
                {lang === l.code && (
                  <View style={s.langActiveDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Role Buttons ── */}
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardHeaderEmoji}>👤</Text>
            <Text style={s.cardHeaderTxt}>
              {t('select_role', 'th')}
              {lang !== 'th' && <Text style={s.cardHeaderSub}>  {t('select_role', lang)}</Text>}
            </Text>
          </View>

          {/* Admin */}
          <TouchableOpacity
            style={s.roleBtn}
            onPress={() => setShowAdminPin(true)}
            activeOpacity={0.82}
          >
            <View style={[s.roleIconBg, { backgroundColor: CHILLI.redDeep }]}>
              <Text style={s.roleIcon}>👑</Text>
            </View>
            <View style={s.roleContent}>
              <Text style={s.roleTitleTh}>{t('role_admin', 'th')}</Text>
              {lang !== 'th' && <Text style={s.roleSub}>{t('role_admin', lang)}</Text>}
              <Text style={s.roleDesc}>จัดการสินค้า ลูกค้า ออเดอร์</Text>
            </View>
            <View style={[s.roleBadge, { backgroundColor: CHILLI.redDeep }]}>
              <Text style={s.roleBadgeTxt}>🔐 PIN</Text>
            </View>
          </TouchableOpacity>

          {/* Cashier/Stock */}
          <TouchableOpacity
            style={[s.roleBtn, s.roleBtnSecond]}
            onPress={handleCashier}
            activeOpacity={0.82}
          >
            <View style={[s.roleIconBg, { backgroundColor: CHILLI.darkMid }]}>
              <Text style={s.roleIcon}>⚖️</Text>
            </View>
            <View style={s.roleContent}>
              <Text style={s.roleTitleTh}>{t('role_stock', 'th')}</Text>
              {lang !== 'th' && <Text style={s.roleSub}>{t('role_stock', lang)}</Text>}
              <Text style={s.roleDesc}>ชั่งน้ำหนัก · ขายหน้าร้าน · แพ็คออเดอร์</Text>
            </View>
            <View style={[s.roleBadge, { backgroundColor: CHILLI.darkMid }]}>
              <Text style={s.roleBadgeTxt}>› POS</Text>
            </View>
          </TouchableOpacity>

          {/* Customer / Wholesale */}
          <TouchableOpacity
            style={[s.roleBtn, s.roleBtnThird]}
            onPress={handleCustomer}
            activeOpacity={0.82}
          >
            <View style={[s.roleIconBg, { backgroundColor: '#1a7a4a' }]}>
              <Text style={s.roleIcon}>🛒</Text>
            </View>
            <View style={s.roleContent}>
              <Text style={s.roleTitleTh}>{t('role_customer', 'th')}</Text>
              {lang !== 'th' && <Text style={s.roleSub}>{t('role_customer', lang)}</Text>}
              <Text style={s.roleDesc}>สั่งสินค้า · ดูออเดอร์ · ตรวจเครดิต</Text>
            </View>
            <View style={[s.roleBadge, { backgroundColor: '#1a7a4a' }]}>
              <Text style={s.roleBadgeTxt}>รหัสร้าน</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Footer ── */}
        <Text style={s.version}>🌶️ JRungChilli POS v2.8 © 2025 · Mae Sot</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CHILLI.cream },
  scroll: { flexGrow: 1, paddingBottom: SPACE.xl },

  // Hero
  hero: {
    backgroundColor: CHILLI.red,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroDecor2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  heroDecor3: {
    position: 'absolute', top: 10, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    ...shadow(3),
  },
  logoEmoji:  { fontSize: 46 },
  heroTitle:  { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5, textAlign: 'center' },
  heroSub:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  chilliRow:  { flexDirection: 'row', marginTop: 14, gap: 2 },
  chilliDeco: { fontSize: 18 },

  // Card
  card: {
    backgroundColor: CHILLI.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: RADIUS.xl,
    padding: SPACE.base,
    ...shadow(2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.md,
    gap: 8,
  },
  cardHeaderEmoji: { fontSize: 18 },
  cardHeaderTxt: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: CHILLI.textPrimary,
  },
  cardHeaderSub: {
    fontSize: FONT.size.sm,
    color: CHILLI.textSecondary,
    fontWeight: FONT.weight.normal,
  },

  // Language
  langGrid: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#ead8ce',
    backgroundColor: '#fdf5f0',
    position: 'relative',
  },
  langBtnOn: {
    borderColor: CHILLI.red,
    backgroundColor: '#fff0ec',
  },
  langFlag:     { fontSize: 22, marginBottom: 3 },
  langLabel:    { fontSize: 11, color: CHILLI.textSecondary, fontWeight: '600' },
  langLabelOn:  { color: CHILLI.red, fontWeight: '800' },
  langActiveDot:{
    position: 'absolute', bottom: 4,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: CHILLI.red,
  },

  // Role Buttons
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    backgroundColor: '#fff5f0',
    borderWidth: 1.5,
    borderColor: '#f5c4b8',
    gap: 12,
    ...shadow(1),
  },
  roleBtnSecond: {
    backgroundColor: '#f0f4f8',
    borderColor: '#c8d6e5',
  },
  roleBtnThird: {
    backgroundColor: '#f0faf4',
    borderColor: '#b8e0c8',
  },
  roleIconBg: {
    width: 50, height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon:     { fontSize: 24 },
  roleContent:  { flex: 1 },
  roleTitleTh:  { fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary },
  roleSub:      { fontSize: FONT.size.sm, color: CHILLI.textSecondary, marginTop: 1 },
  roleDesc:     { fontSize: 11, color: CHILLI.textSecondary, marginTop: 3 },
  roleBadge:    { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 5 },
  roleBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  version: {
    textAlign: 'center',
    fontSize: 11,
    color: CHILLI.textLight,
    marginTop: 18,
    marginBottom: 8,
  },
});

// ─── PIN Modal Styles ─────────────────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: RADIUS['2xl'],
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: '88%',
    alignItems: 'center',
    ...shadow(4),
    overflow: 'hidden',
  },
  header: {
    backgroundColor: CHILLI.red,
    width: '120%',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 18,
    marginBottom: 16,
  },
  headerEmoji: { fontSize: 36, marginBottom: 6 },
  title:    { fontSize: FONT.size.lg, fontWeight: FONT.weight.bold, color: '#fff', textAlign: 'center' },
  titleSub: { fontSize: FONT.size.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  hint:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  dots: {
    flexDirection: 'row',
    gap: 5,
    marginVertical: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: CHILLI.red,
    backgroundColor: '#fff',
  },
  dotFill: { backgroundColor: CHILLI.red },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 240, gap: 8,
    justifyContent: 'center', marginBottom: 16,
  },
  key: {
    width: 68, height: 56, borderRadius: RADIUS.md,
    backgroundColor: '#f8f0ee',
    borderWidth: 1, borderColor: '#f0d0c8',
    alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty:  { backgroundColor: 'transparent', borderWidth: 0 },
  keyDel:    { backgroundColor: '#ffeae6' },
  keyTxt:    { fontSize: 22, fontWeight: FONT.weight.bold, color: CHILLI.textPrimary },
  keyDelTxt: { fontSize: 20, color: CHILLI.red },

  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  cancelTxt: { fontSize: FONT.size.md, color: '#777', fontWeight: FONT.weight.semibold },
});
