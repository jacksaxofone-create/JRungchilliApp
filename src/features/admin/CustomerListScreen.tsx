import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t, Lang } from "../../core/i18n/translations";

export default function CustomerListScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useFocusEffect(useCallback(() => {
    loadCustomers();
  }, []));

  const loadCustomers = () => {
    setLoading(true);
    try {
      setCustomers(DB.getAllCustomers());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      `🗑️ ${t('delete','th')}${lang !== 'th' ? ` / ${t('delete',lang)}` : ''}`,
      `"${item.shop_name}"\n${t('delete','th')}?`,
      [
        { text: t('cancel','th'), style: 'cancel' },
        {
          text: t('delete','th'), style: 'destructive',
          onPress: () => {
            try {
              DB.deleteCustomer(item.id);
              loadCustomers();
            } catch (e: any) {
              Alert.alert('❌', String(e?.message || e));
            }
          },
        },
      ]
    );
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.shop_name || '').toLowerCase().includes(q) ||
      (c.phone     || '').toLowerCase().includes(q) ||
      (c.notes     || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#27ae60" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>👥 {t('customers','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('customers', lang)}</Text>}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddCustomer')}>
          <Text style={s.addBtnTxt}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`🔍 ${t('search','th')}${lang !== 'th' ? ` / ${t('search',lang)}` : ''}...`}
          placeholderTextColor="#9ca3af"
        />
        <Text style={s.countTxt}>
          {filtered.length} / {customers.length} ราย
        </Text>
      </View>

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator color="#27ae60" size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTxt}>
                {t('customers','th')}{lang !== 'th' ? `\n${t('customers',lang)}` : ''}{'\n'}ไม่มีข้อมูล
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddCustomer')}>
                <Text style={s.emptyBtnTxt}>➕ {t('add_customer','th')}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isWholesale = item.customer_type === 'wholesale';
            const creditPct   = item.credit_limit > 0
              ? Math.min(100, Math.round((item.credit_used / item.credit_limit) * 100))
              : 0;
            const isOverdue   = item.credit_limit > 0 && item.credit_used >= item.credit_limit;

            return (
              <View style={[s.card, isOverdue && s.cardOverdue]}>

                {/* ── Row 1: ชื่อร้าน + badge + ปุ่มลบ ── */}
                <View style={s.cardTop}>
                  <View style={s.nameBox}>
                    {/* ชื่อร้าน (ไทยเสมอ) */}
                    <Text style={s.shopName} numberOfLines={1}>{item.shop_name}</Text>

                    {/* badge ประเภท */}
                    <View style={s.badgeRow}>
                      <View style={[s.badge, isWholesale ? s.badgeWhole : s.badgeRetail]}>
                        <Text style={[s.badgeTxt, isWholesale ? s.badgeTxtWhole : s.badgeTxtRetail]}>
                          {isWholesale
                            ? `📦 ${t('price_wholesale','th')}${lang !== 'th' ? ` / ${t('price_wholesale',lang)}` : ''}`
                            : `🛒 ${t('price_retail','th')}${lang !== 'th' ? ` / ${t('price_retail',lang)}` : ''}`
                          }
                        </Text>
                      </View>
                      {item.is_active === 0 && (
                        <View style={[s.badge, { backgroundColor: '#fef2f2' }]}>
                          <Text style={[s.badgeTxt, { color: '#ef4444' }]}>inactive</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item)}>
                    <Text style={s.delBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Row 2: เบอร์โทร + หมายเหตุ ── */}
                <View style={s.infoRow}>
                  <Text style={s.infoTxt}>📞 {item.phone || '-'}</Text>
                  {!!item.notes && (
                    <Text style={s.infoTxt} numberOfLines={1}>📝 {item.notes}</Text>
                  )}
                </View>

                {/* ── Row 3: เครดิต ── */}
                {item.credit_limit > 0 && (
                  <View style={s.creditBox}>
                    <View style={s.creditRow}>
                      <Text style={s.creditLbl}>
                        💳 {t('credit','th')}{lang !== 'th' ? ` / ${t('credit',lang)}` : ''}
                      </Text>
                      <Text style={[s.creditVal, isOverdue && { color: '#e74c3c' }]}>
                        ฿{item.credit_used.toLocaleString()} / ฿{item.credit_limit.toLocaleString()}
                      </Text>
                    </View>
                    {/* Progress bar */}
                    <View style={s.progressBg}>
                      <View style={[
                        s.progressFill,
                        { width: `${creditPct}%` as any },
                        creditPct >= 90
                          ? { backgroundColor: '#e74c3c' }
                          : creditPct >= 70
                            ? { backgroundColor: '#f39c12' }
                            : { backgroundColor: '#27ae60' },
                      ]} />
                    </View>
                    {isOverdue && (
                      <Text style={s.overdueWarn}>
                        ⚠️ {t('overdue_credit','th')}{lang !== 'th' ? ` / ${t('overdue_credit',lang)}` : ''}
                      </Text>
                    )}
                  </View>
                )}

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
  header: { backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnTxt: { fontSize: 24 },
  searchBox: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, elevation: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },
  countTxt: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  listContent: { padding: 10, paddingBottom: 24 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#27ae60', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardOverdue: { borderColor: '#e74c3c', borderWidth: 1.5 },
  cardTop: { flexDirection: 'row', marginBottom: 8 },
  nameBox: { flex: 1, marginRight: 8 },
  shopName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRetail: { backgroundColor: '#fef5f5' },
  badgeWhole: { backgroundColor: '#f0faf5' },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
  badgeTxtRetail: { color: '#c0392b' },
  badgeTxtWhole: { color: '#27ae60' },
  delBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center' },
  delBtnTxt: { fontSize: 18 },
  infoRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 6 },
  infoTxt: { fontSize: 13, color: '#666' },
  creditBox: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, marginTop: 4 },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  creditLbl: { fontSize: 12, color: '#555', fontWeight: '600' },
  creditVal: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  progressBg: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  overdueWarn: { fontSize: 12, color: '#e74c3c', fontWeight: '600', marginTop: 6 },
});