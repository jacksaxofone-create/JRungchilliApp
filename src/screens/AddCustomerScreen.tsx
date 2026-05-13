import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { DatabaseService } from '../services/database';

export default function AddCustomerScreen({ navigation }: any) {
  const [shopName, setShopName] = useState('');
  const [shopNameMy, setShopNameMy] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อร้าน');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!password.trim() || password.length < 4) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    setSaving(true);
    try {
      await DatabaseService.addCustomer({
        name_th: shopName.trim(),
        name_my: shopNameMy.trim() || shopName.trim(),
        name_en: shopName.trim(),
        name_zh: shopName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        password: password,
        credit_limit: Number(creditLimit) || 0,
        current_credit: 0,
        notes: notes.trim(),
        is_active: 1,
      });
      Alert.alert('สำเร็จ', 'เพิ่มลูกค้าเรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE') || e?.message?.includes('unique')) {
        Alert.alert('เกิดข้อผิดพลาด', 'เบอร์โทรศัพท์นี้มีในระบบแล้ว');
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>เพิ่มลูกค้าใหม่</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏪 ข้อมูลร้านค้า</Text>

        <Text style={styles.label}>ชื่อร้าน (ภาษาไทย) *</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="เช่น ร้านแม่สอดพริก"
        />

        <Text style={styles.label}>ชื่อร้าน (ภาษาพม่า)</Text>
        <TextInput
          style={styles.input}
          value={shopNameMy}
          onChangeText={setShopNameMy}
          placeholder="Myanmar shop name"
        />

        <Text style={styles.label}>ชื่อเจ้าของร้าน</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="ชื่อ-นามสกุล"
        />

        <Text style={styles.label}>เบอร์โทรศัพท์ *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="0XX-XXX-XXXX"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔐 รหัสผ่าน (สำหรับล็อกอิน)</Text>

        <Text style={styles.label}>รหัสผ่าน * (อย่างน้อย 4 ตัวอักษร)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="กรอกรหัสผ่าน"
          secureTextEntry
        />

        <Text style={styles.label}>ยืนยันรหัสผ่าน *</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          secureTextEntry
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💳 เครดิตและหมายเหตุ</Text>

        <Text style={styles.label}>วงเงินเครดิต (บาท)</Text>
        <TextInput
          style={styles.input}
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="0"
          keyboardType="numeric"
        />

        <Text style={styles.label}>หมายเหตุ / บันทึกการแก้ปัญหา</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="บันทึกข้อมูลเพิ่มเติม เช่น ปัญหาที่เคยเกิดขึ้น วิธีแก้ไข"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>💾 บันทึกลูกค้า</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, marginRight: 12 },
  backText: { fontSize: 16, color: '#c0392b', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: '#fafafa',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#c0392b', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 3,
    marginBottom: 20,
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});