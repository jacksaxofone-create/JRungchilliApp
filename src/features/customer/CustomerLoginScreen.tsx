import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  StyleSheet, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Animated,
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

export default function CustomerLoginScreen({ navigation }: any) {
  const { lang, setLang, setUserRole, setAuthenticated, setCurrentCustomer } = useAppStore();
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
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
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>🛒</Text>
          <Text style={s.title}>สั่งสินค้าออนไลน์</Text>
          {lang !== 'th' && <Text style={s.titleSub}>{t('role_order', lang)}</Text>}
          <Text style={s.shopSub}>J.Rung Chilli · Mae Sot</Text>
        </View>

        {/* Language selector */}
        <View style={s.langCard}>
          <Text style={s.sectionTitle}>🌐 {lbl('select_language')}</Text>
          <View style={s.langRow}>
            {LANGS.map(l => (
              <TouchableOpacity key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnOn]}
                onPress={() => setLang(l.code)} activeOpacity={0.8}>
                <Text style={s.langFlag}>{l.flag}</Text>
                <Text style={[s.langLabel, lang === l.code && s.langLabelOn]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Login form */}
        <Animated.View style={[s.loginCard, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={s.sectionTitle}>🏪 {lbl('shop_name')}</Text>
          <TextInput
            style={s.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder={`${t('shop_name','th')} / Shop Name`}
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
          />

          <Text style={[s.sectionTitle, { marginTop: 14 }]}>🔑 {lbl('password')}</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="รหัสผ่าน / Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              keyboardType="default"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Text style={s.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnTxt}>🚀 {lbl('confirm')} เข้าสู่ระบบ</Text>}
          </TouchableOpacity>

          <Text style={s.hint}>
            ไม่มีรหัส? ติดต่อร้านเจรุ่งชิลลี่{lang !== 'th' ? '\nContact J.Rung Chilli for password' : ''}
          </Text>
        </Animated.View>

        <Text style={s.version}>v2.6 © 2025 JRungChilli</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  header: { backgroundColor: '#27ae60', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  logo: { fontSize: 60, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  titleSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  shopSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  langCard: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, elevation: 2 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  langBtnOn: { borderColor: '#27ae60', backgroundColor: '#f0faf5' },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginTop: 3 },
  langLabelOn: { color: '#27ae60', fontWeight: 'bold' },
  loginCard: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 18, elevation: 2 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#222', backgroundColor: '#fafafa' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10 },
  eyeIcon: { fontSize: 22 },
  loginBtn: { backgroundColor: '#27ae60', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 18, elevation: 3 },
  loginBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  hint: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 14, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 24, marginBottom: 8 },
});
