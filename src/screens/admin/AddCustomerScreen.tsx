import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch
} from 'react-native';
import { DatabaseService } from '../../services/database';

const EMPTY_CUSTOMER = {
  id: '',
  name_th: '', name_mm: '', name_en: '', name_cn: '',
  owner_name: '', phone: '', address: '',
  pin: '', confirm_pin: '',
  credit_limit: '0', credit_status: 'normal',
  has_delivery: false, notes: '',
};

export const AddCustomerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const editCustomer = route?.params?.customer || null;
  const isEdit = !!editCustomer;

  const [form, setForm] = useState(
    isEdit
      ? { ...editCustomer,
          credit_limit: String(editCustomer.credit_limit ?? '0'),
          confirm_pin:  editCustomer.pin ?? '',
        }
      : { ...EMPTY_CUSTOMER }
  );
  const [saving, setSaving]       = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [showPin2, setShowPin2]   = useState(false);

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.name_th.trim()) {
      Alert.alert('⚠️', 'กรุณากรอกชื่อร้าน (ภาษาไทย)'); return false;
    }
    if (!form.phone.trim()) {
      Alert.alert('⚠️', 'กรุณากรอกเบอร์โทรศัพท์'); return false;
    }
    if (!form.pin || form.pin.length < 4) {
      Alert.alert('⚠️', 'รหัสผ่านต้องมีอย่างน้อย 4 หลัก\nPassword must be at least 4 digits'); return false;
    }
    if (form.pin !== form.confirm_pin) {
      Alert.alert('⚠️', 'รหัสผ่านไม่ตรงกัน\nPasswords do not match'); return false;
    }
    if (form.credit_limit && isNaN(Number(form.credit_limit))) {
      Alert.alert('⚠️', 'วงเงินเครดิตต้องเป็นตัวเลข'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const id = isEdit ? form.id : `c${Date.now()}`;
      await DatabaseService.upsertCustomer({
        id,
        name_th:       form.name_th.trim(),
        name_mm:       form.name_mm.trim(),
        name_en:       form.name_en.trim(),
        name_cn:       form.name_cn.trim(),
        owner_name:    form.owner_name.trim(),
        phone:         form.phone.trim(),
        address:       form.address.trim(),
        pin:           form.pin,
        credit_limit:  Number(form.credit_limit) || 0,
        credit_used:   editCustomer?.credit_used ?? 0,
        credit_status: form.credit_status,
        has_delivery:  form.has_delivery ? 1 : 0,
        notes:         form.notes.trim(),
        is_active:     1,
      });
      Alert.alert(
        '✅ สำเร็จ',
        isEdit ? 'แก้ไขข้อมูลลูกค้าเรียบร้อย' : 'เพิ่มลูกค้าเรียบร้อยแล้ว',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('❌ ผิดพลาด', 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? '✏️ แก้ไขข้อมูลลูกค้า' : '➕ เพิ่มลูกค้าใหม่'}
        </Text>
      </View>

      {/* Shop Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 ชื่อร้าน / Shop Name</Text>
        <View style={styles.inputRow}>
          <Text style={styles.flag}>🇹🇭</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>ชื่อร้าน (ไทย) *</Text>
            <TextInput style={styles.input} value={form.name_th}
              onChangeText={v => set('name_th', v)} placeholder="เช่น ร้านค้าสมศรี" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.flag}>🇲🇲</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>ชื่อร้าน (พม่า)</Text>
            <TextInput style={styles.input} value={form.name_mm}
              onChangeText={v => set('name_mm', v)} placeholder="Myanmar shop name" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.flag}>🇬🇧</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>ชื่อร้าน (อังกฤษ)</Text>
            <TextInput style={styles.input} value={form.name_en}
              onChangeText={v => set('name_en', v)} placeholder="English shop name" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.flag}>🇨🇳</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>ชื่อร้าน (จีน)</Text>
            <TextInput style={styles.input} value={form.name_cn}
              onChangeText={v => set('name_cn', v)} placeholder="中文店名" />
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 ข้อมูลติดต่อ / Contact</Text>
        <Text style={styles.label}>ชื่อเจ้าของ / Owner Name</Text>
        <TextInput style={[styles.input, styles.mb12]} value={form.owner_name}
          onChangeText={v => set('owner_name', v)} placeholder="ชื่อ-นามสกุล" />

        <Text style={styles.label}>เบอร์โทรศัพท์ / Phone *</Text>
        <TextInput style={[styles.input, styles.mb12]} value={form.phone}
          onChangeText={v => set('phone', v)} placeholder="0812345678"
          keyboardType="phone-pad" />

        <Text style={styles.label}>ที่อยู่จัดส่ง / Address</Text>
        <TextInput style={[styles.input, styles.multiline]} value={form.address}
          onChangeText={v => set('address', v)}
          placeholder="ที่อยู่สำหรับจัดส่งสินค้า"
          multiline numberOfLines={3} textAlignVertical="top" />
      </View>

      {/* Password / PIN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 รหัสผ่าน / Password (PIN)</Text>
        <Text style={styles.pinNote}>
          ลูกค้าใช้รหัสนี้เพื่อเข้าสู่ระบบ{'\n'}
          Customer uses this PIN to login
        </Text>
        <Text style={styles.label}>รหัสผ่าน (อย่างน้อย 4 หลัก) *</Text>
        <View style={styles.pinRow}>
          <TextInput
            style={[styles.input, styles.pinInput]}
            value={form.pin}
            onChangeText={v => set('pin', v.replace(/[^0-9]/g, ''))}
            placeholder="••••"
            secureTextEntry={!showPin}
            keyboardType="number-pad"
            maxLength={8}
          />
          <TouchableOpacity onPress={() => setShowPin(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPin ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>ยืนยันรหัสผ่าน / Confirm PIN *</Text>
        <View style={styles.pinRow}>
          <TextInput
            style={[styles.input, styles.pinInput,
              form.confirm_pin && form.pin !== form.confirm_pin ? styles.inputError : null
            ]}
            value={form.confirm_pin}
            onChangeText={v => set('confirm_pin', v.replace(/[^0-9]/g, ''))}
            placeholder="••••"
            secureTextEntry={!showPin2}
            keyboardType="number-pad"
            maxLength={8}
          />
          <TouchableOpacity onPress={() => setShowPin2(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPin2 ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {form.confirm_pin && form.pin !== form.confirm_pin ? (
          <Text style={styles.errorText}>❌ รหัสผ่านไม่ตรงกัน</Text>
        ) : form.confirm_pin && form.pin === form.confirm_pin ? (
          <Text style={styles.successText}>✅ รหัสผ่านตรงกัน</Text>
        ) : null}
      </View>

      {/* Credit & Delivery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 เครดิตและการจัดส่ง / Credit & Delivery</Text>

        <Text style={styles.label}>วงเงินเครดิต (บาท) / Credit Limit (THB)</Text>
        <TextInput
          style={[styles.input, styles.mb12]}
          value={form.credit_limit}
          onChangeText={v => set('credit_limit', v)}
          keyboardType="number-pad"
          placeholder="0"
        />

        <Text style={styles.label}>สถานะเครดิต / Credit Status</Text>
        <View style={styles.creditStatusRow}>
          {(['normal','warning','overdue'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn,
                form.credit_status === s && styles.statusBtnActive,
                { borderColor: s === 'normal' ? '#27ae60' : s === 'warning' ? '#e67e22' : '#c0392b' }
              ]}
              onPress={() => set('credit_status', s)}
            >
              <Text style={[styles.statusBtnText,
                form.credit_status === s && { color: '#fff' }
              ]}>
                {s === 'normal' ? '✅ ปกติ' : s === 'warning' ? '⚠️ ระวัง' : '🚨 ค้างชำระ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>มีบริการจัดส่ง / Delivery Service</Text>
            <Text style={styles.switchSub}>เปิด = จัดส่งให้ถึงที่</Text>
          </View>
          <Switch
            value={form.has_delivery}
            onValueChange={v => set('has_delivery', v)}
            trackColor={{ false: '#bdc3c7', true: '#27ae60' }}
            thumbColor={form.has_delivery ? '#fff' : '#fff'}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 หมายเหตุ / Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.notes}
          onChangeText={v => set('notes', v)}
          placeholder="หมายเหตุเพิ่มเติม เช่น เงื่อนไขพิเศษ, ข้อตกลง"
          multiline numberOfLines={3} textAlignVertical="top"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>
              {isEdit ? '💾 บันทึกการแก้ไข' : '✅ เพิ่มลูกค้า'}
            </Text>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b',
                     padding: 16, gap: 12 },
  backBtn:         { padding: 4 },
  backText:        { color: '#fff', fontSize: 15 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  section:         { backgroundColor: '#fff', margin: 12, borderRadius: 12,
                     padding: 16, elevation: 2 },
  sectionTitle:    { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  flag:            { fontSize: 22, marginTop: 22 },
  inputWrap:       { flex: 1 },
  label:           { fontSize: 12, color: '#7f8c8d', marginBottom: 4 },
  input:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
                     padding: 10, fontSize: 15, backgroundColor: '#fafafa' },
  inputError:      { borderColor: '#e74c3c' },
  mb12:            { marginBottom: 12 },
  multiline:       { height: 80, marginBottom: 12 },
  pinNote:         { backgroundColor: '#fef9e7', borderRadius: 8, padding: 10,
                     marginBottom: 12, fontSize: 13, color: '#7f8c8d' },
  pinRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pinInput:        { flex: 1, letterSpacing: 6, textAlign: 'center',
                     fontSize: 20, fontWeight: 'bold' },
  eyeBtn:          { padding: 10 },
  eyeIcon:         { fontSize: 20 },
  errorText:       { color: '#e74c3c', fontSize: 12, marginTop: 2 },
  successText:     { color: '#27ae60', fontSize: 12, marginTop: 2 },
  creditStatusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statusBtn:       { flex: 1, borderWidth: 2, borderRadius: 8, padding: 8,
                     alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#2c3e50' },
  statusBtnText:   { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  switchRow:       { flexDirection: 'row', justifyContent: 'space-between',
                     alignItems: 'center', marginTop: 8 },
  switchSub:       { fontSize: 11, color: '#95a5a6' },
  saveBtn:         { backgroundColor: '#27ae60', margin: 16, borderRadius: 12,
                     padding: 16, alignItems: 'center', elevation: 3 },
  saveBtnDisabled: { backgroundColor: '#95a5a6' },
  saveBtnText:     { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});

export default AddCustomerScreen;