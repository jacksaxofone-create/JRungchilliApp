import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert,
  ActivityIndicator, Modal, ScrollView, Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

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
    try { setCustomers(DB.getAllCustomers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = (item: any) => {
    Alert.alert(
      `🗑️ ${t('delete', 'th')}`,
      `"${item.shop_name}" ?`,
      [
        { text: t('cancel', 'th'), style: 'cancel' },
        {
          text: t('delete', 'th'), style: 'destructive',
          onPress: () => {
            try { DB.deleteCustomer(item.id); loadCustomers(); }
            catch (e: any) { Alert.alert('❌', String(e?.message || e)); }
          },
        },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('📋 ' + t('copied', 'th'), `"${text}"`);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: CHILLI.cream }}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>🏠 BACK</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            👥 {t('customers', 'th')}{lang !== 'th' ? ` / ${t('customers', lang)}` : ''}
          </Text>
          <Text style={s.headerCount}>{filtered.length} / {customers.length} ราย</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddCustomer')}>
          <Text style={s.addBtnTxt}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search ─── */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          value={search} onChangeText={setSearch}
          placeholder={`🔍 ${t('search', 'th')}...`}
          placeholderTextColor={CHILLI.textLight}
        />
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{filtered.length}</Text>
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
              <Text style={{ fontSize: 52, textAlign: 'center' }}>👥</Text>
              <Text style={s.emptyTxt}>ไม่มีข้อมูลลูกค้า</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddCustomer')}>
                <Text style={s.emptyBtnTxt}>➕ {t('add_customer', 'th')}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isWholesale = item.customer_type === 'wholesale';
            const creditPct   = item.credit_limit > 0
              ? Math.min(100, Math.round(((item.credit_used || 0) / item.credit_limit) * 100)) : 0;
            const isOverdue   = item.credit_limit > 0 && (item.credit_used || 0) >= item.credit_limit;
            const isHighUsage = creditPct >= 80 && !isOverdue;
            const showPass    = showPassId === item.id;
            const barColor    = isOverdue ? CHILLI.red : creditPct >= 70 ? CHILLI.orange : CHILLI.green;

            return (
              <TouchableOpacity
                style={[s.card, isOverdue && s.cardOverdue]}
                onPress={() => setSelected(item)}
                activeOpacity={0.87}>
                {/* Accent bar */}
                <View style={[s.cardAccent, { backgroundColor: isWholesale ? CHILLI.orange : CHILLI.red }]} />

                <View style={s.cardBody}>
                  {/* Row 1: ชื่อ + badge + ปุ่มลบ */}
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
                            <Text style={[s.badgeTxt, { color: CHILLI.red }]}>⚠️ เกินเครดิต</Text>
                          </View>
                        )}
                        {isHighUsage && (
                          <View style={[s.badge, { backgroundColor: '#fff8e6' }]}>
                            <Text style={[s.badgeTxt, { color: CHILLI.orange }]}>🟡 ใกล้เต็ม</Text>
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
                    {!!item.notes && <Text style={s.infoTxt} numberOfLines={1}>📝 {item.notes}</Text>}
                  </View>

                  {/* Row 3: รหัสผ่าน */}
                  <View style={s.passwordRow}>
                    <Text style={s.passwordLbl}>🔑</Text>
                    <Text style={s.passwordVal}>{showPass ? (item.password || '-') : '••••••••'}</Text>
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassId(showPass ? null : item.id)}>
                      <Text style={s.eyeBtnTxt}>{showPass ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                    {showPass && (
                      <TouchableOpacity style={s.copyBtn} onPress={() => copyToClipboard(item.password || '')}>
                        <Text style={s.copyBtnTxt}>📋</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Row 4: credit bar */}
                  {item.credit_limit > 0 && (
                    <View style={s.creditBox}>
                      <View style={s.creditRow}>
                        <Text style={s.creditLbl}>💳 เครดิต</Text>
                        <Text style={[s.creditVal, { color: barColor }]}>
                          ฿{(item.credit_used || 0).toLocaleString()} / ฿{item.credit_limit.toLocaleString()}
                          {'  '}{creditPct}%
                        </Text>
                      </View>
                      <View style={s.progressBg}>
                        <View style={[s.progressFill, { width: `${creditPct}%` as any, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ─── Customer Detail Modal ─── */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={md.overlay}>
          <View style={md.box}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={md.handle} />
              <View style={md.header}>
                <View style={md.headerIconBox}>
                  <Text style={{ fontSize: 22 }}>🏪</Text>
                </View>
                <Text style={md.title} numberOfLines={2}>{selected?.shop_name}</Text>
                <TouchableOpacity style={md.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={md.closeTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Type badge */}
              <View style={md.typeBadge}>
                <View style={[md.typePill, {
                  backgroundColor: selected?.customer_type === 'wholesale' ? '#fff3e0' : '#fff0ee'
                }]}>
                  <Text style={[md.typePillTxt, {
                    color: selected?.customer_type === 'wholesale' ? CHILLI.orange : CHILLI.red
                  }]}>
                    {selected?.customer_type === 'wholesale' ? '📦 ลูกค้าส่ง' : '🛒 ลูกค้าปลีก'}
                  </Text>
                </View>
              </View>

              <View style={md.infoRow}>
                <Text style={md.infoLbl}>📞 เบอร์โทร</Text>
                <Text style={md.infoVal}>{selected?.phone || '-'}</Text>
              </View>

              <View style={md.infoRow}>
                <Text style={md.infoLbl}>🔑 รหัสผ่าน</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={md.infoVal}>{selected?.password || '-'}</Text>
                  <TouchableOpacity style={md.copyActionBtn} onPress={() => copyToClipboard(selected?.password || '')}>
                    <Text style={md.copyActionBtnTxt}>📋 Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selected?.credit_limit > 0 && (
                <>
                  <View style={md.infoRow}>
                    <Text style={md.infoLbl}>💳 วงเงิน</Text>
                    <Text style={md.infoVal}>฿{selected?.credit_limit?.toLocaleString()}</Text>
                  </View>
                  <View style={md.infoRow}>
                    <Text style={md.infoLbl}>💳 ใช้ไป</Text>
                    <Text style={[md.infoVal, (selected?.credit_used >= selected?.credit_limit) && { color: CHILLI.red }]}>
                      ฿{(selected?.credit_used || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={md.infoRow}>
                    <Text style={md.infoLbl}>💳 คงเหลือ</Text>
                    <Text style={[md.infoVal, { color: CHILLI.green }]}>
                      ฿{Math.max(0, (selected?.credit_limit || 0) - (selected?.credit_used || 0)).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}

              {!!selected?.notes && (
                <View style={md.infoRow}>
                  <Text style={md.infoLbl}>📝 หมายเหตุ</Text>
                  <Text style={[md.infoVal, { flex: 1, textAlign: 'right' }]}>{selected?.notes}</Text>
                </View>
              )}

              <TouchableOpacity style={md.closeFullBtn} onPress={() => setSelected(null)}>
                <Text style={md.closeFullBtnTxt}>{t('cancel', 'th')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerCount: { fontSize: 10, color: CHILLI.textOnDarkSub, marginTop: 2 },
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
    backgroundColor: CHILLI.red, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countTxt: { fontSize: 13, color: CHILLI.white, fontWeight: '800' },
  listContent: { padding: 10, paddingBottom: 24 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: CHILLI.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: CHILLI.red, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12, ...shadow(2),
  },
  emptyBtnTxt: { color: CHILLI.white, fontWeight: '700', fontSize: 14 },
  // Card
  card: {
    backgroundColor: CHILLI.white, borderRadius: 14, marginBottom: 8,
    flexDirection: 'row', overflow: 'hidden', ...shadow(2),
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  cardOverdue: { borderColor: CHILLI.red, borderWidth: 1.5 },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', marginBottom: 6 },
  nameBox: { flex: 1, marginRight: 6 },
  shopName: { fontSize: 16, fontWeight: '800', color: CHILLI.dark },
  badgeRow: { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRetail: { backgroundColor: '#fff0ee' },
  badgeWhole: { backgroundColor: '#fff3e0' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  badgeTxtRetail: { color: CHILLI.red },
  badgeTxtWhole: { color: CHILLI.orange },
  delBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center',
  },
  delBtnTxt: { fontSize: 18 },
  infoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 5 },
  infoTxt: { fontSize: 13, color: CHILLI.textSecondary },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
    backgroundColor: CHILLI.cream, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  passwordLbl: { fontSize: 14 },
  passwordVal: { flex: 1, fontSize: 14, fontWeight: '700', color: CHILLI.dark, letterSpacing: 1.5 },
  eyeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: CHILLI.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  eyeBtnTxt: { fontSize: 16 },
  copyBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center',
  },
  copyBtnTxt: { fontSize: 16 },
  creditBox: {
    backgroundColor: CHILLI.cream, borderRadius: 8, padding: 10, marginTop: 4,
    borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  creditLbl: { fontSize: 12, color: CHILLI.textSecondary, fontWeight: '600' },
  creditVal: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: CHILLI.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
});

const md = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: CHILLI.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: CHILLI.borderLight, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  headerIconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: CHILLI.cream,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  title: { fontSize: 17, fontWeight: '800', color: CHILLI.dark, flex: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: CHILLI.cream, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 15, color: CHILLI.textSecondary, fontWeight: '700' },
  typeBadge: { flexDirection: 'row', marginBottom: 12 },
  typePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  typePillTxt: { fontSize: 13, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5',
  },
  infoLbl: { fontSize: 13, color: CHILLI.textSecondary, fontWeight: '600' },
  infoVal: { fontSize: 14, color: CHILLI.dark, fontWeight: '700', textAlign: 'right' },
  copyActionBtn: {
    backgroundColor: CHILLI.red, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  copyActionBtnTxt: { color: CHILLI.white, fontWeight: '700', fontSize: 12 },
  closeFullBtn: {
    backgroundColor: CHILLI.cream, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: CHILLI.borderLight,
  },
  closeFullBtnTxt: { fontSize: 14, color: CHILLI.textSecondary, fontWeight: '600' },
});
