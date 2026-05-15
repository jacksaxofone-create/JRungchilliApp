import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, getProductName, Lang } from "../../core/i18n/translations";

export default function ProductListScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useFocusEffect(useCallback(() => {
    loadProducts();
  }, []));

  const loadProducts = () => {
    setLoading(true);
    try {
      setProducts(DB.getAllProducts());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      `🗑️ ${t('delete','th')}${lang !== 'th' ? ` / ${t('delete',lang)}` : ''}`,
      `"${item.name_th}"\nลบสินค้านี้?`,
      [
        { text: t('cancel','th'), style: 'cancel' },
        {
          text: t('delete','th'), style: 'destructive',
          onPress: () => {
            try {
              DB.deleteProduct(item.id);
              loadProducts();
            } catch (e: any) {
              Alert.alert('❌', String(e?.message || e));
            }
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
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>📦 {t('products','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('products', lang)}</Text>}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddProduct')}>
          <Text style={s.addBtnTxt}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search + Count ── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`🔍 ${t('search','th')}${lang !== 'th' ? ` / ${t('search',lang)}` : ''}...`}
          placeholderTextColor="#9ca3af"
        />
        <Text style={s.countTxt}>{filtered.length}/{products.length}</Text>
      </View>

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator color="#c0392b" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyTxt}>
                {t('no_products','th')}{lang !== 'th' ? `\n${t('no_products',lang)}` : ''}
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddProduct')}>
                <Text style={s.emptyBtnTxt}>➕ {t('add_product','th')}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const secondary = lang !== 'th' ? getProductName(item, lang) : '';
            const isLow     = item.stock_kg < (item.min_stock_kg || 10);
            return (
              <View style={[s.card, isLow && s.cardLow]}>
                <View style={s.cardInner}>

                  {/* ── รูปสินค้า ── */}
                  <View style={s.imgWrap}>
                    {item.image_uri ? (
                      <Image
                        source={{ uri: item.image_uri }}
                        style={s.productImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={s.imgPlaceholder}>
                        <Text style={s.imgPlaceholderTxt}>
                          {item.category === 'พริก' ? '🌶️' : '🥬'}
                        </Text>
                      </View>
                    )}
                    {isLow && (
                      <View style={s.lowBadge}>
                        <Text style={s.lowBadgeTxt}>⚠️</Text>
                      </View>
                    )}
                  </View>

                  {/* ── ข้อมูลสินค้า ── */}
                  <View style={s.infoBox}>
                    {/* ชื่อ TH + ภาษาที่เลือก */}
                    <Text style={s.nameTh} numberOfLines={1}>{item.name_th}</Text>
                    {!!secondary && (
                      <Text style={s.nameSub} numberOfLines={1}>{secondary}</Text>
                    )}

                    {/* badge หมวด + หน่วย */}
                    <View style={s.badgeRow}>
                      <View style={s.badge}>
                        <Text style={s.badgeTxt}>{item.category}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: '#e8f5e9' }]}>
                        <Text style={[s.badgeTxt, { color: '#27ae60' }]}>{item.unit}</Text>
                      </View>
                    </View>

                    {/* ราคา */}
                    <View style={s.priceRow}>
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>
                          🛒 {t('price_retail','th')}
                          {lang !== 'th' ? `\n${t('price_retail',lang)}` : ''}
                        </Text>
                        <Text style={s.priceVal}>฿{item.price_retail}</Text>
                      </View>
                      <View style={s.priceDivider} />
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>
                          📦 {t('price_wholesale','th')}
                          {lang !== 'th' ? `\n${t('price_wholesale',lang)}` : ''}
                        </Text>
                        <Text style={s.priceVal}>฿{item.price_wholesale}</Text>
                      </View>
                      <View style={s.priceDivider} />
                      <View style={s.priceItem}>
                        <Text style={s.priceLabel}>
                          ⚖️ {t('stock_qty','th')}
                        </Text>
                        <Text style={[s.priceVal, isLow && { color: '#e67e22' }]}>
                          {item.stock_kg} kg
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── ปุ่มลบ ── */}
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
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#c0392b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnTxt: { fontSize: 24 },
  searchBox: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, elevation: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },
  countTxt: { fontSize: 12, color: '#aaa', fontWeight: '600', minWidth: 40, textAlign: 'right' },
  listContent: { padding: 10, paddingBottom: 24 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden' },
  cardLow: { borderColor: '#f39c12', borderWidth: 1.5 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  // รูปสินค้า
  imgWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  productImg: { width: 72, height: 72 },
  imgPlaceholder: { width: 72, height: 72, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  imgPlaceholderTxt: { fontSize: 32 },
  lowBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 8, padding: 1 },
  lowBadgeTxt: { fontSize: 12 },
  // ข้อมูล
  infoBox: { flex: 1 },
  nameTh: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  nameSub: { fontSize: 11, color: '#888', marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' },
  badge: { backgroundColor: '#fef5f5', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, color: '#c0392b', fontWeight: '600' },
  priceRow: { flexDirection: 'row', marginTop: 6, backgroundColor: '#f9f9f9', borderRadius: 7, padding: 6 },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 9, color: '#888', textAlign: 'center', lineHeight: 13 },
  priceVal: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 2 },
  priceDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 3 },
  // ปุ่มลบ
  delBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center' },
  delBtnTxt: { fontSize: 17 },
});