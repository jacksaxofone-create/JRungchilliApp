import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator, Platform
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { DatabaseService } from '../../services/database';
import { useAppStore } from '../../store/appStore';

const EMPTY_PRODUCT = {
  id: '',
  name_th: '', name_mm: '', name_en: '', name_cn: '',
  price_retail: '', price_wholesale: '',
  stock_kg: '0', unit: 'kg',
  image_uri: '', is_active: 1,
};

export const AddProductScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const editProduct = route?.params?.product || null;
  const isEdit = !!editProduct;

  const [form, setForm] = useState(
    isEdit
      ? { ...editProduct,
          price_retail:    String(editProduct.price_retail    ?? ''),
          price_wholesale: String(editProduct.price_wholesale ?? ''),
          stock_kg:        String(editProduct.stock_kg        ?? '0'),
        }
      : { ...EMPTY_PRODUCT }
  );
  const [saving, setSaving]   = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async () => {
    setImgLoading(true);
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, maxWidth: 800, maxHeight: 800 });
      if (result.assets && result.assets[0]?.uri) {
        set('image_uri', result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกรูปได้');
    } finally {
      setImgLoading(false);
    }
  };

  const validate = () => {
    if (!form.name_th.trim()) { Alert.alert('⚠️ กรุณากรอกชื่อสินค้า (ภาษาไทย)'); return false; }
    if (!form.price_retail || isNaN(Number(form.price_retail))) {
      Alert.alert('⚠️ กรุณากรอกราคาปลีกให้ถูกต้อง'); return false;
    }
    if (!form.price_wholesale || isNaN(Number(form.price_wholesale))) {
      Alert.alert('⚠️ กรุณากรอกราคาส่งให้ถูกต้อง'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const id = isEdit ? form.id : `p${Date.now()}`;
      await DatabaseService.upsertProduct({
        id,
        name_th:         form.name_th.trim(),
        name_mm:         form.name_mm.trim(),
        name_en:         form.name_en.trim(),
        name_cn:         form.name_cn.trim(),
        price_retail:    Number(form.price_retail),
        price_wholesale: Number(form.price_wholesale),
        stock_kg:        Number(form.stock_kg) || 0,
        unit:            form.unit || 'kg',
        image_uri:       form.image_uri || '',
        is_active:       1,
      });
      Alert.alert('✅ สำเร็จ', isEdit ? 'แก้ไขสินค้าเรียบร้อย' : 'เพิ่มสินค้าเรียบร้อย', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
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
          {isEdit ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}
        </Text>
      </View>

      {/* Product Image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🖼️ รูปสินค้า / Product Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imgLoading ? (
            <ActivityIndicator color="#c0392b" size="large" />
          ) : form.image_uri ? (
            <Image source={{ uri: form.image_uri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>แตะเพื่อเลือกรูป</Text>
              <Text style={styles.imagePlaceholderSub}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>
        {form.image_uri ? (
          <TouchableOpacity onPress={() => set('image_uri', '')} style={styles.removeImgBtn}>
            <Text style={styles.removeImgText}>🗑️ ลบรูป / Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Product Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 ชื่อสินค้า / Product Names</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputFlag}>🇹🇭</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>ชื่อภาษาไทย *</Text>
            <TextInput style={styles.input} value={form.name_th}
              onChangeText={v => set('name_th', v)} placeholder="เช่น พริกแห้งเบอร์ 3" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputFlag}>🇲🇲</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>ภาษาพม่า (Myanmar)</Text>
            <TextInput style={styles.input} value={form.name_mm}
              onChangeText={v => set('name_mm', v)} placeholder="Myanmar name" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputFlag}>🇬🇧</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>ภาษาอังกฤษ (English)</Text>
            <TextInput style={styles.input} value={form.name_en}
              onChangeText={v => set('name_en', v)} placeholder="English name" />
          </View>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputFlag}>🇨🇳</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>ภาษาจีน (Chinese)</Text>
            <TextInput style={styles.input} value={form.name_cn}
              onChangeText={v => set('name_cn', v)} placeholder="中文名称" />
          </View>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 ราคา / Pricing</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>💵 ราคาปลีก (บาท/กก.) *</Text>
            <Text style={styles.priceSub}>Retail Price (THB/kg)</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={form.price_retail}
              onChangeText={v => set('price_retail', v)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>🏪 ราคาส่ง (บาท/กก.) *</Text>
            <Text style={styles.priceSub}>Wholesale Price (THB/kg)</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={form.price_wholesale}
              onChangeText={v => set('price_wholesale', v)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>
        {form.price_retail && form.price_wholesale ? (
          <View style={styles.pricePreview}>
            <Text style={styles.pricePreviewText}>
              ส่วนต่าง: ฿{(Number(form.price_retail) - Number(form.price_wholesale)).toFixed(2)} / กก.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Stock */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 สต็อก / Stock</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputFlag}>⚖️</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>จำนวนสต็อก (กก.) / Stock (kg)</Text>
            <TextInput
              style={styles.input}
              value={form.stock_kg}
              onChangeText={v => set('stock_kg', v)}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>
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
              {isEdit ? '💾 บันทึกการแก้ไข' : '✅ เพิ่มสินค้า'}
            </Text>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:               { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c0392b',
                          padding: 16, gap: 12 },
  backBtn:              { padding: 4 },
  backText:             { color: '#fff', fontSize: 15 },
  headerTitle:          { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  section:              { backgroundColor: '#fff', margin: 12, borderRadius: 12,
                          padding: 16, elevation: 2 },
  sectionTitle:         { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  imagePicker:          { borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed',
                          borderRadius: 12, height: 180, justifyContent: 'center',
                          alignItems: 'center', overflow: 'hidden' },
  productImage:         { width: '100%', height: '100%' },
  imagePlaceholder:     { alignItems: 'center' },
  imagePlaceholderIcon: { fontSize: 40 },
  imagePlaceholderText: { fontSize: 15, color: '#7f8c8d', marginTop: 8 },
  imagePlaceholderSub:  { fontSize: 12, color: '#bdc3c7', marginTop: 4 },
  removeImgBtn:         { marginTop: 8, alignSelf: 'center', padding: 8 },
  removeImgText:        { color: '#e74c3c', fontSize: 13 },
  inputRow:             { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  inputFlag:            { fontSize: 22, marginTop: 22 },
  inputWrap:            { flex: 1 },
  inputLabel:           { fontSize: 12, color: '#7f8c8d', marginBottom: 4 },
  input:                { borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
                          padding: 10, fontSize: 15, backgroundColor: '#fafafa' },
  priceRow:             { flexDirection: 'row', gap: 10 },
  priceBox:             { flex: 1 },
  priceLabel:           { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  priceSub:             { fontSize: 11, color: '#7f8c8d', marginBottom: 4 },
  priceInput:           { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#c0392b' },
  pricePreview:         { marginTop: 10, backgroundColor: '#eafaf1', borderRadius: 8,
                          padding: 10, alignItems: 'center' },
  pricePreviewText:     { color: '#27ae60', fontWeight: 'bold', fontSize: 14 },
  saveBtn:              { backgroundColor: '#27ae60', margin: 16, borderRadius: 12,
                          padding: 16, alignItems: 'center', elevation: 3 },
  saveBtnDisabled:      { backgroundColor: '#95a5a6' },
  saveBtnText:          { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});

export default AddProductScreen;