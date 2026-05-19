import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

export default function ProductListScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const loadProducts = () => {
    setLoading(true);
    try { setProducts(DB.getAllProducts()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      `🗑️ ${t('delete', 'th')}${lang !== 'th' ? ` / ${t('delete', lang)}` : ''}`,
      `"${item.name_th}"\nลบสินค้านี้?`,
      [
        { text: t('cancel', 'th'), style: 'cancel' },
        {
          text: t('delete', 'th'), style: 'destructive',
          onPress: () => {
            try { DB.deleteProduct(item.id); loadProducts(); }
            catch (e: any) { Alert.alert('❌', String(e?.message || e)); }
          },
        },
      ]
    );
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name_th || '').toLowerCase().includes(q) ||
      (p.name_mm || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.name_cn || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back', 'th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>📦 {t('products', 'th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('products', lang)}</Text>}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddProduct')}>
          <Text style={s.addBtnTxt}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search + Count ─── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search} onChangeText={setSearch}
          placeholder={`🔍 ${t('search', 'th')}${lang !== 'th' ? ` / ${t('search', lang)}` : ''}...`}
          placeholderTextColor={CHILLI.textLight}
        />
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{filtered.length}/{products.length}</Text>
        </View>
      </View>

      {/* ─── List ─── */}
      {loading ? (
        <ActivityIndicator color={CHILLI.red} size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 52, textAlign: 'center' }}>📦</Text>
              <Text style={s.emptyTxt}>
                {t('no_products', 'th')}{lang !== 'th' ? `\n${t('no_products', lang)}` : ''}
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddProduct')}>
                <Text style={s.emptyBtnTxt}>➕ {t('add_product', 'th')}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            const isLow     = item.stock_kg < (item.min_stock_kg || 10);
            return (
              <View style={[s.card, isLow && s.cardLow]}>
                {/* Left accent */}
                <View style={[s.cardAccent, { backgroundColor: isLow ? CHILLI.orange : CHILLI.red }]} />

                <View style={s.cardInner}>
                  {/* รูปสินค้า */}
                  <View style={s.imgWrap}>
                    {item.image_uri ? (
                      <Image source={{ uri: item.image_uri }} style={s.productImg} resizeMode="cover" />
                    ) : (
                      <View style={s.imgPlaceholder}>
                        <Text style={s.imgPlaceholderTxt}>
                          {item.category === 'พริก' ? '🌶️' : item.category === 'ผัก' ? '🥬' : '📦'}
                        </Text>
                      </View>
                    )}
                    {isLow && (
                      <View style={s.lowBadge}>
                        <Text style={s.lowBadgeTxt}>⚠️</Text>
                      </View>
                    )}
                  </View>

                  {/* ข้อมูลสินค้า */}
                  <View style={s.infoBox}>
                    <Text style={s.nameTh} numberOfLines={1}>{item.name_th}</Text>
                    {!!secondary && <Text style={s.nameSub} numberOfLines={1}>{secondary}</Text>}

                    {/* Badges */}
                    <View style={s.badgeRow}>
                      <View style={s.categoryBadge}>
                        <Text style={s.categoryBadgeTxt}>{item.category}</Text>
                      </View>
                      <View style={s.unitBadge}>
                        <Text style={s.unitBadgeTxt}>{item.unit}</Text>
                      </View>
                      {!item.is_active && (
                        <View style={[s.categoryBadge, { backgroundColor: '#f5f5f5' }]}>
                          <Text style={[s.categoryBadgeTxt, { color: CHILLI.gray }]}>ปิดใช้งาน</Text>
                        </View>
                      )}
                    </View>

                    {/* ราคา */}
                    <View style={s.priceRow}>
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>
                          🛒 {t('price_retail', 'th')}{lang !== 'th' ? `\n${t('price_retail', lang)}` : ''}
                        </Text>
                        <Text style={s.priceVal}>฿{item.price_retail}</Text>
                      </View>
                      <View style={s.priceDivider} />
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>
                          📦 {t('price_wholesale', 'th')}{lang !== 'th' ? `\n${t('price_wholesale', lang)}` : ''}
                        </Text>
                        <Text style={[s.priceVal, { color: CHILLI.orange }]}>฿{item.price_wholesale}</Text>
                      </View>
                      <View style={s.priceDivider} />
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>⚖️ {t('stock_qty', 'th')}</Text>
                        <Text style={[s.priceVal, isLow && { color: CHILLI.orange }]}>
                          {item.stock_kg} kg
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ปุ่มลบ */}
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item)}>
                    <Text style={s.delBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
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
  headerTitle: { fontSize: 15, fontWeight: '800', color: CHILLI.white },
  headerSub: { fontSize: 11, color: CHILLI.textOnDarkSub, marginTop: 2 },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnTxt: { fontSize: 26 },
  searchBox: {
    backgroundColor: CHILLI.white, paddingHorizontal: 12, paddingVertical: 10,
    ...shadow(1), flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: {
    flex: 1, borderWidth: 1.5, borderColor: CHILLI.borderLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
    backgroundColor: CHILLI.cream, color: CHILLI.dark,
  },
  countBadge: {
    backgroundColor: CHILLI.cream, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  countTxt: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '700' },
  listContent: { padding: 10, paddingBottom: 24 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: CHILLI.textSecondary, textAlign: 'center', lineHeight: 24, marginTop: 12, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: CHILLI.red, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12, ...shadow(2),
  },
  emptyBtnTxt: { color: CHILLI.white, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: CHILLI.white, borderRadius: 14, marginBottom: 8,
    ...shadow(2), borderWidth: 1, borderColor: CHILLI.borderLight,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardLow: { borderColor: CHILLI.orange, borderWidth: 1.5 },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  // รูปสินค้า
  imgWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  productImg: { width: 72, height: 72 },
  imgPlaceholder: {
    width: 72, height: 72, backgroundColor: CHILLI.cream,
    alignItems: 'center', justifyContent: 'center', borderRadius: 10,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  imgPlaceholderTxt: { fontSize: 32 },
  lowBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: CHILLI.white, borderRadius: 8, padding: 1 },
  lowBadgeTxt: { fontSize: 12 },
  // ข้อมูล
  infoBox: { flex: 1 },
  nameTh: { fontSize: 14, fontWeight: '800', color: CHILLI.dark },
  nameSub: { fontSize: 11, color: CHILLI.textSecondary, marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' },
  categoryBadge: { backgroundColor: '#fff0ee', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  categoryBadgeTxt: { fontSize: 10, color: CHILLI.red, fontWeight: '700' },
  unitBadge: { backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  unitBadgeTxt: { fontSize: 10, color: CHILLI.orange, fontWeight: '700' },
  priceRow: {
    flexDirection: 'row', marginTop: 6, backgroundColor: CHILLI.cream,
    borderRadius: 8, padding: 6, borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 9, color: CHILLI.textSecondary, textAlign: 'center', lineHeight: 13 },
  priceVal: { fontSize: 12, fontWeight: '800', color: CHILLI.dark, marginTop: 2 },
  priceDivider: { width: 1, backgroundColor: CHILLI.borderLight, marginHorizontal: 3 },
  // ปุ่มลบ
  delBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center',
  },
  delBtnTxt: { fontSize: 17 },
});
