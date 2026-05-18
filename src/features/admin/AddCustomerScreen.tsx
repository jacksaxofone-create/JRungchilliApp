import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator,
  Clipboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";

// ─── สร้าง Password แบบสุ่ม ────────────────────────────────
function generatePassword(length = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AddCustomerScreen() {
  const navigation = useNavigation<any>();
  const { lang } = useAppStore();
  const [saving, setSaving]             = useState(false);
  const [shopName, setShopName]         = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [notes, setNotes]               = useState('');
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('wholesale');
  const [creditLimit, setCreditLimit]   = useState('5000');
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key,'th')} / ${t(key, lang)}` : t(key,'th');

  const resetForm = () => {
    setShopName(''); setPhone('');
    setPassword(generatePassword());
    setNotes(''); setCustomerType('wholesale');
    setCreditLimit('5000'); setSavedPassword(null);
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('✅ ' + t('copied','th'), `"${text}" คัดลอกแล้ว`);
  };

  const handleSave = () => {
    if (!shopName.trim()) {
      Alert.alert(t('warning','th'), `${lbl('shop_name')} จำเป็นต้องกรอก`);
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t('warning','th'), `${lbl('phone')} จำเป็นต้องกรอก`);
      return;
    }
    if (!password.trim()) {
      Alert.alert(t('warning','th'), `${lbl('password')} จำเป็นต้องกรอก`);
      return;
    }
    setSaving(true);
    const finalPassword = password.trim();
    try {
      const id  = 'C' + Date.now();
      const now = new Date().toISOString();
      DB.saveCustomer({
        id,
        shop_name:     shopName.trim(),
        phone:         phone.trim(),
        password:      finalPassword,
        notes:         notes.trim(),
        customer_type: customerType,
        credit_limit:  parseFloat(creditLimit) || 0,
        credit_used:   0,
        is_active:     1,
        created_at:    now,
      });
      setSavedPassword(finalPassword);
      Alert.alert(
        '✅ ' + t('success','th'),
        `บันทึกลูกค้า "${shopName.trim()}" สำเร็จ\n\nรหัสผ่าน: ${finalPassword}\n\n⚠️ บันทึกรหัสผ่านนี้ไว้ก่อนปิดหน้านี้`,
        [
          {
            text: '📋 คัดลอกรหัสผ่าน',
            onPress: () => {
              copyToClipboard(finalPassword);
            },
          },
          { text: 'เพิ่มลูกค้าอีก', onPress: resetForm },
          { text: t('back','th'), onPress: () => navigation.goBack() },
        ]
      );
    } catch (e: any) {
      Alert.alert('❌ ' + t('error','th'), String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#2980b9" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>➕👤 {t('add_customer','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('add_customer', lang)}</Text>}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* ── รหัสผ่านที่บันทึกล่าสุด ── */}
        {savedPassword && (
          <View style={s.savedPasswordBanner}>
            <Text style={s.savedPasswordTitle}>✅ บันทึกสำเร็จ — รหัสผ่านลูกค้า:</Text>
            <View style={s.savedPasswordRow}>
              <Text style={s.savedPasswordValue}>{savedPassword}</Text>
              <TouchableOpacity style={s.copyBtn} onPress={() => copyToClipboard(savedPassword)}>
                <Text style={s.copyBtnTxt}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.savedPasswordHint}>⚠️ บันทึกรหัสผ่านนี้ไว้ให้ลูกค้า</Text>
          </View>
        )}

        {/* ── ข้อมูลร้าน ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏪 ข้อมูลร้านค้า</Text>

          <Text style={s.lbl}>🏪 {lbl('shop_name')} *</Text>
          <TextInput
            style={s.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder="ชื่อร้าน / Shop name"
            placeholderTextColor="#bbb"
          />

          <Text style={s.lbl}>📞 {lbl('phone')} *</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="09x-xxx-xxxx"
            placeholderTextColor="#bbb"
          />

          <Text style={s.lbl}>📝 {lbl('notes')}</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="หมายเหตุ (ไม่บังคับ)"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* ── รหัสผ่าน (auto-generated) ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🔑 {lbl('password')}</Text>

          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="รหัสผ่านสำหรับ Order Screen"
              placeholderTextColor="#bbb"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(v => !v)}
            >
              <Text style={s.eyeBtnTxt}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.pwdActionRow}>
            <TouchableOpacity
              style={[s.pwdBtn, { backgroundColor: '#f39c12' }]}
              onPress={() => setPassword(generatePassword())}
            >
              <Text style={s.pwdBtnTxt}>🎲 {t('generate_password','th')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pwdBtn, { backgroundColor: '#2980b9' }]}
              onPress={() => copyToClipboard(password)}
            >
              <Text style={s.pwdBtnTxt}>📋 {t('copy','th')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>รหัสผ่านนี้ใช้ login ใน Customer Screen</Text>
        </View>

        {/* ── ประเภทลูกค้า ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 ประเภทลูกค้า</Text>
          <View style={s.typeRow}>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'retail' && s.typeBtnOn]}
              onPress={() => setCustomerType('retail')}
              activeOpacity={0.8}
            >
              <Text style={s.typeIcon}>🛒</Text>
              <Text style={[s.typeTh, customerType === 'retail' && s.typeTxtOn]}>ปลีก</Text>
              <Text style={s.typeSub}>{t('price_retail','th')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'wholesale' && s.typeBtnOnWhole]}
              onPress={() => setCustomerType('wholesale')}
              activeOpacity={0.8}
            >
              <Text style={s.typeIcon}>📦</Text>
              <Text style={[s.typeTh, customerType === 'wholesale' && s.typeTxtOnWhole]}>ส่ง</Text>
              <Text style={s.typeSub}>{t('price_wholesale','th')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── วงเงินเครดิต ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💳 {t('credit_limit','th')}</Text>
          <TextInput
            style={s.input}
            value={creditLimit}
            onChangeText={setCreditLimit}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#bbb"
          />
          <Text style={s.hint}>0 = ไม่มีวงเงิน · แนะนำ 5,000–20,000</Text>
        </View>

        {/* ── ปุ่มบันทึก ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={s.saveBtnTxt}>💾 {t('save','th')}</Text>
                  {lang !== 'th' && <Text style={s.saveBtnSub}>{t('save', lang)}</Text>}
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnTxt}>
              {t('cancel','th')}{lang !== 'th' ? ` / ${t('cancel', lang)}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f0f0f0' },
  header:       { backgroundColor: '#2980b9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn:      { width: 60, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body:         { flex: 1 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, margin: 10, marginBottom: 0, elevation: 2 },
  cardTitle:    { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  lbl:          { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input:        { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#222', backgroundColor: '#fafafa' },
  inputMulti:   { height: 70, textAlignVertical: 'top' },
  hint:         { fontSize: 11, color: '#aaa', marginTop: 6 },

  savedPasswordBanner: { backgroundColor: '#e8f5e9', borderRadius: 12, margin: 10, marginBottom: 0, padding: 14, borderWidth: 1.5, borderColor: '#27ae60' },
  savedPasswordTitle:  { fontSize: 13, fontWeight: 'bold', color: '#27ae60', marginBottom: 8 },
  savedPasswordRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  savedPasswordValue:  { fontSize: 20, fontWeight: 'bold', color: '#1a252f', letterSpacing: 2, flex: 1 },
  savedPasswordHint:   { fontSize: 12, color: '#e67e22', fontWeight: '600' },
  copyBtn:             { backgroundColor: '#27ae60', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  copyBtnTxt:          { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  passwordRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn:         { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  eyeBtnTxt:      { fontSize: 22 },

  pwdActionRow:   { flexDirection: 'row', gap: 8, marginTop: 10 },
  pwdBtn:         { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pwdBtnTxt:      { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  typeRow:        { flexDirection: 'row', gap: 10 },
  typeBtn:        { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  typeBtnOn:      { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  typeBtnOnWhole: { borderColor: '#27ae60', backgroundColor: '#f0faf5' },
  typeIcon:       { fontSize: 28, marginBottom: 6 },
  typeTh:         { fontSize: 15, fontWeight: 'bold', color: '#555' },
  typeTxtOn:      { color: '#c0392b' },
  typeTxtOnWhole: { color: '#27ae60' },
  typeSub:        { fontSize: 11, color: '#aaa', marginTop: 3 },

  footer:         { margin: 10, marginBottom: 0, gap: 8 },
  saveBtn:        { backgroundColor: '#2980b9', borderRadius: 12, paddingVertical: 15, alignItems: 'center', elevation: 3 },
  saveBtnTxt:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  saveBtnSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  cancelBtn:      { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelBtnTxt:   { color: '#555', fontWeight: '600', fontSize: 14 },
});
