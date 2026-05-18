import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert,
  ActivityIndicator, Modal, ScrollView, Clipboard,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";

export default function CustomerListScreen({ navigation }: any) {
  const { lang } = useAppStore();
  const [customers, setCustomers]   = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<any>(null);
  const [showPassId, setShowPassId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadCustomers(); }, []));

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
      `🗑️ ${t('delete','th')}`,
      `"${item.shop_name}" ?`,
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

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('📋 ' + t('copied','th'), `"${text}"`);
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
          <Text style={s.headerTitle}>
            👥 {t('customers','th')}{lang !== 'th' ? ` / ${t('customers',lang)}` : ''}
          </Text>
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
          placeholder={`🔍 ${t('search','th')}...`}
          placeholderTextColor="#9ca3af"
        />
        <Text style={s.countTxt}>{filtered.length} / {customers.length}</Text>
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
              <Text style={s.emptyTxt}>ไม่มีข้อมูลลูกค้า</Text>
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
            const isHighUsage = creditPct >= 80 && !isOverdue;
            const showPass    = showPassId === item.id;

            return (
              <TouchableOpacity
                style={[s.card, isOverdue && s.cardOverdue]}
                onPress={() => setSelected(item)}
                activeOpacity={0.85}
              >
                {/* Row 1: ชื่อร้าน + badge + ปุ่มลบ */}
                <View style={s.cardTop}>
                  <View style={s.nameBox}>
                    <Text style={s.shopName} numberOfLines={1}>{item.shop_name}</Text>
                    <View style={s.badgeRow}>
                      <View style={[s.badge, isWholesale ? s.badgeWhole : s.badgeRetail]}>
                        <Text style={[s.badgeTxt, isWholesale ? s.badgeTxtWhole : s.badgeTxtRetail]}>
                          {isWholesale ? '📦 ส่ง' : '🛒 ปลีก'}
                        </Text>
                      </View>
                      {isOverdue && (
                        <View style={[s.badge, { backgroundColor: '#fef2f2' }]}>
                          <Text style={[s.badgeTxt, { color: '#e74c3c' }]}>⚠️ เกินเครดิต</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item)}>
                    <Text style={s.delBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2: เบอร์โทร */}
                <View style={s.infoRow}>
                  <Text style={s.infoTxt}>📞 {item.phone || '-'}</Text>
                  {!!item.notes && (
                    <Text style={s.infoTxt} numberOfLines={1}>📝 {item.notes}</Text>
                  )}
                </View>

                {/* Row 3: รหัสผ่าน (toggle แสดง/ซ่อน) */}
                <View style={s.passwordRow}>
                  <Text style={s.passwordLbl}>🔑 รหัส: </Text>
                  <Text style={s.passwordVal}>
                    {showPass ? (item.password || '-') : '••••••••'}
                  </Text>
                  <TouchableOpacity
                    style={s.eyeBtn}
                    onPress={() => setShowPassId(showPass ? null : item.id)}
                  >
                    <Text style={s.eyeBtnTxt}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                  {showPass && (
                    <TouchableOpacity
                      style={s.copyBtn}
                      onPress={() => copyToClipboard(item.password || '')}
                    >
                      <Text style={s.copyBtnTxt}>📋</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Row 4: เครดิต + progress bar */}
                {item.credit_limit > 0 && (
                  <View style={s.creditBox}>
                    <View style={s.creditRow}>
                      <Text style={s.creditLbl}>
                        💳 {t('credit','th')}
                      </Text>
                      <Text style={[
                        s.creditVal,
                        isOverdue && { color: '#e74c3c' },
                        isHighUsage && { color: '#f39c12' },
                      ]}>
                        ฿{(item.credit_used || 0).toLocaleString()} / ฿{item.credit_limit.toLocaleString()}
                        {'  '}{creditPct}%
                      </Text>
                    </View>
                    <View style={s.progressBg}>
                      <View style={[
                        s.progressFill,
                        { width: `${creditPct}%` as any },
                        isOverdue
                          ? { backgroundColor: '#e74c3c' }
                          : creditPct >= 70
                            ? { backgroundColor: '#f39c12' }
                            : { backgroundColor: '#27ae60' },
                      ]} />
                    </View>
                  </View>
                )}

              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ─── Customer Detail Modal ─── */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={m.overlay}>
          <View style={m.box}>
            <ScrollView showsVerticalScrollIndicator={false}>

              <View style={m.header}>
                <Text style={m.title}>
                  🏪 {selected?.shop_name}
                </Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={m.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={m.infoRow}>
                <Text style={m.infoLbl}>📞 เบอร์โทร</Text>
                <Text style={m.infoVal}>{selected?.phone || '-'}</Text>
              </View>
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>👤 ประเภท</Text>
                <Text style={m.infoVal}>
                  {selected?.customer_type === 'wholesale' ? '📦 ส่ง' : '🛒 ปลีก'}
                </Text>
              </View>
              <View style={m.infoRow}>
                <Text style={m.infoLbl}>🔑 รหัสผ่าน</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={m.infoVal}>{selected?.password || '-'}</Text>
                  <TouchableOpacity
                    style={[m.actionSmallBtn, { backgroundColor: '#2980b9' }]}
                    onPress={() => copyToClipboard(selected?.password || '')}
                  >
                    <Text style={m.actionSmallBtnTxt}>📋 Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selected?.credit_limit > 0 && (
                <>
                  <View style={m.infoRow}>
                    <Text style={m.infoLbl}>💳 วงเงิน</Text>
                    <Text style={m.infoVal}>฿{selected?.credit_limit?.toLocaleString()}</Text>
                  </View>
                  <View style={m.infoRow}>
                    <Text style={m.infoLbl}>💳 ใช้ไป</Text>
                    <Text style={[m.infoVal, (selected?.credit_used >= selected?.credit_limit) && { color: '#e74c3c' }]}>
                      ฿{(selected?.credit_used || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={m.infoRow}>
                    <Text style={m.infoLbl}>💳 คงเหลือ</Text>
                    <Text style={[m.infoVal, { color: '#27ae60' }]}>
                      ฿{Math.max(0, (selected?.credit_limit || 0) - (selected?.credit_used || 0)).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}

              {!!selected?.notes && (
                <View style={m.infoRow}>
                  <Text style={m.infoLbl}>📝 หมายเหตุ</Text>
                  <Text style={m.infoVal}>{selected?.notes}</Text>
                </View>
              )}

              <TouchableOpacity style={m.closeFullBtn} onPress={() => setSelected(null)}>
                <Text style={m.closeFullBtnTxt}>{t('cancel','th')}</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f0f0f0' },
  header:       { backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn:      { width: 60, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  addBtn:       { width: 60, alignItems: 'flex-end' },
  addBtnTxt:    { fontSize: 24 },
  searchBox:    { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, elevation: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput:  { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },
  countTxt:     { fontSize: 12, color: '#aaa', fontWeight: '600' },
  listContent:  { padding: 10, paddingBottom: 24 },
  emptyBox:     { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTxt:     { fontSize: 15, color: '#aaa', textAlign: 'center', marginBottom: 16 },
  emptyBtn:     { backgroundColor: '#27ae60', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt:  { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardOverdue:  { borderColor: '#e74c3c', borderWidth: 1.5 },
  cardTop:      { flexDirection: 'row', marginBottom: 8 },
  nameBox:      { flex: 1, marginRight: 8 },
  shopName:     { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badgeRow:     { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  badge:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRetail:  { backgroundColor: '#fef5f5' },
  badgeWhole:   { backgroundColor: '#f0faf5' },
  badgeTxt:     { fontSize: 11, fontWeight: '600' },
  badgeTxtRetail:  { color: '#c0392b' },
  badgeTxtWhole:   { color: '#27ae60' },
  delBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fef5f5', alignItems: 'center', justifyContent: 'center' },
  delBtnTxt:    { fontSize: 18 },

  infoRow:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  infoTxt:      { fontSize: 13, color: '#666' },

  passwordRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, backgroundColor: '#f8f8f8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  passwordLbl:  { fontSize: 12, color: '#888' },
  passwordVal:  { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#333', letterSpacing: 1.5 },
  eyeBtn:       { width: 32, height: 32, borderRadius: 8, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  eyeBtnTxt:    { fontSize: 16 },
  copyBtn:      { width: 32, height: 32, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  copyBtnTxt:   { fontSize: 16 },

  creditBox:    { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, marginTop: 4 },
  creditRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  creditLbl:    { fontSize: 12, color: '#555', fontWeight: '600' },
  creditVal:    { fontSize: 12, fontWeight: 'bold', color: '#333' },
  progressBg:   { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
});

const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:        { fontSize: 17, fontWeight: 'bold', color: '#333', flex: 1 },
  closeBtn:     { fontSize: 20, color: '#aaa', fontWeight: 'bold', padding: 4 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  infoLbl:      { fontSize: 13, color: '#888', fontWeight: '600' },
  infoVal:      { fontSize: 14, color: '#333', fontWeight: 'bold', textAlign: 'right', marginLeft: 8 },
  actionSmallBtn:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionSmallBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  closeFullBtn:     { backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  closeFullBtnTxt:  { fontSize: 14, color: '#555', fontWeight: '600' },
});
