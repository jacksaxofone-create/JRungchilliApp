import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Switch,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DatabaseService } from '../../services/database';
import { tSingle } from '../../i18n/translations';

const EMPTY_CUSTOMER = {
  shop_name: '', shop_name_mm: '', shop_name_en: '', shop_name_cn: '',
  owner_name: '', phone: '', pin: '', customer_type: 'wholesale',
  credit_limit: 0, credit_used: 0, credit_status: 'normal',
  address: '', delivery: true, is_active: true,
};

export const CustomerManagement: React.FC = () => {
  const { primaryLanguage } = useAppStore();
  const t = (key: any) => tSingle(key, primaryLanguage);

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>({ ...EMPTY_CUSTOMER });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    const data = await DatabaseService.getAllCustomers();
    setCustomers(data);
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = customers.filter(c =>
    c.shop_name?.includes(search) ||
    c.owner_name?.includes(search) ||
    c.phone?.includes(search) ||
    c.shop_name_en?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditCustomer({ ...EMPTY_CUSTOMER });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (customer: any) => {
    setEditCustomer({ ...customer, delivery: customer.delivery === 1 || customer.delivery === true });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editCustomer.shop_name) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่ชื่อร้านค้า');
      return;
    }
    if (!editCustomer.pin || editCustomer.pin.length < 4) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีอย่างน้อย 4 ตัว');
      return;
    }
    if (!editCustomer.phone) {
      Alert.alert('แจ้งเตือน', 'กรุณาใส่เบอร์โทรศัพท์');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const customerToSave = {
        id: editCustomer.id ?? `c_${Date.now()}`,
        shop_name: editCustomer.shop_name,
        shop_name_mm: editCustomer.shop_name_mm ?? '',
        shop_name_en: editCustomer.shop_name_en ?? '',
        shop_name_cn: editCustomer.shop_name_cn ?? '',
        owner_name: editCustomer.owner_name ?? '',
        phone: editCustomer.phone,
        pin: editCustomer.pin,
        customer_type: editCustomer.customer_type ?? 'wholesale',
        credit_limit: Number(editCustomer.credit_limit) || 0,
        credit_used: Number(editCustomer.credit_used) || 0,
        credit_status: editCustomer.credit_status ?? 'normal',
        address: editCustomer.address ?? '',
        delivery: editCustomer.delivery ?? true,
        is_active: true,
        created_at: editCustomer.created_at ?? now,
      };
      await DatabaseService.upsertCustomer(customerToSave);
      await loadCustomers();
      setShowModal(false);
      Alert.alert('✅ สำเร็จ', isEditing ? 'แก้ไขข้อมูลลูกค้าแล้ว' : 'เพิ่มลูกค้าใหม่แล้ว');
    } catch (e) {
      Alert.alert('❌ ผิดพลาด', 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const getCreditStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return { bg: '#dcfce7', color: '#14532d' };
      case 'warning': return { bg: '#fef3c7', color: '#92400e' };
      case 'overdue': return { bg: '#fee2e2', color: '#991b1b' };
      case 'blocked': return { bg: '#f3f4f6', color: '#374151' };
      default: return { bg: '#dcfce7', color: '#14532d' };
    }
  };

  const renderCustomer = ({ item }: { item: any }) => {
    const creditColor = getCreditStatusColor(item.credit_status);
    return (
      <View style={styles.customerCard}>
        <View style={styles.customerLeft}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{item.shop_name?.charAt(0) ?? '?'}</Text>
          </View>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.shopName}>{item.shop_name}</Text>
          {item.shop_name_en ? <Text style={styles.shopNameSub}>{item.shop_name_en}</Text> : null}
          <Text style={styles.ownerText}>👤 {item.owner_name}</Text>
          <Text style={styles.phoneText}>📞 {item.phone}</Text>
          <View style={styles.badgeRow}>
            {item.delivery ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🚚 จัดส่ง</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.badgeText, { color: '#92400e' }]}>🏪 รับเอง</Text>
              </View>
            )}
            {item.credit_limit > 0 && (
              <View style={[styles.badge, { backgroundColor: creditColor.bg }]}>
                <Text style={[styles.badgeText, { color: creditColor.color }]}>
                  💳 ฿{Number(item.credit_limit).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>👥 จัดการลูกค้า</Text>
          <Text style={styles.headerSub}>Customer Management | {customers.length} ร้านค้า</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 ค้นหาร้านค้า..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>ไม่พบข้อมูลลูกค้า</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isEditing ? '✏️ แก้ไขข้อมูลลูกค้า' : '➕ เพิ่มลูกค้าใหม่'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.sectionHeader}>🏪 ข้อมูลร้านค้า</Text>

              <Text style={styles.fieldLabel}>ชื่อร้านค้า (ไทย) *</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.shop_name}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, shop_name: v }))}
                placeholder="เช่น ร้านแม่สอดการค้า"
              />

              <Text style={styles.fieldLabel}>ชื่อร้านค้า (พม่า) 🇲🇲</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.shop_name_mm}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, shop_name_mm: v }))}
                placeholder="Myanmar name"
              />

              <Text style={styles.fieldLabel}>ชื่อร้านค้า (อังกฤษ) 🇬🇧</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.shop_name_en}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, shop_name_en: v }))}
                placeholder="English name"
              />

              <Text style={styles.fieldLabel}>ชื่อร้านค้า (จีน) 🇨🇳</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.shop_name_cn}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, shop_name_cn: v }))}
                placeholder="中文名称"
              />

              <Text style={styles.sectionHeader}>👤 ข้อมูลเจ้าของร้าน</Text>

              <Text style={styles.fieldLabel}>ชื่อเจ้าของร้าน</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.owner_name}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, owner_name: v }))}
                placeholder="เช่น สมชาย ใจดี"
              />

              <Text style={styles.fieldLabel}>เบอร์โทรศัพท์ *</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.phone}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, phone: v }))}
                placeholder="0891234567"
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>ที่อยู่</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.address}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, address: v }))}
                placeholder="เช่น แม่สอด ตาก"
              />

              <Text style={styles.sectionHeader}>🔐 รหัสผ่านเข้าระบบ</Text>

              <Text style={styles.fieldLabel}>รหัสผ่าน (PIN) * อย่างน้อย 4 ตัว</Text>
              <TextInput
                style={styles.input}
                value={editCustomer.pin}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, pin: v }))}
                placeholder="เช่น 1234"
                keyboardType="number-pad"
                maxLength={8}
                secureTextEntry
              />
              <Text style={styles.pinHint}>
                ⚠️ รหัสนี้ใช้สำหรับลูกค้ารายนี้เท่านั้น ไม่ซ้ำกับรายอื่น
              </Text>

              <Text style={styles.sectionHeader}>💳 ข้อมูลเครดิต</Text>

              <Text style={styles.fieldLabel}>วงเงินเครดิต (บาท)</Text>
              <TextInput
                style={styles.input}
                value={String(editCustomer.credit_limit || '')}
                onChangeText={v => setEditCustomer((p: any) => ({ ...p, credit_limit: parseFloat(v) || 0 }))}
                placeholder="0 = ไม่มีเครดิต"
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>สถานะเครดิต</Text>
              <View style={styles.statusRow}>
                {['normal', 'warning', 'overdue', 'blocked'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusBtn, editCustomer.credit_status === status && styles.statusBtnActive]}
                    onPress={() => setEditCustomer((p: any) => ({ ...p, credit_status: status }))}>
                    <Text style={[styles.statusBtnText, editCustomer.credit_status === status && { color: '#fff' }]}>
                      {status === 'normal' ? '✅ ปกติ' :
                       status === 'warning' ? '⚠️ เตือน' :
                       status === 'overdue' ? '❌ เกินกำหนด' : '🚫 บล็อก'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionHeader}>🚚 การจัดส่ง</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  {editCustomer.delivery ? '🚚 จัดส่งให้ลูกค้า' : '🏪 ลูกค้ามารับเอง'}
                </Text>
                <Switch
                  value={editCustomer.delivery}
                  onValueChange={v => setEditCustomer((p: any) => ({ ...p, delivery: v }))}
                  trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                  thumbColor={editCustomer.delivery ? '#14532d' : '#9ca3af'}
                />
              </View>

            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {saving ? 'กำลังบันทึก...' : '✅ บันทึก'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfeff' },
  header: {
    backgroundColor: '#0e7490', paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#a5f3fc', marginTop: 2 },
  toolbar: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    borderWidth: 1, borderColor: '#e5e7eb', color: '#111827',
  },
  addBtn: {
    backgroundColor: '#0e7490', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8, justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  customerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, borderWidth: 1, borderColor: '#cffafe',
  },
  customerLeft: { marginRight: 12 },
  avatarBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#0e7490', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  customerInfo: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#0e7490' },
  shopNameSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  ownerText: { fontSize: 12, color: '#374151', marginTop: 3 },
  phoneText: { fontSize: 12, color: '#374151', marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { backgroundColor: '#cffafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, color: '#0e7490', fontWeight: '600' },
  editBtn: { backgroundColor: '#dbeafe', padding: 10, borderRadius: 8 },
  editBtnText: { fontSize: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20, maxHeight: '92%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0e7490', marginBottom: 16 },
  sectionHeader: {
    fontSize: 14, fontWeight: '800', color: '#0e7490',
    backgroundColor: '#ecfeff', padding: 8, borderRadius: 6,
    marginTop: 14, marginBottom: 4,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, borderWidth: 1,
    borderColor: '#e5e7eb', color: '#111827',
  },
  pinHint: { fontSize: 11, color: '#f59e0b', marginTop: 4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  statusBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  statusBtnActive: { backgroundColor: '#0e7490', borderColor: '#0e7490' },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelModalBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: '#f3f4f6', alignItems: 'center',
  },
  saveModalBtn: {
    flex: 2, padding: 14, borderRadius: 10,
    backgroundColor: '#0e7490', alignItems: 'center',
  },
});