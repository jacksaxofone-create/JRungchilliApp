import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";

export default function AddCustomerScreen() {
  const navigation = useNavigation<any>();
  const { lang } = useAppStore();
  const [saving, setSaving]               = useState(false);
  const [shopName, setShopName]           = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [customerType, setCustomerType]   = useState<'retail' | 'wholesale'>('retail');
  const [creditLimit, setCreditLimit]     = useState('0');

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key,'th')} / ${t(key, lang)}` : t(key,'th');

  const resetForm = () => {
    setShopName(''); setPhone(''); setPassword(''); setNotes('');
    setCustomerType('retail'); setCreditLimit('0');
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
    try {
      const id  = 'C' + Date.now();
      const now = new Date().toISOString();
      DB.saveCustomer({
        id,
        shop_name:     shopName.trim(),
        phone:         phone.trim(),
        password:      password.trim(),
        notes:         notes.trim(),
        customer_type: customerType,
        credit_limit:  parseFloat(creditLimit) || 0,
        credit_used:   0,
        is_active:     1,
        created_at:    now,
      });
      Alert.alert(
        '✅ ' + t('success','th'),
        `${t('saved','th')} — ${shopName.trim()}`,
        [
          { text: 'เพิ่มอีก / Add more', onPress: resetForm },
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

        {/* ── ข้อมูลร้าน ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏪 ข้อมูลร้านค้า / Shop Info</Text>

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

          <Text style={s.lbl}>🔑 {lbl('password')} *</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="รหัสผ่านสำหรับ Order Screen"
            placeholderTextColor="#bbb"
            secureTextEntry
          />

          <Text style={s.lbl}>📝 {lbl('notes')}</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="หมายเหตุ / Notes (ไม่บังคับ)"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── ประเภทลูกค้า ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            👤 ประเภทลูกค้า / Customer Type
          </Text>
          <View style={s.typeRow}>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'retail' && s.typeBtnOn]}
              onPress={() => setCustomerType('retail')}
              activeOpacity={0.8}
            >
              <Text style={s.typeIcon}>🛒</Text>
              <Text style={[s.typeTh, customerType === 'retail' && s.typeTxtOn]}>
                ปลีก
              </Text>
              <Text style={[s.typeSub, customerType === 'retail' && s.typeSubOn]}>
                {t('price_retail','th')}
                {lang !== 'th' ? `\n${t('price_retail', lang)}` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.typeBtn, customerType === 'wholesale' && s.typeBtnOnWhole]}
              onPress={() => setCustomerType('wholesale')}
              activeOpacity={0.8}
            >
              <Text style={s.typeIcon}>📦</Text>
              <Text style={[s.typeTh, customerType === 'wholesale' && s.typeTxtOnWhole]}>
                ส่ง
              </Text>
              <Text style={[s.typeSub, customerType === 'wholesale' && s.typeSubOnWhole]}>
                {t('price_wholesale','th')}
                {lang !== 'th' ? `\n${t('price_wholesale', lang)}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── วงเงินเครดิต ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            💳 {t('credit','th')}{lang !== 'th' ? ` / ${t('credit', lang)}` : ''} — วงเงิน / Limit
          </Text>
          <Text style={s.lbl}>วงเงินเครดิต ฿ / Credit Limit ฿</Text>
          <TextInput
            style={s.input}
            value={creditLimit}
            onChangeText={setCreditLimit}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#bbb"
          />
          <Text style={s.hint}>0 = ไม่มีวงเงิน / 0 = No credit limit</Text>
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
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#2980b9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, margin: 10, marginBottom: 0, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  lbl: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#222', backgroundColor: '#fafafa' },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: '#aaa', marginTop: 6 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  typeBtnOn: { borderColor: '#c0392b', backgroundColor: '#fef5f5' },
  typeBtnOnWhole: { borderColor: '#27ae60', backgroundColor: '#f0faf5' },
  typeIcon: { fontSize: 28, marginBottom: 6 },
  typeTh: { fontSize: 15, fontWeight: 'bold', color: '#555' },
  typeTxtOn: { color: '#c0392b' },
  typeTxtOnWhole: { color: '#27ae60' },
  typeSub: { fontSize: 11, color: '#aaa', marginTop: 3, textAlign: 'center', lineHeight: 16 },
  typeSubOn: { color: '#c0392b' },
  typeSubOnWhole: { color: '#27ae60' },
  footer: { margin: 10, marginBottom: 0, gap: 8 },
  saveBtn: { backgroundColor: '#2980b9', borderRadius: 12, paddingVertical: 15, alignItems: 'center', elevation: 3 },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  saveBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  cancelBtn: { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelBtnTxt: { color: '#555', fontWeight: '600', fontSize: 14 },
});