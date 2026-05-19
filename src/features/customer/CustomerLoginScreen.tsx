import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Animated,
} from "react-native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย' },
  { code: 'mm', flag: '🇲🇲', label: 'မြန်မာ' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'cn', flag: '🇨🇳', label: '中文' },
];

export default function CustomerLoginScreen({ navigation }: any) {
  const { lang, setLang, setUserRole, setAuthenticated, setCurrentCustomer } = useAppStore();
  const [shopName, setShopName]         = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    if (!shopName.trim()) {
      Alert.alert(t('warning','th'), lbl('shop_name') + ' ห้ามว่าง'); return;
    }
    if (!password.trim()) {
      Alert.alert(t('warning','th'), lbl('password') + ' ห้ามว่าง'); return;
    }
    setLoading(true);
    try {
      const customer = DB.loginCustomer(shopName.trim(), password.trim());
      if (customer) {
        setCurrentCustomer(customer);
        setUserRole('customer');
        setAuthenticated(true);
      } else {
        shake();
        Alert.alert(
          t('warning','th') + (lang !== 'th' ? ` / ${t('warning', lang)}` : ''),
          'ชื่อร้านหรือรหัสผ่านไม่ถูกต้อง\n' +
          (lang !== 'th' ? t('wrong_pin', lang) + '\n' : '') +
          'กรุณาติดต่อร้านเจรุ่งชิลลี่'
        );
      }
    } catch(e) {
      console.error(e);
      Alert.alert(t('error','th'), String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Hero Header ── */}
        <View style={s.header}>
          {/* วงกลมตกแต่ง */}
          <View style={s.decCircle1} />
          <View style={s.decCircle2} />

          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🌶️</Text>
          </View>
          <Text style={s.title}>สั่งสินค้าออนไลน์</Text>
          {lang !== 'th' && <Text style={s.titleSub}>{t('role_order', lang)}</Text>}
          <View style={s.brandBadge}>
            <Text style={s.brandBadgeTxt}>J.Rung Chilli · Mae Sot</Text>
          </View>
        </View>

        {/* ── Language Selector ── */}
        <View style={s.langCard}>
          <Text style={s.sectionTitle}>🌐 {lbl('select_language')}</Text>
          <View style={s.langRow}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnOn]}
                onPress={() => setLang(l.code)}
                activeOpacity={0.8}
              >
                <Text style={s.langFlag}>{l.flag}</Text>
                <Text style={[s.langLabel, lang === l.code && s.langLabelOn]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Login Form ── */}
        <Animated.View
          style={[s.loginCard, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Shop Name */}
          <Text style={s.sectionTitle}>🏪 {lbl('shop_name')}</Text>
          <TextInput
            style={s.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder={`${t('shop_name','th')} / Shop Name`}
            placeholderTextColor="#b0a090"
            autoCapitalize="none"
          />

          {/* Password */}
          <Text style={[s.sectionTitle, { marginTop: 14 }]}>🔑 {lbl('password')}</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="รหัสผ่าน / Password"
              placeholderTextColor="#b0a090"
              secureTextEntry={!showPassword}
              keyboardType="default"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={s.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnTxt}>🚀 {lbl('confirm')} เข้าสู่ระบบ</Text>
            }
          </TouchableOpacity>

          <Text style={s.hint}>
            ไม่มีรหัส? ติดต่อร้านเจรุ่งชิลลี่
            {lang !== 'th' ? '\nContact J.Rung Chilli for password' : ''}
          </Text>
        </Animated.View>

        <Text style={s.version}>v2.6 © 2025 JRungChilli</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CHILLI.cream },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  // ── Hero Header ──
  header: {
    backgroundColor: CHILLI.dark,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  // วงกลมตกแต่ง (เหมือน CashierHome)
  decCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(192,57,43,0.15)',
    top: -60,
    right: -50,
  },
  decCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(230,126,34,0.12)',
    bottom: -40,
    left: -30,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoEmoji: { fontSize: 40 },
  title:    { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  titleSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  brandBadge: {
    marginTop: 10,
    backgroundColor: CHILLI.red,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  brandBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CHILLI.dark,
    marginBottom: 10,
  },

  // ── Language Card ──
  langCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 0,
    borderRadius: 14,
    padding: 14,
    ...shadow(2),
  },
  langRow:    { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0d8d0',
    backgroundColor: CHILLI.cream,
  },
  langBtnOn: {
    borderColor: CHILLI.red,
    backgroundColor: '#fff0ee',
  },
  langFlag:    { fontSize: 22 },
  langLabel:   { fontSize: 11, color: '#888', fontWeight: '600', marginTop: 3 },
  langLabelOn: { color: CHILLI.red, fontWeight: 'bold' },

  // ── Login Card ──
  loginCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 0,
    borderRadius: 14,
    padding: 18,
    ...shadow(2),
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e8d5c4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: CHILLI.dark,
    backgroundColor: CHILLI.cream,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: '#f0ebe6',
    borderRadius: 10,
    padding: 10,
  },
  eyeIcon: { fontSize: 22 },

  // ── Login Button ──
  loginBtn: {
    backgroundColor: CHILLI.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    ...shadow(3),
  },
  loginBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  hint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#bbb',
    marginTop: 24,
    marginBottom: 8,
  },
});
