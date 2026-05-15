import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  StyleSheet, SafeAreaView, StatusBar, Animated,
} from "react-native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย' },
  { code: 'mm', flag: '🇲🇲', label: 'မြန်မာ' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'cn', flag: '🇨🇳', label: '中文' },
];

// helper — ถ้าภาษาเดียวกับ TH ไม่ต้องแสดงซ้ำ
function SubLabel({ keyName, lang }: { keyName: string; lang: Lang }) {
  if (lang === 'th') return null;
  return <Text style={s.subLabel}>{t(keyName, lang)}</Text>;
}

// ─── PIN Modal ───────────────────────────────────────────
function PinModal({
  visible, lang, onClose, onSuccess,
}: {
  visible: boolean; lang: Lang; onClose: () => void; onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (val: string) => {
    if (pin.length >= 6) return;
    const next = pin + val;
    setPin(next);
    if (next.length >= 4) {
      try {
        const stored = DB.getSetting('admin_pin') || '0000';
        if (next === stored) {
          setPin('');
          onSuccess();
        } else {
          shake();
          setTimeout(() => setPin(''), 700);
          Alert.alert(
            t('warning', 'th') + (lang !== 'th' ? ` / ${t('warning', lang)}` : ''),
            t('wrong_pin', 'th') + (lang !== 'th' ? `\n${t('wrong_pin', lang)}` : '')
          );
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
      <Animated.View style={[pm.box, { transform: [{ translateX: shakeAnim }] }]}>
        {/* Title TH + selected lang */}
        <Text style={pm.title}>🔐 {t('enter_pin', 'th')}</Text>
        {lang !== 'th' && <Text style={pm.titleSub}>{t('enter_pin', lang)}</Text>}

        {/* Dots */}
        <View style={pm.dots}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[pm.dot, pin.length > i && pm.dotFill]} />
          ))}
        </View>

        {/* Keypad */}
        <View style={pm.grid}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[pm.key, k === '' && pm.keyEmpty]}
              onPress={() => k === '⌫' ? handleDel() : k !== '' ? handlePress(k) : null}
              disabled={k === ''}
              activeOpacity={0.7}
            >
              <Text style={pm.keyTxt}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel */}
        <TouchableOpacity style={pm.cancelBtn} onPress={() => { setPin(''); onClose(); }}>
          <Text style={pm.cancelTxt}>
            {t('cancel', 'th')}{lang !== 'th' ? ` / ${t('cancel', lang)}` : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Main Login Screen ────────────────────────────────────
export default function LoginScreen() {
  const { lang, setLang, setUserRole, setAuthenticated } = useAppStore();
  const [showPin, setShowPin] = useState(false);

  let shopName = 'เจรุ่งชิลลี่';
  try { shopName = DB.getSetting('shop_name') || shopName; } catch {}

  const handleAdminSuccess = () => { setUserRole('admin'); setAuthenticated(true); };
  const handleStock        = () => { setUserRole('stock'); setAuthenticated(true); };
  const handleOrder        = () => { setUserRole('cashier'); setAuthenticated(true); };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />
      <PinModal
        visible={showPin}
        lang={lang}
        onClose={() => setShowPin(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.logo}>🌶️</Text>
        <Text style={s.shopName}>{shopName}</Text>
        <Text style={s.shopSub}>J.Rung Chilli | Mae Sot</Text>
      </View>

      {/* ── Language Selector ── */}
      <View style={s.langCard}>
        <Text style={s.sectionTitle}>
          🌐 {t('select_language', 'th')}
          {lang !== 'th' && <Text style={s.sectionSub}>  {t('select_language', lang)}</Text>}
        </Text>
        <View style={s.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[s.langBtn, lang === l.code && s.langBtnOn]}
              onPress={() => setLang(l.code)}
              activeOpacity={0.8}
            >
              <Text style={s.langFlag}>{l.flag}</Text>
              <Text style={[s.langLabel, lang === l.code && s.langLabelOn]}>{l.label}</Text>
              {lang === l.code && <View style={s.langDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Role Buttons ── */}
      <View style={s.rolesCard}>
        <Text style={s.sectionTitle}>
          👤 {t('select_role', 'th')}
          {lang !== 'th' && <Text style={s.sectionSub}>  {t('select_role', lang)}</Text>}
        </Text>

        {/* Admin */}
        <TouchableOpacity style={[s.roleBtn, { backgroundColor: '#1a252f' }]} onPress={() => setShowPin(true)} activeOpacity={0.85}>
          <Text style={s.roleIcon}>👑</Text>
          <View style={s.roleText}>
            <Text style={s.roleTh}>{t('role_admin', 'th')}</Text>
            {lang !== 'th' && <Text style={s.roleSub}>{t('role_admin', lang)}</Text>}
            <Text style={s.roleDesc}>จัดการระบบทั้งหมด</Text>
          </View>
          <Text style={s.roleArrow}>›</Text>
        </TouchableOpacity>

        {/* Cashier / Stock */}
        <TouchableOpacity style={[s.roleBtn, { backgroundColor: '#c0392b' }]} onPress={handleStock} activeOpacity={0.85}>
          <Text style={s.roleIcon}>⚖️</Text>
          <View style={s.roleText}>
            <Text style={s.roleTh}>{t('role_stock', 'th')}</Text>
            {lang !== 'th' && <Text style={s.roleSub}>{t('role_stock', lang)}</Text>}
            <Text style={s.roleDesc}>POS — ชั่งน้ำหนัก / ขายสินค้า</Text>
          </View>
          <Text style={s.roleArrow}>›</Text>
        </TouchableOpacity>

        {/* Order */}
        <TouchableOpacity style={[s.roleBtn, { backgroundColor: '#27ae60' }]} onPress={handleOrder} activeOpacity={0.85}>
          <Text style={s.roleIcon}>🛒</Text>
          <View style={s.roleText}>
            <Text style={s.roleTh}>{t('role_order', 'th')}</Text>
            {lang !== 'th' && <Text style={s.roleSub}>{t('role_order', lang)}</Text>}
            <Text style={s.roleDesc}>สั่งสินค้าออนไลน์</Text>
          </View>
          <Text style={s.roleArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>v2.6 © 2025 JRungChilli</Text>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: { backgroundColor: '#c0392b', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  logo: { fontSize: 52, marginBottom: 6 },
  shopName: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  shopSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  // Sections
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  sectionSub: { fontSize: 13, color: '#888', fontWeight: '400' },
  subLabel: { fontSize: 12, color: '#888', marginTop: 1 },

  // Language
  langCard: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, elevation: 2 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  langBtnOn: { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginTop: 3 },
  langLabelOn: { color: '#c0392b', fontWeight: 'bold' },
  langDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c0392b', marginTop: 3 },

  // Roles
  rolesCard: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, elevation: 2 },
  roleBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  roleIcon: { fontSize: 28, marginRight: 12 },
  roleText: { flex: 1 },
  roleTh: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  roleSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  roleDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleArrow: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },

  version: { textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 16, marginBottom: 8 },
});

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  box: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center', elevation: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  titleSub: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 14, marginVertical: 20 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#c0392b', backgroundColor: '#fff' },
  dotFill: { backgroundColor: '#c0392b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 10, justifyContent: 'center', marginBottom: 16 },
  key: { width: 68, height: 56, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  keyEmpty: { backgroundColor: 'transparent', elevation: 0 },
  keyTxt: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#f0f0f0', marginTop: 4 },
  cancelTxt: { fontSize: 14, color: '#666', fontWeight: '600' },
});