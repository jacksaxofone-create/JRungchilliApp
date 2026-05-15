import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/appStore';

// Admin Screens
import { AdminDashboard }       from '../screens/admin/AdminDashboard';
import { ProductManagement }    from '../screens/admin/ProductManagement';
import { AddProductScreen }     from '../screens/admin/AddProductScreen';
import { AddCustomerScreen }    from '../screens/admin/AddCustomerScreen';
import { CustomerManagement }   from '../screens/admin/CustomerManagement';
import { AllOrdersScreen }      from '../screens/admin/AllOrdersScreen';

// Stock Screens
import { WeighingStation }      from '../screens/stock/WeighingStation';

// Counter / Cashier Screens
import { CashierScreen }        from '../screens/counter/CashierScreen';

// Customer Order Screen
import { OrderScreen }          from '../screens/counter/OrderScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const FONT_TH_BOLD = 'NotoSansThai-Bold';

/* ─── Login Screen ─── */
function LoginScreen() {
  const { setCurrentUser } = useAppStore();
  return (
    <ScrollView contentContainerStyle={styles.loginContainer}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>เจรุ่งชิลลี่</Text>
      <Text style={styles.appSub}>J.Rung Chilli | Mae Sot</Text>
      <Text style={styles.selectRole}>เลือกบทบาทการใช้งาน / Select Role</Text>

      <TouchableOpacity
        style={[styles.roleBtn, { backgroundColor: '#14532d' }]}
        onPress={() => setCurrentUser({ role: 'admin', name: 'Admin' })}>
        <Text style={styles.roleIcon}>👑</Text>
        <View>
          <Text style={styles.roleTh}>แอดมิน</Text>
          <Text style={styles.roleEn}>Admin</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleBtn, { backgroundColor: '#1e40af' }]}
        onPress={() => setCurrentUser({ role: 'stock', name: 'Stock' })}>
        <Text style={styles.roleIcon}>⚖️</Text>
        <View>
          <Text style={styles.roleTh}>คัดของ / แคชเชียร์</Text>
          <Text style={styles.roleEn}>Stock & Cashier</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleBtn, { backgroundColor: '#92400e' }]}
        onPress={() => setCurrentUser({ role: 'cashier', name: 'Customer' })}>
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

/* ─── Header Buttons ─── */
function HeaderHome() {
  const { setCurrentUser } = useAppStore();
  return (
    <TouchableOpacity
      onPress={() => setCurrentUser(null)}
      style={{ paddingRight: 12 }}>
      <Text style={{
        fontSize: 13, color: '#fff',
        backgroundColor: '#374151',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
      }}>🏠 หน้าหลัก</Text>
    </TouchableOpacity>
  );
}

/* ─── Admin Tab Navigator ─── */
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

/* ─── Stock Tab Navigator ─── */
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

/* ─── Main Navigator ─── */
export function AppNavigator() {
  const { currentUser } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: FONT_TH_BOLD, fontSize: 16 },
          headerRight: () => currentUser ? <HeaderHome /> : null,
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <TouchableOpacity
                onPress={() => {}}
                style={{ paddingLeft: 12 }}>
                <Text style={{ fontSize: 22, color: '#fff' }}>◀</Text>
              </TouchableOpacity>
            ) : null,
        }}>

        {/* ─── No User: Login ─── */}
        {!currentUser && (
          <Stack.Screen name="Login" component={LoginScreen}
            options={{ headerShown: false }} />
        )}

        {/* ─── Admin Screens ─── */}
        {currentUser?.role === 'admin' && (
          <>
            <Stack.Screen name="AdminMain" component={AdminTabs}
              options={{ headerShown: false }} />
            <Stack.Screen name="AddProduct" component={AddProductScreen}
              options={{ title: '➕ เพิ่มสินค้า / Add Product' }} />
            <Stack.Screen name="ProductManagement" component={ProductManagement}
              options={{ title: '📋 จัดการสินค้า' }} />
            <Stack.Screen name="AddCustomer" component={AddCustomerScreen}
              options={{ title: '➕ เพิ่มลูกค้า / Add Customer' }} />
            <Stack.Screen name="CustomerManagement" component={CustomerManagement}
              options={{ title: '👥 จัดการลูกค้า' }} />
            <Stack.Screen name="AllOrders" component={AllOrdersScreen}
              options={{ title: '🗂️ ออเดอร์ทั้งหมด' }} />
          </>
        )}

        {/* ─── Stock Screens ─── */}
        {currentUser?.role === 'stock' && (
          <>
            <Stack.Screen name="StockMain" component={StockTabs}
              options={{ headerShown: false }} />
          </>
        )}

        {/* ─── Customer Order Screens ─── */}
        {currentUser?.role === 'cashier' && (
          <>
            <Stack.Screen name="OrderMain" component={OrderScreen}
              options={{ headerShown: false }} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  loginContainer: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', padding: 24, gap: 12,
  },
  logo:       { width: 160, height: 160 },
  appName:    { fontSize: 28, fontFamily: 'NotoSansThai-Bold', color: '#14532d' },
  appSub:     { fontSize: 14, color: '#6b7280', fontFamily: 'NotoSansThai-Regular' },
  selectRole: { fontSize: 15, color: '#374151', fontFamily: 'NotoSansThai-Regular', marginTop: 8 },
  roleBtn:    {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    padding: 18, borderRadius: 14, gap: 16,
  },
  roleIcon:   { fontSize: 32 },
  roleTh:     { fontSize: 18, color: '#fff', fontFamily: 'NotoSansThai-Bold' },
  roleEn:     { fontSize: 13, color: '#e5e7eb', fontFamily: 'NotoSansThai-Regular' },
  version:    { fontSize: 11, color: '#9ca3af', marginTop: 8, fontFamily: 'NotoSansThai-Regular' },
});