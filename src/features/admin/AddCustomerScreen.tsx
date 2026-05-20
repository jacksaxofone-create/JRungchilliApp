import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

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
  const { lang, setCustomers } = useAppStore();
  const [saving, setSaving]               = useState(false);
  const [shopName, setShopName]           = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState(generatePassword());
  const [showPassword, setShowPassword]   = useState(true);
  const [notes, setNotes]                 = useState('');
  const [customerType, setCustomerType]   = useState<'retail' | 'wholesale'>('wholesale');
  const [creditLimit, setCreditLimit]     = useState('5000');
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key, 'th')} / ${t(key, lang)}` : t(key, 'th');

  const resetForm = () => {
    setShopName(''); setPhone('');
    setPassword(generatePassword());
    setNotes(''); setCustomerType('wholesale');
    setCreditLimit('5000'); setSavedPassword(null);
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('✅ ' + t('copied', 'th'), `"${text}" คัดลอกแล้ว`);
  };

  const handleSave = () => {
    if (!shopName.trim()) { Alert.alert(t('warning', 'th'), `${lbl('shop_name')} จำเป็นต้องกรอก`); return; }
    if (!phone.trim())    { Alert.alert(t('warning', 'th'), `${lbl('phone')} จำเป็นต้องกรอก`); return; }
    if (!password.trim()) { Alert.alert(t('warning', 'th'), `${lbl('password')} จำเป็นต้องกรอก`); return; }
    setSaving(true);
    const finalPassword = password.trim();
    try {
      const id  = 'C' + Date.now();
      const now = new Date().toISOString();
      console.log('[AddCustomer] saving customer:', shopName.trim(), 'id:', id);
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
      const updated = DB.getAllCustomers();
      setCustomers(updated);
      console.log('[AddCustomer] save success, store updated with', updated.length, 'customers');
      setSavedPassword(finalPassword);
      Alert.alert(
        '✅ ' + t('success', 'th'),
        `บันทึกลูกค้า "${shopName.trim()}" สำเร็จ\n\nรหัสผ่าน: ${finalPassword}\n\n⚠️ บันทึกรหัสผ่านนี้ไว้ก่อนปิดหน้านี้`,
        [
          { text: '📋 คัดลอกรหัสผ่าน', onPress: () => copyToClipboard(finalPassword) },
          { text: 'เพิ่มลูกค้าอีก', onPress: resetForm },
          { text: t('back', 'th'), onPress: () => navigation.goBack() },
        ]
      );
    } catch (e: any) {
      Alert.alert('❌ ' + t('error', 'th'), String(e?.message || e));
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back', 'th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerIconRow}>
            <View style={s.headerIcon}><Text style={{ fontSize: 18 }}>👤</Text></View>
          </View>
          <Text style={s.headerTitle}>➕ {t('add_customer', 'th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('add_customer', lang)}</Text>}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ─── Password saved banner ─── */}
        {savedPassword && (
          <View style={s.savedBanner}>
            <Text style={s.savedTitle}>✅ บันทึกสำเร็จ — รหัสผ่านลูกค้า:</Text>
            <View style={s.savedRow}>
              <Text style={s.savedVal}>{savedPassword}</Text>
              <TouchableOpacity style={s.copyBtn} onPress={() => copyToClipboard(savedPassword)}>
                <Text style={s.copyBtnTxt}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.savedHint}>⚠️ บันทึกรหัสผ่านนี้ไว้ให้ลูกค้า</Text>
          </View>
        )}

        {/* ─── ข้อมูลร้าน ─── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitleIcon}>🏪</Text>
            <Text style={s.cardTitle}>ข้อมูลร้านค้า</Text>
          </View>

          <Text style={s.lbl}>🏪 {lbl('shop_name')} *</Text>
          <TextInput style={s.input} value={shopName} onChangeText={setShopName}
            placeholder="ชื่อร้าน / Shop name" placeholderTextColor={CHILLI.textLight} />

          <Text style={s.lbl}>📞 {lbl('phone')} *</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" placeholder="09x-xxx-xxxx" placeholderTextColor={CHILLI.textLight} />

          <Text style={s.lbl}>📝 {lbl('notes')}</Text>
          <TextInput style={[s.input, s.inputMulti]} value={notes} onChangeText={setNotes}
            placeholder="หมายเหตุ (ไม่บังคับ)" placeholderTextColor={CHILLI.textLight}
            multiline numberOfLines={2} />
        </View>

        {/* ─── รหัสผ่าน ─── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitleIcon}>🔑</Text>
            <Text style={s.cardTitle}>{lbl('password')}</Text>
          </View>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="รหัสผ่านสำหรับ Order Screen"
              placeholderTextColor={CHILLI.textLight}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Text style={s.eyeBtnTxt}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.pwdActionRow}>
            <TouchableOpacity style={[s.pwdBtn, { backgroundColor: CHILLI.orange }]}
              onPress={() => setPassword(generatePassword())}>
              <Text style={s.pwdBtnTxt}>🎲 {t('generate_password', 'th')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.pwdBtn, { backgroundColor: CHILLI.red }]}
              onPress={() => copyToClipboard(password)}>
              <Text style={s.pwdBtnTxt}>📋 {t('copy', 'th')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>รหัสผ่านนี้ใช้ login ใน Customer Screen</Text>
        </View>

        {/* ─── ประเภทลูกค้า ─── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitleIcon}>👤</Text>
            <Text style={s.cardTitle}>ประเภทลูกค้า</Text>
          </View>
          <View style={s.typeRow}>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'retail' && s.typeBtnRetail]}
              onPress={() => setCustomerType('retail')} activeOpacity={0.8}>
              <Text style={s.typeIcon}>🛒</Text>
              <Text style={[s.typeTh, customerType === 'retail' && { color: CHILLI.red }]}>ปลีก</Text>
              <Text style={s.typeSub}>{t('price_retail', 'th')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'wholesale' && s.typeBtnWhole]}
              onPress={() => setCustomerType('wholesale')} activeOpacity={0.8}>
              <Text style={s.typeIcon}>📦</Text>
              <Text style={[s.typeTh, customerType === 'wholesale' && { color: CHILLI.orange }]}>ส่ง</Text>
              <Text style={s.typeSub}>{t('price_wholesale', 'th')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── วงเงินเครดิต ─── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitleIcon}>💳</Text>
            <Text style={s.cardTitle}>{t('credit_limit', 'th')}</Text>
          </View>
          <TextInput style={s.input} value={creditLimit} onChangeText={setCreditLimit}
            keyboardType="decimal-pad" placeholder="0" placeholderTextColor={CHILLI.textLight} />
          <Text style={s.hint}>0 = ไม่มีวงเงิน · แนะนำ 5,000–20,000</Text>

          {/* Quick credit buttons */}
          <View style={s.quickCreditRow}>
            {['0', '5000', '10000', '20000', '50000'].map(v => (
              <TouchableOpacity key={v} style={[s.quickCredit, creditLimit === v && s.quickCreditOn]}
                onPress={() => setCreditLimit(v)}>
                <Text style={[s.quickCreditTxt, creditLimit === v && { color: CHILLI.red }]}>
                  {v === '0' ? 'ไม่มี' : `฿${parseInt(v).toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── ปุ่มบันทึก ─── */}
        <View style={s.footer}>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={CHILLI.white} /> :
              <>
                <Text style={s.saveBtnTxt}>💾 {t('save', 'th')}</Text>
                {lang !== 'th' && <Text style={s.saveBtnSub}>{t('save', lang)}</Text>}
              </>
            }
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnTxt}>
              {t('cancel', 'th')}{lang !== 'th' ? ` / ${t('cancel', lang)}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: CHILLI.dark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, ...shadow(3),
  },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: CHILLI.white, fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerIconRow: { marginBottom: 4 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: CHILLI.red,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.white },
  headerSub: { fontSize: 11, color: CHILLI.textOnDarkSub, marginTop: 2 },
  card: {
    backgroundColor: CHILLI.white, borderRadius: 14, padding: 14,
    margin: 10, marginBottom: 0, ...shadow(2),
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitleIcon: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.dark },
  lbl: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '700', marginBottom: 5, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: CHILLI.dark, backgroundColor: CHILLI.cream,
  },
  inputMulti: { height: 70, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 6 },
  // Saved password banner
  savedBanner: {
    backgroundColor: '#e8f5e9', borderRadius: 14, margin: 10, marginBottom: 0,
    padding: 14, borderWidth: 1.5, borderColor: CHILLI.green,
  },
  savedTitle: { fontSize: 13, fontWeight: '800', color: CHILLI.green, marginBottom: 8 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  savedVal: { fontSize: 22, fontWeight: '800', color: CHILLI.dark, letterSpacing: 2, flex: 1 },
  savedHint: { fontSize: 12, color: CHILLI.orange, fontWeight: '700' },
  copyBtn: { backgroundColor: CHILLI.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  copyBtnTxt: { color: CHILLI.white, fontWeight: '800', fontSize: 13 },
  // Password row
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: CHILLI.cream, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  eyeBtnTxt: { fontSize: 22 },
  pwdActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pwdBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', ...shadow(1) },
  pwdBtnTxt: { color: CHILLI.white, fontWeight: '800', fontSize: 13 },
  // Customer type
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: CHILLI.borderLight, backgroundColor: CHILLI.cream,
  },
  typeBtnRetail:  { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  typeBtnWhole:   { borderColor: CHILLI.orange, backgroundColor: '#fff3e0' },
  typeIcon: { fontSize: 28, marginBottom: 6 },
  typeTh: { fontSize: 15, fontWeight: '800', color: CHILLI.textSecondary },
  typeSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 3 },
  // Quick credit buttons
  quickCreditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickCredit: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: CHILLI.cream, borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  quickCreditOn: { borderColor: CHILLI.red, backgroundColor: '#fff0ee' },
  quickCreditTxt: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '700' },
  // Footer
  footer: { margin: 10, marginBottom: 0, gap: 8 },
  saveBtn: {
    backgroundColor: CHILLI.red, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', ...shadow(3),
  },
  saveBtnTxt: { color: CHILLI.white, fontWeight: '800', fontSize: 16 },
  saveBtnSub: { color: CHILLI.textOnDarkSub, fontSize: 11, marginTop: 2 },
  cancelBtn: {
    backgroundColor: CHILLI.cream, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  cancelBtnTxt: { color: CHILLI.textSecondary, fontWeight: '600', fontSize: 14 },
});
