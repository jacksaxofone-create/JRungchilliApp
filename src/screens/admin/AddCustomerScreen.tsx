import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DB } from "../../core/database/DatabaseService";

export default function AddCustomerScreen() {
  const navigation = useNavigation<any>();
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [customerType, setCustomerType] = useState<'retail'|'wholesale'>('retail');
  const [creditLimit, setCreditLimit] = useState('0');

  const reset = () => {
    setShopName(''); setPhone(''); setPassword('');
    setNotes(''); setCustomerType('retail'); setCreditLimit('0');
  };

  const handleSave = () => {
    if (!shopName.trim()) { Alert.alert('คำเตือน', 'กรุณากรอกชื่อร้าน'); return; }
    if (!phone.trim()) { Alert.alert('คำเตือน', 'กรุณากรอกเบอร์โทรศัพท์'); return; }
    if (!password.trim()) { Alert.alert('คำเตือน', 'กรุณากำหนดรหัสผ่าน'); return; }
    setSaving(true);
    try {
      DB.saveCustomer({
        id: 'C' + Date.now(),
        shop_name: shopName.trim(),
        phone: phone.trim(),
        password: password.trim(),
        notes: notes.trim(),
        customer_type: customerType,
        credit_limit: Number(creditLimit) || 0,
        credit_used: 0,
        is_active: 1,
        created_at: new Date().toISOString(),
      });
      Alert.alert('สำเร็จ', \เพิ่มลูกค้าร้าน "\" เรียบร้อยแล้ว\, [
        { text: 'เพิ่มอีก', onPress: reset },
        { text: 'กลับ', onPress: () => navigation.goBack() },
      ]);
    } catch(e: any) {
      Alert.alert('บันทึกไม่สำเร็จ', String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#8e44ad" barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.hBtn}>
          <Text style={s.hBtnTxt}>◀</Text>
        </TouchableOpacity>
        <Text style={s.hTitle}>เพิ่มลูกค้าใหม่</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminHome')} style={s.hBtn}>
          <Text style={s.hBtnTxt}>🏠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={s.card}>
          <Text style={s.cardTitle}>📍 ข้อมูลร้านค้า</Text>
          <Text style={s.lbl}>ชื่อร้าน *</Text>
          <TextInput style={s.inp} value={shopName} onChangeText={setShopName} placeholder="เช่น ร้านขายสมุนไพร" placeholderTextColor="#bbb" returnKeyType="next" />
          <Text style={s.lbl}>เบอร์โทร *</Text>
          <TextInput style={s.inp} value={phone} onChangeText={setPhone} placeholder="0812345678" keyboardType="phone-pad" placeholderTextColor="#bbb" returnKeyType="next" />
          <Text style={s.lbl}>หมายเหตุ</Text>
          <TextInput style={s.inp} value={notes} onChangeText={setNotes} placeholder="บันทึกเพิ่มเติม" placeholderTextColor="#bbb" />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>🔑 เข้าใช้งาน</Text>
          <Text style={s.lbl}>รหัสผ่าน *</Text>
          <TextInput style={s.inp} value={password} onChangeText={setPassword} placeholder="กำหนดรหัสผ่านเข้าแอพลูกค้า" secureTextEntry placeholderTextColor="#bbb" />
          <Text style={s.hint}>ลูกค้าใช้รหัสนี้เพื่อเข้าหน้าสั่งสินค้า</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>💳 ประเภทและเครดิต</Text>
          <View style={s.typeRow}>
            {(['retail','wholesale'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, customerType===t && s.typeBtnOn]} onPress={() => setCustomerType(t)}>
                <Text style={[s.typeTxt, customerType===t && s.typeTxtOn]}>
                  {t==='retail' ? '🛒 ค้าปลีก' : '📦 ค้าส่ง'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.lbl}>วงเงินเครดิต (฿)</Text>
          <TextInput style={s.inp} value={creditLimit} onChangeText={setCreditLimit} placeholder="0" keyboardType="decimal-pad" placeholderTextColor="#bbb" />
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnOff]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnTxt}>บันทึกข้อมูลลูกค้า</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#8e44ad', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, elevation: 4 },
  hBtn: { padding: 8, minWidth: 48, alignItems: 'center' },
  hBtnTxt: { color: '#fff', fontSize: 22 },
  hTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  body: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 12, marginBottom: 0, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  lbl: { fontSize: 13, color: '#555', fontWeight: '600', marginTop: 10, marginBottom: 4 },
  inp: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#222', backgroundColor: '#fafafa' },
  hint: { fontSize: 11, color: '#aaa', marginTop: 8, fontStyle: 'italic' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8, marginTop: 8 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  typeBtnOn: { backgroundColor: '#8e44ad', borderColor: '#8e44ad' },
  typeTxt: { fontSize: 15, color: '#555', fontWeight: '600' },
  typeTxtOn: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#8e44ad', borderRadius: 12, paddingVertical: 16, alignItems: 'center', margin: 12, elevation: 3 },
  saveBtnOff: { backgroundColor: '#aaa' },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});

