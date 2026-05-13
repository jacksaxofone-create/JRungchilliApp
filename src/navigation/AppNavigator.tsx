import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Image, ActivityIndicator, ScrollView
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/appStore';
import { DatabaseService } from '../services/database';

import { AdminDashboard }          from '../screens/admin/AdminDashboard';
import { ProductManagement }       from '../screens/admin/ProductManagement';
import { AddProductScreen }        from '../screens/admin/AddProductScreen';
import { CustomerManagement }      from '../screens/admin/CustomerManagement';
import { AddCustomerScreen }       from '../screens/admin/AddCustomerScreen';
import { WeighingStation }         from '../screens/stock/WeighingStation';
import { CustomerLoginScreen }     from '../screens/customer/CustomerLoginScreen';
import { CustomerOrderScreen }     from '../screens/customer/CustomerOrderScreen';
import { CustomerOrderHistoryScreen } from '../screens/customer/CustomerOrderHistoryScreen';
import { PrinterSettingsScreen }   from '../screens/settings/PrinterSettingsScreen';

const Stack  = createStackNavigator();
const Tab    = createBottomTabNavigator();

const ADMIN_PASSWORD = '1234';

const LANGUAGES = [
  { code: 'th', label: 'เธ เธฒเธฉเธฒเนเธ—เธข',  flag: '๐น๐ญ', sub: 'Thai'    },
  { code: 'mm', label: 'แ€แ€ผแ€”แ€บแ€แ€ฌแ€แ€ฌแ€แ€ฌ', flag: '๐ฒ๐ฒ', sub: 'Myanmar' },
  { code: 'en', label: 'English',   flag: '๐ฌ๐ง', sub: 'English' },
  { code: 'cn', label: 'ไธญๆ–',       flag: '๐จ๐ณ', sub: 'Chinese' },
];

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   LANGUAGE SETUP SCREEN (first launch only)
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const LanguageSetupScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { setPrimaryLanguage, setSecondaryLanguage } = useAppStore();
  const [step, setStep]       = useState<'primary' | 'secondary'>('primary');
  const [primary, setPrimary] = useState('');

  const selectPrimary = (code: string) => {
    setPrimary(code);
    setStep('secondary');
  };

  const selectSecondary = (code: string) => {
    setPrimaryLanguage(primary as any);
    setSecondaryLanguage(code as any);
    onDone();
  };

  return (
    <View style={styles.langContainer}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.langLogo}
        resizeMode="contain"
      />
      <Text style={styles.langTitle}>เธฃเนเธฒเธเน€เธเธฃเธดเธเธเธดเธฅเธฅเธตเน</Text>
      <Text style={styles.langTitle2}>J.Rung Chilli</Text>

      {step === 'primary' ? (
        <>
          <Text style={styles.langPrompt}>เน€เธฅเธทเธญเธเธ เธฒเธฉเธฒเธซเธฅเธฑเธ / Select Primary Language</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={styles.langCard}
                onPress={() => selectPrimary(l.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
                <Text style={styles.langSub}>{l.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.langPrompt}>เน€เธฅเธทเธญเธเธ เธฒเธฉเธฒเธฃเธญเธ / Select Secondary Language</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.filter(l => l.code !== primary).map(l => (
              <TouchableOpacity
                key={l.code}
                style={styles.langCard}
                onPress={() => selectSecondary(l.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
                <Text style={styles.langSub}>{l.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setStep('primary')} style={styles.langBackBtn}>
            <Text style={styles.langBackText}>โ เน€เธเธฅเธตเนเธขเธเธ เธฒเธฉเธฒเธซเธฅเธฑเธ</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   ROLE SELECT SCREEN
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const RoleSelectScreen: React.FC<{ onSelectRole: (role: string) => void }> = ({ onSelectRole }) => {
  const { primaryLanguage, secondaryLanguage, setPrimaryLanguage, setSecondaryLanguage } = useAppStore();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass]           = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [showLangModal, setShowLangModal]   = useState(false);
  const [langStep, setLangStep]             = useState<'primary'|'secondary'>('primary');
  const [tempPrimary, setTempPrimary]       = useState('');

  const currentLang = LANGUAGES.find(l => l.code === primaryLanguage);
  const secLang     = LANGUAGES.find(l => l.code === secondaryLanguage);

  const handleAdminLogin = () => {
    if (adminPass === ADMIN_PASSWORD) {
      setShowAdminModal(false);
      setAdminPass('');
      onSelectRole('admin');
    } else {
      Alert.alert('โ เธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ', 'เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน\nWrong password, please try again');
      setAdminPass('');
    }
  };

  const changePrimary = (code: string) => {
    setTempPrimary(code);
    setLangStep('secondary');
  };

  const changeSecondary = (code: string) => {
    setPrimaryLanguage(tempPrimary as any);
    setSecondaryLanguage(code as any);
    setShowLangModal(false);
    setLangStep('primary');
  };

  const roles = [
    { key: 'admin',    icon: '๐ก๏ธ',  labelTh: 'เนเธญเธ”เธกเธดเธ',       labelEn: 'Admin',    color: '#c0392b', locked: true  },
    { key: 'stock',    icon: 'โ–๏ธ',  labelTh: 'เธเธฑเนเธเนเธฅเธฐเธเธฒเธข',   labelEn: 'Weigh & Sell', color: '#8e44ad', locked: false },
    { key: 'customer', icon: '๐๏ธ', labelTh: 'เธชเธฑเนเธเธชเธดเธเธเนเธฒ',   labelEn: 'Order',    color: '#27ae60', locked: false },
  ];

  return (
    <ScrollView contentContainerStyle={styles.roleContainer}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.roleLogo}
        resizeMode="contain"
      />
      <Text style={styles.roleTitle}>เธฃเนเธฒเธเน€เธเธฃเธดเธเธเธดเธฅเธฅเธตเน</Text>
      <Text style={styles.roleTitle2}>J.Rung Chilli</Text>

      {/* Language indicator */}
      <TouchableOpacity
        style={styles.langIndicator}
        onPress={() => { setShowLangModal(true); setLangStep('primary'); }}
      >
        <Text style={styles.langIndicatorText}>
          {currentLang?.flag} {currentLang?.label}  ยท  {secLang?.flag} {secLang?.label}
        </Text>
        <Text style={styles.langIndicatorSub}>เนเธ•เธฐเน€เธเธทเนเธญเน€เธเธฅเธตเนเธขเธเธ เธฒเธฉเธฒ / Tap to change language</Text>
      </TouchableOpacity>

      <Text style={styles.rolePrompt}>เน€เธฅเธทเธญเธเธเธฒเธฃเนเธเนเธเธฒเธ / Select Role</Text>

      {roles.map(role => (
        <TouchableOpacity
          key={role.key}
          style={[styles.roleCard, { borderLeftColor: role.color }]}
          onPress={() => {
            if (role.key === 'admin') {
              setShowAdminModal(true);
            } else if (role.key === 'customer') {
              onSelectRole('customer');
            } else {
              onSelectRole(role.key);
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.roleIcon}>{role.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleCardLabel}>{role.labelTh}</Text>
            <Text style={styles.roleCardSub}>{role.labelEn}</Text>
          </View>
          {role.locked && (
            <Text style={styles.roleLock}>๐”</Text>
          )}
          <Text style={[styles.roleArrow, { color: role.color }]}>โ€บ</Text>
        </TouchableOpacity>
      ))}

      {/* Admin Password Modal */}
      <Modal visible={showAdminModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.adminModal}>
            <Text style={styles.adminModalTitle}>๐ก๏ธ Admin Login</Text>
            <Text style={styles.adminModalSub}>เธเธฃเธญเธเธฃเธซเธฑเธชเธเนเธฒเธเนเธญเธ”เธกเธดเธ</Text>
            <View style={styles.passRow}>
              <TextInput
                style={styles.passInput}
                value={adminPass}
                onChangeText={setAdminPass}
                secureTextEntry={!showPass}
                keyboardType="number-pad"
                placeholder="เธฃเธซเธฑเธชเธเนเธฒเธ / Password"
                maxLength={8}
                onSubmitEditing={handleAdminLogin}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '๐' : '๐‘๏ธ'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.adminModalBtns}>
              <TouchableOpacity
                style={styles.adminCancelBtn}
                onPress={() => { setShowAdminModal(false); setAdminPass(''); }}
              >
                <Text style={styles.adminCancelText}>เธขเธเน€เธฅเธดเธ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminLoginBtn} onPress={handleAdminLogin}>
                <Text style={styles.adminLoginText}>เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Change Modal */}
      <Modal visible={showLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>
              {langStep === 'primary' ? '๐ เน€เธฅเธทเธญเธเธ เธฒเธฉเธฒเธซเธฅเธฑเธ' : '๐ เน€เธฅเธทเธญเธเธ เธฒเธฉเธฒเธฃเธญเธ'}
            </Text>
            <View style={styles.langGrid}>
              {(langStep === 'primary' ? LANGUAGES : LANGUAGES.filter(l => l.code !== tempPrimary))
                .map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langCard,
                      (langStep === 'primary' ? primaryLanguage : secondaryLanguage) === l.code
                        && styles.langCardActive]}
                    onPress={() => langStep === 'primary' ? changePrimary(l.code) : changeSecondary(l.code)}
                  >
                    <Text style={styles.langFlag}>{l.flag}</Text>
                    <Text style={styles.langLabel}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
              style={styles.langModalClose}
              onPress={() => { setShowLangModal(false); setLangStep('primary'); }}
            >
              <Text style={styles.langModalCloseText}>เธขเธเน€เธฅเธดเธ / Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.versionText}>v1.0.0 ยท เธฃเนเธฒเธเน€เธเธฃเธดเธเธเธดเธฅเธฅเธตเน</Text>
    </ScrollView>
  );
};

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   ADMIN STACK
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const AdminStack: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard"
      children={(props) => <AdminDashboard {...props} onLogout={onLogout} />} />
    <Stack.Screen name="ProductManagement" component={ProductManagement} />
    <Stack.Screen name="AddProduct"        component={AddProductScreen}  />
    <Stack.Screen name="CustomerManagement" component={CustomerManagement} />
    <Stack.Screen name="AddCustomer"       component={AddCustomerScreen} />
    <Stack.Screen name="PrinterSettings"   component={PrinterSettingsScreen} />
  </Stack.Navigator>
);

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   STOCK STACK
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const StockStack: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WeighingStation"
      children={(props) => <WeighingStation {...props} onLogout={onLogout} />} />
    <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
  </Stack.Navigator>
);

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   CUSTOMER STACK
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const CustomerStack: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerLogin"
      children={(props) => <CustomerLoginScreen {...props} onLogout={onLogout} />} />
    <Stack.Screen name="CustomerOrder"        component={CustomerOrderScreen} />
    <Stack.Screen name="CustomerOrderHistory" component={CustomerOrderHistoryScreen} />
  </Stack.Navigator>
);

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   LOADING SCREEN
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Image
      source={require('../assets/logo.png')}
      style={styles.loadingLogo}
      resizeMode="contain"
    />
    <ActivityIndicator size="large" color="#c0392b" style={{ marginTop: 24 }} />
    <Text style={styles.loadingText}>เธเธณเธฅเธฑเธเนเธซเธฅเธ”...</Text>
    <Text style={styles.loadingText2}>Loading...</Text>
  </View>
);

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   MAIN APP NAVIGATOR
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
export const AppNavigator = () => {
  const { setUserRole } = useAppStore();
  const [appState, setAppState] = useState<'loading' | 'language' | 'role' | 'app'>('loading');
  const [role, setRole]         = useState<string>('');
  const [dbReady, setDbReady]   = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await DatabaseService.init();
      setDbReady(true);
      setAppState('language');
    } catch (e) {
      console.error('DB init error:', e);
      setAppState('language');
    }
  };

  const handleLanguageDone = () => {
    setAppState('role');
  };

  const handleSelectRole = (selectedRole: string) => {
    setRole(selectedRole);
    setUserRole(selectedRole as any);
    setAppState('app');
  };

  const handleLogout = () => {
    setUserRole(null);
    setRole('');
    setAppState('role');
  };

  if (appState === 'loading') return <LoadingScreen />;

  if (appState === 'language') {
    return <LanguageSetupScreen onDone={handleLanguageDone} />;
  }

  if (appState === 'role') {
    return (
      <NavigationContainer>
        <RoleSelectScreen onSelectRole={handleSelectRole} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {role === 'admin'    && <AdminStack    onLogout={handleLogout} />}
      {role === 'stock'    && <StockStack    onLogout={handleLogout} />}
      {role === 'customer' && <CustomerStack onLogout={handleLogout} />}
    </NavigationContainer>
  );
};

/* โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
   STYLES
โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€ */
const styles = StyleSheet.create({
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center',
                       backgroundColor: '#fff' },
  loadingLogo:       { width: 120, height: 120 },
  loadingText:       { fontSize: 16, color: '#c0392b', marginTop: 12 },
  loadingText2:      { fontSize: 14, color: '#7f8c8d', marginTop: 4 },

  langContainer:     { flex: 1, backgroundColor: '#fff', alignItems: 'center',
                       justifyContent: 'center', padding: 24 },
  langLogo:          { width: 100, height: 100, marginBottom: 12 },
  langTitle:         { fontSize: 24, fontWeight: 'bold', color: '#c0392b' },
  langTitle2:        { fontSize: 16, color: '#7f8c8d', marginBottom: 24 },
  langPrompt:        { fontSize: 16, color: '#2c3e50', fontWeight: '600',
                       marginBottom: 16, textAlign: 'center' },
  langGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12,
                       justifyContent: 'center' },
  langCard:          { width: 140, backgroundColor: '#fdecea', borderRadius: 14,
                       padding: 16, alignItems: 'center', borderWidth: 2,
                       borderColor: 'transparent', elevation: 2 },
  langCardActive:    { borderColor: '#c0392b', backgroundColor: '#fff' },
  langFlag:          { fontSize: 36 },
  langLabel:         { fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginTop: 6 },
  langSub:           { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  langBackBtn:       { marginTop: 20, padding: 12 },
  langBackText:      { color: '#c0392b', fontSize: 14 },

  roleContainer:     { flexGrow: 1, backgroundColor: '#f5f5f5', alignItems: 'center',
                       paddingVertical: 32, paddingHorizontal: 20 },
  roleLogo:          { width: 90, height: 90, marginBottom: 8 },
  roleTitle:         { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
  roleTitle2:        { fontSize: 14, color: '#7f8c8d', marginBottom: 12 },
  langIndicator:     { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18,
                       paddingVertical: 10, marginBottom: 20, elevation: 1,
                       alignItems: 'center' },
  langIndicatorText: { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  langIndicatorSub:  { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  rolePrompt:        { fontSize: 15, color: '#7f8c8d', marginBottom: 16 },
  roleCard:          { width: '100%', backgroundColor: '#fff', borderRadius: 14,
                       padding: 18, marginBottom: 12, flexDirection: 'row',
                       alignItems: 'center', borderLeftWidth: 5, elevation: 3, gap: 14 },
  roleIcon:          { fontSize: 32 },
  roleCardLabel:     { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  roleCardSub:       { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  roleLock:          { fontSize: 18 },
  roleArrow:         { fontSize: 28, fontWeight: 'bold' },
  versionText:       { fontSize: 11, color: '#bdc3c7', marginTop: 24 },

  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
                       justifyContent: 'center', alignItems: 'center' },
  adminModal:        { backgroundColor: '#fff', borderRadius: 16, padding: 24,
                       width: '85%', alignItems: 'center' },
  adminModalTitle:   { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 },
  adminModalSub:     { fontSize: 14, color: '#7f8c8d', marginBottom: 20 },
  passRow:           { flexDirection: 'row', alignItems: 'center',
                       width: '100%', marginBottom: 20 },
  passInput:         { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
                       padding: 12, fontSize: 20, textAlign: 'center',
                       letterSpacing: 8, fontWeight: 'bold' },
  eyeBtn:            { padding: 10 },
  eyeIcon:           { fontSize: 22 },
  adminModalBtns:    { flexDirection: 'row', gap: 10, width: '100%' },
  adminCancelBtn:    { flex: 1, backgroundColor: '#ecf0f1', borderRadius: 10,
                       padding: 14, alignItems: 'center' },
  adminCancelText:   { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  adminLoginBtn:     { flex: 1, backgroundColor: '#c0392b', borderRadius: 10,
                       padding: 14, alignItems: 'center' },
  adminLoginText:    { fontSize: 15, color: '#fff', fontWeight: 'bold' },

  langModal:         { backgroundColor: '#fff', borderRadius: 16, padding: 24,
                       width: '90%', alignItems: 'center' },
  langModalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  langModalClose:    { marginTop: 16, padding: 12 },
  langModalCloseText:{ color: '#e74c3c', fontSize: 14 },
});

export default AppNavigator;