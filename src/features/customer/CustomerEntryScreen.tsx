/**
 * 🌶️ CustomerEntryScreen — หน้าเลือกประเภทลูกค้า
 * ─────────────────────────────────────────────────
 * 2 ตัวเลือก:
 *   A) "ลูกค้าทั่วไป"  → Walk-in POS (POSScreen)
 *   B) "สมาชิก"        → ฟอร์ม login (ชื่อร้าน + รหัสผ่าน) → WholesaleOrderScreen
 */
import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  StyleSheet, StatusBar, Animated, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

export default function CustomerEntryScreen() {
  const navigation = useNavigation<any>();
  const { lang, setCurrentCustomer } = useAppStore();
  const [mode, setMode]             = useState<'choose' | 'login'>('choose');
  const [shopName, setShopName]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  // ── ลูกค้าทั่วไป → POS Walk-in ──
  const goWalkIn = () => {
    navigation.navigate('POS');
  };

  // ── สมาชิก Login ──
  const handleMemberLogin = () => {
    if (!shopName.trim()) {
      shake();
      Alert.alert(t('warning', 'th'), `${t('shop_name', 'th')} จำเป็นต้องกรอก`);
      return;
    }
    if (!password.trim()) {
      shake();
      Alert.alert(t('warning', 'th'), `${t('password', 'th')} จำเป็นต้องกรอก`);
      return;
    }
    setLoading(true);
    try {
      const customer = DB.loginCustomer(shopName.trim(), password.trim());
      if (!customer) {
        shake();
        setLoading(false);
        Alert.alert(
          '❌ ' + t('error', 'th'),
          lang !== 'th'
            ? `ชื่อร้านหรือรหัสผ่านไม่ถูกต้อง\n${t('wrong_pin', lang)}`
            : 'ชื่อร้านหรือรหัสผ่านไม่ถูกต้อง',
        );
        return;
      }
      setCurrentCustomer(customer);
      setLoading(false);
      setShopName('');
      setPassword('');
      setMode('choose');
      navigation.navigate('WholesaleOrder', { customer });
    } catch (e: any) {
      setLoading(false);
      Alert.alert('❌ ' + t('error', 'th'), String(e?.message || e));
    }
  };

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  // ════════════════════════════════
  // หน้า Choose (2 ตัวเลือก)
  // ════════════════════════════════
  if (mode === 'choose') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerCenter}>
            <Text style={s.headerEmoji}>🌶️</Text>
            <Text style={s.headerTitle}>สั่งสินค้า</Text>
            {lang !== 'th' && <Text style={s.headerSub}>{t('order_tab', lang)}</Text>}
          </View>
        </View>

        {/* เนื้อหา */}
        <View style={s.body}>
          <Text style={s.chooseTitle}>เลือกประเภทลูกค้า</Text>
          {lang !== 'th' && <Text style={s.chooseSub}>Customer Type / ဖောက်သည်အမျိုး</Text>}

          {/* ── Option A: ลูกค้าทั่วไป ── */}
          <TouchableOpacity
            style={[s.optionCard, s.optionCardA]}
            onPress={goWalkIn}
            activeOpacity={0.85}
          >
            <Text style={s.optionEmoji}>🛒</Text>
            <View style={s.optionText}>
              <Text style={s.optionTitle}>{t('general_customer', 'th')}</Text>
              {lang !== 'th' && (
                <Text style={s.optionSub}>{t('general_customer', lang)}</Text>
              )}
              <Text style={s.optionDesc}>ชำระเงินสด · ราคาปลีก</Text>
            </View>
            <Text style={s.optionArrow}>→</Text>
          </TouchableOpacity>

          {/* ── Option B: สมาชิก ── */}
          <TouchableOpacity
            style={[s.optionCard, s.optionCardB]}
            onPress={() => setMode('login')}
            activeOpacity={0.85}
          >
            <Text style={s.optionEmoji}>📦</Text>
            <View style={s.optionText}>
              <Text style={[s.optionTitle, { color: CHILLI.orange }]}>สมาชิก</Text>
              {lang !== 'th' && (
                <Text style={s.optionSub}>{t('type_wholesale', lang)}</Text>
              )}
              <Text style={s.optionDesc}>ราคาส่ง · เครดิต · ออเดอร์ล่วงหน้า</Text>
            </View>
            <Text style={[s.optionArrow, { color: CHILLI.orange }]}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════
  // หน้า Login สมาชิก
  // ════════════════════════════════
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => setMode('choose')}>
          <Text style={s.backTxt}>🏠 BACK</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerEmoji}>📦</Text>
          <Text style={s.headerTitle}>สมาชิก / Member Login</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.body}>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={s.loginCard}>
              <Text style={s.loginCardTitle}>🔑 เข้าสู่ระบบ</Text>
              {lang !== 'th' && <Text style={s.loginCardSub}>Member Login</Text>}

              <Text style={s.lbl}>🏪 {lbl('shop_name')} *</Text>
              <TextInput
                style={s.input}
                value={shopName}
                onChangeText={setShopName}
                placeholder={`${t('shop_name', 'th')}...`}
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />

              <Text style={s.lbl}>🔒 {lbl('password')} *</Text>
              <View style={s.pwdRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  onSubmitEditing={handleMemberLogin}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowPwd(v => !v)}
                >
                  <Text style={{ fontSize: 22 }}>{showPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.loginBtn, loading && { opacity: 0.6 }]}
                onPress={handleMemberLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={s.loginBtnTxt}>🔑 {t('confirm', 'th')}</Text>
                      {lang !== 'th' && (
                        <Text style={s.loginBtnSub}>{t('confirm', lang)}</Text>
                      )}
                    </>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  // Header
  header: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...shadow(4),
  },
  backBtn:      { width: 70, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEmoji:  { fontSize: 28, marginBottom: 2 },
  headerTitle:  { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Body
  body: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  // Choose screen
  chooseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CHILLI.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  chooseSub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Option cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    ...shadow(3),
  },
  optionCardA: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: CHILLI.red,
  },
  optionCardB: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: CHILLI.orange,
  },
  optionEmoji:  { fontSize: 44, marginRight: 16 },
  optionText:   { flex: 1 },
  optionTitle:  { fontSize: 18, fontWeight: 'bold', color: CHILLI.red, marginBottom: 3 },
  optionSub:    { fontSize: 12, color: '#888', marginBottom: 4 },
  optionDesc:   { fontSize: 12, color: '#666' },
  optionArrow:  { fontSize: 22, fontWeight: 'bold', color: CHILLI.red, marginLeft: 8 },

  // Login card
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...shadow(3),
  },
  loginCardTitle: { fontSize: 18, fontWeight: 'bold', color: CHILLI.dark, marginBottom: 4 },
  loginCardSub:   { fontSize: 12, color: '#888', marginBottom: 16 },
  lbl: {
    fontSize: 13,
    color: '#555',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e8d5c4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CHILLI.dark,
    backgroundColor: CHILLI.cream,
  },
  pwdRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: CHILLI.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8d5c4',
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: CHILLI.red,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    ...shadow(3),
  },
  loginBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  loginBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 3 },
});
