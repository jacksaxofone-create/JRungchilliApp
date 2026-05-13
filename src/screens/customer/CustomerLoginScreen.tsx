import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DatabaseService } from '../../services/database';
import { tSingle } from '../../i18n/translations';

export const CustomerLoginScreen: React.FC = () => {
  const { primaryLanguage, secondaryLanguage, setCurrentUser, setUserRole } = useAppStore();
  const t = (key: any) => tSingle(key, primaryLanguage);
  const ts = (key: any) => tSingle(key, secondaryLanguage);

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<'select' | 'pin'>('select');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await DatabaseService.getAllCustomers();
    setCustomers(data);
    setLoading(false);
  };

  const filtered = customers.filter(c =>
    c.shop_name?.includes(search) ||
    c.shop_name_en?.toLowerCase().includes(search.toLowerCase()) ||
    c.shop_name_mm?.includes(search) ||
    c.shop_name_cn?.includes(search)
  );

  const handleSelectShop = (customer: any) => {
    setSelectedCustomer(customer);
    setPin('');
    setStep('pin');
  };

  const handleLogin = async () => {
    if (pin.length < 4) {
      Alert.alert('❌', t('enterShopCode'));
      return;
    }
    setLogging(true);
    try {
      const result = await DatabaseService.getCustomerByIdAndPin(selectedCustomer.id, pin);
      if (result) {
        setCurrentUser(result);
      } else {
        Alert.alert('❌', t('wrongCode'));
        setPin('');
      }
    } finally {
      setLogging(false);
    }
  };

  const getShopName = (c: any) => {
    if (secondaryLanguage === 'mm') return c.shop_name_mm || c.shop_name;
    if (secondaryLanguage === 'en') return c.shop_name_en || c.shop_name;
    if (secondaryLanguage === 'cn') return c.shop_name_cn || c.shop_name;
    return c.shop_name;
  };

  if (step === 'pin' && selectedCustomer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pinHeader}>
          <TouchableOpacity onPress={() => { setStep('select'); setPin(''); }}>
            <Text style={styles.backBtn}>← {t('cancel')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pinBox}>
          <Text style={styles.shopEmoji}>🏪</Text>
          <Text style={styles.shopNameLarge}>{selectedCustomer.shop_name}</Text>
          <Text style={styles.shopNameSub}>{getShopName(selectedCustomer)}</Text>
          <Text style={styles.ownerText}>👤 {selectedCustomer.owner_name}</Text>

          {selectedCustomer.delivery ? (
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryText}>🚚 {t('delivery')}</Text>
            </View>
          ) : (
            <View style={[styles.deliveryBadge, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.deliveryText, { color: '#92400e' }]}>🏪 {t('pickupAtShop')}</Text>
            </View>
          )}

          <Text style={styles.pinLabel}>🔐 {t('shopCode')}</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            placeholder="••••"
            placeholderTextColor="#9ca3af"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.loginBtn, logging && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={logging}>
            {logging
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>🛒 {t('newOrder')}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 {t('selectShop')}</Text>
        <Text style={styles.headerSub}>{ts('selectShop')}</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder={`🔍 ${t('searchProduct')}`}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0e7490" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.shopCard}
              onPress={() => handleSelectShop(item)}>
              <View style={styles.shopIconBox}>
                <Text style={styles.shopIcon}>🏪</Text>
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{item.shop_name}</Text>
                <Text style={styles.shopNameSub}>{getShopName(item)}</Text>
                <Text style={styles.shopOwner}>👤 {item.owner_name}</Text>
                <View style={styles.shopBadgeRow}>
                  {item.delivery ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>🚚 {t('delivery')}</Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.badgeText, { color: '#92400e' }]}>🏪 {t('pickupAtShop')}</Text>
                    </View>
                  )}
                  {item.credit_limit > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
                      <Text style={[styles.badgeText, { color: '#6d28d9' }]}>💳 {t('credit')}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>{t('noOrders')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfeff' },
  header: {
    backgroundColor: '#0e7490', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#a5f3fc', marginTop: 2 },
  searchBox: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInput: {
    backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827',
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#0e7490' },
  shopCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, borderWidth: 1, borderColor: '#cffafe',
  },
  shopIconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#cffafe', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  shopIcon: { fontSize: 26 },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#0e7490' },
  shopNameSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  shopOwner: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  shopBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: {
    backgroundColor: '#cffafe', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 11, color: '#0e7490', fontWeight: '600' },
  arrowText: { fontSize: 28, color: '#9ca3af', marginLeft: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  pinHeader: { backgroundColor: '#0e7490', padding: 16 },
  backBtn: { color: '#a5f3fc', fontSize: 16, fontWeight: '600' },
  pinBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 10,
  },
  shopEmoji: { fontSize: 64 },
  shopNameLarge: { fontSize: 22, fontWeight: '800', color: '#0e7490', textAlign: 'center' },
  shopNameSub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  ownerText: { fontSize: 14, color: '#374151' },
  deliveryBadge: {
    backgroundColor: '#cffafe', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
  },
  deliveryText: { fontSize: 14, color: '#0e7490', fontWeight: '700' },
  pinLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16 },
  pinInput: {
    width: '60%', backgroundColor: '#f9fafb', borderRadius: 12,
    padding: 16, fontSize: 28, textAlign: 'center', letterSpacing: 10,
    borderWidth: 2, borderColor: '#0e7490', color: '#111827',
  },
  loginBtn: {
    width: '100%', backgroundColor: '#0e7490', padding: 16,
    borderRadius: 14, alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});