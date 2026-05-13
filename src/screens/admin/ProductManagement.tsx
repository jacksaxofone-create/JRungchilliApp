import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../../services/database';
import { useAppStore } from '../../store/appStore';

export const ProductManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { primaryLanguage } = useAppStore();
  const [products, setProducts]     = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadProducts = async () => {
    try {
      const list = await DatabaseService.getAllProducts();
      setProducts(list);
    } catch (e) {
      Alert.alert('❌', 'โหลดสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Refresh ทุกครั้งที่กลับมาหน้านี้ (หลังเพิ่ม/แก้ไขสินค้า)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProducts();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); loadProducts(); };

  const getName = (p: any) => {
    if (primaryLanguage === 'mm') return p.name_mm || p.name_th;
    if (primaryLanguage === 'en') return p.name_en || p.name_th;
    if (primaryLanguage === 'cn') return p.name_cn || p.name_th;
    return p.name_th;
  };

  const filtered = products.filter(p =>
    p.name_th?.includes(search) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_mm?.includes(search) ||
    p.name_cn?.includes(search)
  );

  const handleDelete = (product: any) => {
    Alert.alert(
      '🗑️ ลบสินค้า',
      `ต้องการลบ "${product.name_th}" ?\nDelete "${product.name_th}"?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: '🗑️ ลบ', style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.upsertProduct({ ...product, is_active: 0 });
              loadProducts();
              Alert.alert('✅', 'ลบสินค้าเรียบร้อย');
            } catch (e) {
              Alert.alert('❌', 'ลบไม่สำเร็จ');
            }
          }
        }
      ]
    );
  };

  const openDetail = (product: any) => {
    setSelected(product);
    setShowDetail(true);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_active && styles.cardInactive]}
      onPress={() => openDetail(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbEmpty}>
            <Text style={styles.thumbIcon}>🌶️</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.nameTh} numberOfLines={1}>{item.name_th}</Text>
          {!item.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>ปิดใช้งาน</Text>
            </View>
          )}
        </View>
        <Text style={styles.nameEn} numberOfLines={1}>
          {item.name_en || item.name_mm || '—'}
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagLabel}>ปลีก</Text>
            <Text style={styles.priceTagValue}>฿{item.price_retail}</Text>
          </View>
          <View style={[styles.priceTag, styles.priceTagWholesale]}>
            <Text style={styles.priceTagLabel}>ส่ง</Text>
            <Text style={[styles.priceTagValue, { color: '#2980b9' }]}>฿{item.price_wholesale}</Text>
          </View>
          <Text style={styles.stockText}>📦 {item.stock_kg} กก.</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddProduct', { product: item })}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal visible={showDetail} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>📋 รายละเอียดสินค้า</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          {selected?.image_uri ? (
            <Image source={{ uri: selected.image_uri }} style={styles.detailImage} resizeMode="cover" />
          ) : (
            <View style={styles.detailImageEmpty}>
              <Text style={styles.detailImageIcon}>🌶️</Text>
            </View>
          )}
          <View style={styles.detailBody}>
            {[
              { flag:'🇹🇭', val: selected?.name_th },
              { flag:'🇲🇲', val: selected?.name_mm || '—' },
              { flag:'🇬🇧', val: selected?.name_en || '—' },
              { flag:'🇨🇳', val: selected?.name_cn || '—' },
            ].map((row, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailFlag}>{row.flag}</Text>
                <Text style={styles.detailValue}>{row.val}</Text>
              </View>
            ))}
            <View style={styles.detailPriceRow}>
              <View style={styles.detailPriceBox}>
                <Text style={styles.detailPriceLabel}>💵 ราคาปลีก</Text>
                <Text style={styles.detailPriceValue}>฿{selected?.price_retail}</Text>
                <Text style={styles.detailPriceUnit}>บาท/กก.</Text>
              </View>
              <View style={[styles.detailPriceBox, { borderColor: '#2980b9' }]}>
                <Text style={styles.detailPriceLabel}>🏪 ราคาส่ง</Text>
                <Text style={[styles.detailPriceValue, { color: '#2980b9' }]}>
                  ฿{selected?.price_wholesale}
                </Text>
                <Text style={styles.detailPriceUnit}>บาท/กก.</Text>
              </View>
            </View>
            <View style={styles.detailStockRow}>
              <Text style={styles.detailStockLabel}>📦 สต็อกคงเหลือ</Text>
              <Text style={styles.detailStockValue}>{selected?.stock_kg} กก.</Text>
            </View>
          </View>
          <View style={styles.detailFooter}>
            <TouchableOpacity
              style={styles.detailEditBtn}
              onPress={() => {
                setShowDetail(false);
                navigation.navigate('AddProduct', { product: selected });
              }}
            >
              <Text style={styles.detailEditBtnText}>✏️ แก้ไขสินค้า</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 จัดการสินค้า / Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addBtnText}>➕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBox}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 ค้นหาสินค้า / Search..."
          clearButtonMode="while-editing"
        />
        <Text style={styles.countText}>ทั้งหมด {filtered.length} รายการ</Text>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>ไม่พบสินค้า</Text>
            <Text style={styles.emptyText2}>No products found</Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Text style={styles.addFirstBtnText}>➕ เพิ่มสินค้าแรก</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:        { marginTop: 12, color: '#7f8c8d', fontSize: 15 },
  header:             { flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#c0392b', padding: 16, gap: 8 },
  backBtn:            { padding: 4 },
  backText:           { color: '#fff', fontSize: 15 },
  headerTitle:        { flex: 1, color: '#fff', fontSize: 17, fontWeight: 'bold' },
  addBtn:             { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:         { fontSize: 18, color: '#fff' },
  searchContainer:    { backgroundColor: '#fff', padding: 12, elevation: 1 },
  searchBox:          { backgroundColor: '#f5f5f5', borderRadius: 10,
                        padding: 10, fontSize: 15, marginBottom: 6 },
  countText:          { fontSize: 12, color: '#7f8c8d', textAlign: 'right' },
  listContent:        { padding: 10 },
  card:               { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
                        marginBottom: 8, padding: 12, elevation: 2, alignItems: 'center' },
  cardInactive:       { opacity: 0.5 },
  cardLeft:           { marginRight: 10 },
  thumb:              { width: 60, height: 60, borderRadius: 10 },
  thumbEmpty:         { width: 60, height: 60, borderRadius: 10,
                        backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center' },
  thumbIcon:          { fontSize: 28 },
  cardBody:           { flex: 1 },
  nameRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameTh:             { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  inactiveBadge:      { backgroundColor: '#ecf0f1', borderRadius: 6,
                        paddingHorizontal: 6, paddingVertical: 2 },
  inactiveBadgeText:  { fontSize: 10, color: '#7f8c8d' },
  nameEn:             { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  priceRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  priceTag:           { backgroundColor: '#fef9e7', borderRadius: 6,
                        paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center' },
  priceTagWholesale:  { backgroundColor: '#ebf5fb' },
  priceTagLabel:      { fontSize: 9, color: '#7f8c8d' },
  priceTagValue:      { fontSize: 13, fontWeight: 'bold', color: '#e67e22' },
  stockText:          { fontSize: 11, color: '#95a5a6', marginLeft: 4 },
  cardActions:        { flexDirection: 'column', gap: 6, marginLeft: 8 },
  editBtn:            { backgroundColor: '#ebf5fb', borderRadius: 8,
                        padding: 8, alignItems: 'center' },
  editBtnText:        { fontSize: 18 },
  deleteBtn:          { backgroundColor: '#fdecea', borderRadius: 8,
                        padding: 8, alignItems: 'center' },
  deleteBtnText:      { fontSize: 18 },
  emptyBox:           { alignItems: 'center', padding: 48 },
  emptyIcon:          { fontSize: 48 },
  emptyText:          { fontSize: 16, color: '#7f8c8d', marginTop: 8 },
  emptyText2:         { fontSize: 14, color: '#bdc3c7', marginTop: 4 },
  addFirstBtn:        { backgroundColor: '#c0392b', borderRadius: 10,
                        paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  addFirstBtnText:    { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailModal:        { backgroundColor: '#fff', borderTopLeftRadius: 20,
                        borderTopRightRadius: 20 },
  detailHeader:       { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', padding: 16,
                        borderBottomWidth: 1, borderColor: '#eee' },
  detailTitle:        { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  closeBtn:           { fontSize: 20, color: '#7f8c8d', padding: 4 },
  detailImage:        { width: '100%', height: 180 },
  detailImageEmpty:   { height: 120, backgroundColor: '#fdecea',
                        justifyContent: 'center', alignItems: 'center' },
  detailImageIcon:    { fontSize: 56 },
  detailBody:         { padding: 16 },
  detailRow:          { flexDirection: 'row', alignItems: 'center',
                        gap: 10, marginBottom: 8 },
  detailFlag:         { fontSize: 20 },
  detailValue:        { fontSize: 15, color: '#2c3e50', flex: 1 },
  detailPriceRow:     { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 12 },
  detailPriceBox:     { flex: 1, borderWidth: 2, borderColor: '#e67e22',
                        borderRadius: 10, padding: 12, alignItems: 'center' },
  detailPriceLabel:   { fontSize: 12, color: '#7f8c8d' },
  detailPriceValue:   { fontSize: 24, fontWeight: 'bold', color: '#e67e22', marginTop: 4 },
  detailPriceUnit:    { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  detailStockRow:     { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', backgroundColor: '#f8f9fa',
                        borderRadius: 10, padding: 12 },
  detailStockLabel:   { fontSize: 14, color: '#2c3e50' },
  detailStockValue:   { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
  detailFooter:       { padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  detailEditBtn:      { backgroundColor: '#c0392b', borderRadius: 10,
                        padding: 14, alignItems: 'center' },
  detailEditBtnText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProductManagement;