import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/appStore';
import { AdminDashboard } from '../screens/admin/AdminDashboard';
import { ProductManagement } from '../screens/admin/ProductManagement';
import { WeighingStation } from '../screens/stock/WeighingStation';
import { CashierScreen } from '../screens/counter/CashierScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const FONT_TH = 'NotoSansThai-Regular';
const FONT_TH_BOLD = 'NotoSansThai-Bold';
const FONT_MM = 'NotoSansMyanmar-Regular';

function LoginScreen() {
  const { setCurrentUser } = useAppStore();
  const handleLogin = (role: string) => setCurrentUser({ role, name: role });
  return (
    <ScrollView contentContainerStyle={styles.loginContainer}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>เจรุ่งชิลลี่</Text>
      <Text style={styles.appSub}>J.Rung Chilli | Mae Sot</Text>
      <Text style={styles.selectRole}>เลือกบทบาทการใช้งาน / Select Role</Text>
      <TouchableOpacity style={[styles.roleBtn, { backgroundColor: '#14532d' }]} onPress={() => handleLogin('admin')}>
        <Text style={styles.roleIcon}>👑</Text>
        <View>
          <Text style={styles.roleTh}>แอดมิน</Text>
          <Text style={styles.roleEn}>Admin</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.roleBtn, { backgroundColor: '#1e40af' }]} onPress={() => handleLogin('stock')}>
        <Text style={styles.roleIcon}>⚖️</Text>
        <View>
          <Text style={styles.roleTh}>คัดของ / แคชเชียร์</Text>
          <Text style={styles.roleEn}>Stock & Cashier</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.roleBtn, { backgroundColor: '#92400e' }]} onPress={() => handleLogin('cashier')}>
        <Text style={styles.roleIcon}>🛒</Text>
        <View>
          <Text style={styles.roleTh}>สั่งสินค้า</Text>
          <Text style={styles.roleEn}>Order</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.version}>v1.0.0 – Pilot Mae Sot</Text>
    </ScrollView>
  );
}

function HeaderLeft() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 12 }}>
      <Text style={{ fontSize: 22 }}>◀</Text>
    </TouchableOpacity>
  );
}

function HeaderHome() {
  const { setCurrentUser } = useAppStore();
  return (
    <TouchableOpacity onPress={() => setCurrentUser(null)} style={{ paddingRight: 12 }}>
      <Text style={{ fontSize: 13, color: '#fff', backgroundColor: '#374151', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>🏠 หน้าหลัก</Text>
    </TouchableOpacity>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#14532d' },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#86efac',
      headerShown: false,
    }}>
      <Tab.Screen name="Dashboard" component={AdminDashboard}
        options={{ tabBarLabel: 'แดชบอร์ด', tabBarIcon: () => <Text>📊</Text> }} />
      <Tab.Screen name="Products" component={ProductManagement}
        options={{ tabBarLabel: 'สินค้า', tabBarIcon: () => <Text>🌶️</Text> }} />
    </Tab.Navigator>
  );
}

function StockTabs() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#1e3a8a' },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#93c5fd',
      headerShown: false,
    }}>
      <Tab.Screen name="Weighing" component={WeighingStation}
        options={{ tabBarLabel: 'ชั่งของ', tabBarIcon: () => <Text>⚖️</Text> }} />
      <Tab.Screen name="Cashier" component={CashierScreen}
        options={{ tabBarLabel: 'แคชเชียร์', tabBarIcon: () => <Text>💰</Text> }} />
    </Tab.Navigator>
  );
}

function CashierTabs() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#78350f' },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#fcd34d',
      headerShown: false,
    }}>
      <Tab.Screen name="Order" component={CashierScreen}
        options={{ tabBarLabel: 'สั่งสินค้า', tabBarIcon: () => <Text>🛒</Text> }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { currentUser } = useAppStore();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: FONT_TH_BOLD, fontSize: 16 },
        headerRight: () => currentUser ? <HeaderHome /> : null,
      }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen}
            options={{ headerShown: false }} />
        ) : currentUser.role === 'admin' ? (
          <Stack.Screen name="AdminMain" component={AdminTabs}
            options={{ headerShown: false }} />
        ) : currentUser.role === 'stock' ? (
          <Stack.Screen name="StockMain" component={StockTabs}
            options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="CashierMain" component={CashierTabs}
            options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  logo: { width: 160, height: 160 },
  appName: { fontSize: 28, fontFamily: 'NotoSansThai-Bold', color: '#14532d' },
  appSub: { fontSize: 14, color: '#6b7280', fontFamily: 'NotoSansThai-Regular' },
  selectRole: { fontSize: 15, color: '#374151', fontFamily: 'NotoSansThai-Regular', marginTop: 8 },
  roleBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    padding: 18, borderRadius: 14, gap: 16,
  },
  roleIcon: { fontSize: 32 },
  roleTh: { fontSize: 18, color: '#fff', fontFamily: 'NotoSansThai-Bold' },
  roleEn: { fontSize: 13, color: '#e5e7eb', fontFamily: 'NotoSansThai-Regular' },
  version: { fontSize: 11, color: '#9ca3af', marginTop: 8, fontFamily: 'NotoSansThai-Regular' },
});