import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator
} from 'react-native';
import { DatabaseService } from '../services/database';

export default function AddProductScreen({ navigation }: any) {
  const [nameTh, setNameTh] = useState('');
  const [nameMy, setNameMy] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nameTh.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อสินค้า (ภาษาไทย)');
      return;
    }
    if (!retailPrice || isNaN(Number(retailPrice))) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกราคาขายปลีกให้ถูกต้อง');
      return;
    }
    if (!wholesalePrice || isNaN(Number(wholesalePrice))) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกราคาขายส่งให้ถูกต้อง');
      return;
    }
    setSaving(true);
    try {
      await DatabaseService.addProduct({
        name_th: nameTh.trim(),
        name_my: nameMy.trim() || nameTh.trim(),
        name_en: nameEn.trim() || nameTh.trim(),
        name_zh: nameTh.trim(),
        retail_price: Number(retailPrice),
        wholesale_price: Number(wholesalePrice),
        unit: unit,
        stock_quantity: 0,
        is_active: 1,
        image_url: '',
      });
      Alert.alert('สำเร็จ', 'เพิ่มสินค้าเรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกสินค้าได้');
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
        <Text style={styles.title}>เพิ่มสินค้าใหม่</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ชื่อสินค้า (ภาษาไทย) *</Text>
        <TextInput
          style={styles.input}
          value={nameTh}
          onChangeText={setNameTh}
          placeholder="เช่น พริกสด"
        />

        <Text style={styles.label}>ชื่อสินค้า (ภาษาพม่า)</Text>
        <TextInput
          style={styles.input}
          value={nameMy}
          onChangeText={setNameMy}
          placeholder="Myanmar name"
        />

        <Text style={styles.label}>ชื่อสินค้า (ภาษาอังกฤษ)</Text>
        <TextInput
          style={styles.input}
          value={nameEn}
          onChangeText={setNameEn}
          placeholder="English name"
        />

        <Text style={styles.label}>ราคาขายปลีก (บาท/กก.) *</Text>
        <TextInput
          style={styles.input}
          value={retailPrice}
          onChangeText={setRetailPrice}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>ราคาขายส่ง (บาท/กก.) *</Text>
        <TextInput
          style={styles.input}
          value={wholesalePrice}
          onChangeText={setWholesalePrice}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>หน่วย</Text>
        <View style={styles.unitRow}>
          {['kg', 'g', 'piece', 'pack'].map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>💾 บันทึกสินค้า</Text>
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
    marginBottom: 20, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 16, backgroundColor: '#fafafa',
  },
  unitRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  unitBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  unitBtnActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  unitText: { fontSize: 14, color: '#555' },
  unitTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#c0392b', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 3,
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});