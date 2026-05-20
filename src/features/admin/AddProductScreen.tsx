import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

const CATEGORIES = ['พริก','เครื่องเทศ','ผัก','ผลไม้','อื่นๆ'];
const UNITS      = ['กก.','ก.','ลิตร','ชิ้น'];

export default function AddProductScreen() {
  const navigation = useNavigation<any>();
  const { lang, setProducts } = useAppStore();
  const [saving, setSaving]                 = useState(false);
  const [nameTh, setNameTh]                 = useState('');
  const [nameMm, setNameMm]                 = useState('');
  const [nameEn, setNameEn]                 = useState('');
  const [nameCn, setNameCn]                 = useState('');
  const [priceRetail, setPriceRetail]       = useState('');
  const [priceWholesale, setPriceWholesale] = useState('');
  const [unit, setUnit]                     = useState('กก.');
  const [stockKg, setStockKg]               = useState('0');
  const [minStock, setMinStock]             = useState('10');
  const [category, setCategory]             = useState('พริก');
  const [imageUri, setImageUri]             = useState('');

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key,'th')} / ${t(key, lang)}` : t(key,'th');

  const resetForm = () => {
    setNameTh(''); setNameMm(''); setNameEn(''); setNameCn('');
    setPriceRetail(''); setPriceWholesale('');
    setUnit('กก.'); setStockKg('0'); setMinStock('10');
    setCategory('พริก'); setImageUri('');
  };

  // ── เลือกรูปจาก Gallery ──
  const pickFromGallery = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, maxWidth: 800, maxHeight: 800 },
      (res) => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert('❌', res.errorMessage || 'เลือกรูปไม่สำเร็จ');
          return;
        }
        const uri = res.assets?.[0]?.uri || '';
        if (uri) setImageUri(uri);
      }
    );
  };

  // ── ถ่ายรูป ──
  const pickFromCamera = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.7, maxWidth: 800, maxHeight: 800, saveToPhotos: false },
      (res) => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert('❌', res.errorMessage || 'ถ่ายรูปไม่สำเร็จ');
          return;
        }
        const uri = res.assets?.[0]?.uri || '';
        if (uri) setImageUri(uri);
      }
    );
  };

  const handlePickImage = () => {
    Alert.alert(
      '📷 รูปสินค้า / Product Image',
      'เลือกจากไหน? / Choose source:',
      [
        { text: '📁 แกลเลอรี่ / Gallery', onPress: pickFromGallery },
        { text: '📷 ถ่ายรูป / Camera',    onPress: pickFromCamera  },
        { text: t('cancel','th'),          style: 'cancel'          },
      ]
    );
  };

  const handleSave = () => {
    if (!nameTh.trim()) {
      Alert.alert(t('warning','th'), `${t('product_name_th','th')} จำเป็นต้องกรอก`);
      return;
    }
    const retail    = parseFloat(priceRetail);
    const wholesale = parseFloat(priceWholesale);
    if (isNaN(retail) || retail <= 0) {
      Alert.alert(t('warning','th'), `${lbl('price_retail')} ไม่ถูกต้อง`);
      return;
    }
    if (isNaN(wholesale) || wholesale <= 0) {
      Alert.alert(t('warning','th'), `${lbl('price_wholesale')} ไม่ถูกต้อง`);
      return;
    }
    setSaving(true);
    try {
      const id  = 'P' + Date.now();
      const now = new Date().toISOString();
      console.log('[AddProduct] saving product:', nameTh.trim(), 'id:', id);
      DB.saveProduct({
        id,
        name_th:         nameTh.trim(),
        name_mm:         nameMm.trim(),
        name_en:         nameEn.trim(),
        name_cn:         nameCn.trim(),
        category,
        unit,
        price_retail:    retail,
        price_wholesale: wholesale,
        stock_kg:        parseFloat(stockKg) || 0,
        min_stock_kg:    parseFloat(minStock) || 10,
        image_uri:       imageUri,
        is_active:       1,
        updated_at:      now,
      });
      const updated = DB.getAllProducts();
      setProducts(updated);
      console.log('[AddProduct] save success, store updated with', updated.length, 'products');
      Alert.alert(
        '✅ ' + t('success','th'),
        `${t('saved','th')} — ${nameTh.trim()}`,
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
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>➕📦 {t('add_product','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('add_product', lang)}</Text>}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* ── รูปสินค้า ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📷 รูปสินค้า / Product Image</Text>
          <TouchableOpacity style={s.imageBox} onPress={handlePickImage} activeOpacity={0.8}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={s.productImage} resizeMode="cover" />
                <View style={s.imageOverlay}>
                  <Text style={s.imageOverlayTxt}>✏️ เปลี่ยนรูป</Text>
                </View>
              </>
            ) : (
              <View style={s.imagePlaceholder}>
                <Text style={s.imagePlaceholderIcon}>📷</Text>
                <Text style={s.imagePlaceholderTxt}>แตะเพื่อเพิ่มรูป</Text>
                <Text style={s.imagePlaceholderSub}>Tap to add image</Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUri ? (
            <TouchableOpacity style={s.removeImgBtn} onPress={() => setImageUri('')}>
              <Text style={s.removeImgTxt}>🗑️ ลบรูป / Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── ชื่อสินค้า ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏷️ ชื่อสินค้า / Product Name</Text>

          <Text style={s.lbl}>🇹🇭 {t('product_name_th','th')} *</Text>
          <TextInput
            style={s.input}
            value={nameTh}
            onChangeText={setNameTh}
            placeholder="ชื่อภาษาไทย (บังคับ)"
            placeholderTextColor="#bbb"
          />

          <Text style={s.lbl}>🇲🇲 {t('product_name_mm','th')}</Text>
          <TextInput
            style={s.input}
            value={nameMm}
            onChangeText={setNameMm}
            placeholder="မြန်မာဘာသာ (optional)"
            placeholderTextColor="#bbb"
          />

          <Text style={s.lbl}>🇬🇧 {t('product_name_en','th')}</Text>
          <TextInput
            style={s.input}
            value={nameEn}
            onChangeText={setNameEn}
            placeholder="English name (optional)"
            placeholderTextColor="#bbb"
          />

          <Text style={s.lbl}>🇨🇳 {t('product_name_cn','th')}</Text>
          <TextInput
            style={s.input}
            value={nameCn}
            onChangeText={setNameCn}
            placeholder="中文名称 (optional)"
            placeholderTextColor="#bbb"
          />
        </View>

        {/* ── ราคา ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💰 ราคา / Price</Text>
          <View style={s.row2}>
            <View style={s.half}>
              <Text style={s.lbl}>
                🛒 {t('price_retail','th')}{lang !== 'th' ? `\n${t('price_retail',lang)}` : ''}
              </Text>
              <TextInput
                style={s.input}
                value={priceRetail}
                onChangeText={setPriceRetail}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#bbb"
              />
            </View>
            <View style={s.half}>
              <Text style={s.lbl}>
                📦 {t('price_wholesale','th')}{lang !== 'th' ? `\n${t('price_wholesale',lang)}` : ''}
              </Text>
              <TextInput
                style={[s.input, s.inputWholesale]}
                value={priceWholesale}
                onChangeText={setPriceWholesale}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>
        </View>

        {/* ── สต็อก ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            📊 {t('stock_qty','th')}{lang !== 'th' ? ` / ${t('stock_qty',lang)}` : ''}
          </Text>
          <View style={s.row2}>
            <View style={s.half}>
              <Text style={s.lbl}>สต็อกปัจจุบัน / Current</Text>
              <TextInput
                style={s.input}
                value={stockKg}
                onChangeText={setStockKg}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#bbb"
              />
            </View>
            <View style={s.half}>
              <Text style={s.lbl}>ขั้นต่ำ / Min Stock</Text>
              <TextInput
                style={s.input}
                value={minStock}
                onChangeText={setMinStock}
                keyboardType="decimal-pad"
                placeholder="10"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>
        </View>

        {/* ── หน่วย ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📏 หน่วย / Unit</Text>
          <View style={s.chipRow}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[s.chip, unit === u && s.chipOn]}
                onPress={() => setUnit(u)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipTxt, unit === u && s.chipTxtOn]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── หมวดหมู่ ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🗂️ หมวดหมู่ / Category</Text>
          <View style={s.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.chip, category === c && s.chipOn]}
                onPress={() => setCategory(c)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipTxt, category === c && s.chipTxtOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── ปุ่มบันทึก ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={s.saveBtnTxt}>💾 {t('save','th')}</Text>
                  {lang !== 'th' && <Text style={s.saveBtnSub}>{t('save', lang)}</Text>}
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={s.cancelBtnTxt}>
              {t('cancel','th')}{lang !== 'th' ? ` / ${t('cancel',lang)}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: CHILLI.cream },

  // ── Header ──
  header: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadow(4),
  },
  backBtn:      { width: 60, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // ── Body ──
  body: { flex: 1 },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    margin: 10,
    marginBottom: 0,
    ...shadow(2),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CHILLI.dark,
    marginBottom: 12,
  },

  // ── Label + Input ──
  lbl: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 8,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e8d5c4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: CHILLI.dark,
    backgroundColor: CHILLI.cream,
  },
  // wholesale price input มี accent สี orange ด้านซ้าย
  inputWholesale: {
    borderLeftWidth: 3,
    borderLeftColor: CHILLI.orange,
  },

  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },

  // ── Chips ──
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#f9f6f3',
  },
  chipOn: {
    borderColor: CHILLI.red,
    backgroundColor: '#fff0ee',
  },
  chipTxt:   { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTxtOn: { color: CHILLI.red, fontWeight: 'bold' },

  // ── Image ──
  imageBox: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e8d5c4',
    borderStyle: 'dashed',
  },
  productImage:       { width: '100%', height: '100%' },
  imageOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, alignItems: 'center' },
  imageOverlayTxt:    { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  imagePlaceholder:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CHILLI.cream },
  imagePlaceholderIcon: { fontSize: 44, marginBottom: 8 },
  imagePlaceholderTxt:  { fontSize: 14, color: '#888', fontWeight: '600' },
  imagePlaceholderSub:  { fontSize: 12, color: '#bbb', marginTop: 3 },
  removeImgBtn:    { marginTop: 8, alignItems: 'center', paddingVertical: 6 },
  removeImgTxt:    { fontSize: 13, color: CHILLI.red, fontWeight: '600' },

  // ── Footer Buttons ──
  footer:  { margin: 10, marginBottom: 0, gap: 8 },
  saveBtn: {
    backgroundColor: CHILLI.red,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    ...shadow(3),
  },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  saveBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  cancelBtn:  {
    backgroundColor: '#f0ebe6',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnTxt: { color: '#666', fontWeight: '600', fontSize: 14 },
});
