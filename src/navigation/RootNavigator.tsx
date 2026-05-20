import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAppStore } from "../core/store/appStore";

// Auth
import LoginScreen from "../features/auth/LoginScreen";

// Admin
import AdminDashboardScreen from "../features/admin/AdminDashboardScreen";
import AddProductScreen from "../features/admin/AddProductScreen";
import ProductListScreen from "../features/admin/ProductListScreen";
import AddCustomerScreen from "../features/admin/AddCustomerScreen";
import CustomerListScreen from "../features/admin/CustomerListScreen";
import AllOrdersScreen from "../features/admin/AllOrdersScreen";

// Cashier (new)
import CashierScreen from "../features/pos/CashierScreen";
import POSScreen from "../features/pos/POSScreen";

// Customer (new)
import CustomerEntryScreen from "../features/customer/CustomerEntryScreen";
import CustomerLoginScreen from "../features/customer/CustomerLoginScreen";
import CustomerDashboardScreen from "../features/customer/CustomerDashboardScreen";

// Wholesale
import WholesaleOrderScreen from "../features/customer/WholesaleOrderScreen";

// Settings
import PrinterSettingsScreen from "../features/settings/PrinterSettingsScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Admin Bottom Tabs ──────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#1a252f", height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: "#f39c12",
        tabBarInactiveTintColor: "#aaa",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          tabBarLabel: "สินค้า",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📦</Text>,
        }}
      />
      <Tab.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{
          tabBarLabel: "ลูกค้า",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="AllOrders"
        component={AllOrdersScreen}
        options={{
          tabBarLabel: "ออเดอร์",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          tabBarLabel: "ปริ้นเตอร์",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🖨️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Cashier Bottom Tabs ────────────────────────────────────
function CashierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#1a252f", height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: "#e67e22",
        tabBarInactiveTintColor: "#aaa",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="CashierMain"
        component={CashierScreen}
        options={{
          tabBarLabel: "แคชเชียร์",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚖️</Text>,
        }}
      />
      <Tab.Screen
        name="สั่งสินค้า"
        component={CustomerEntryScreen}
        options={{
          tabBarLabel: "สั่งสินค้า",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛒</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ─────────────────────────────────────────
export default function RootNavigator() {
  const { userRole, isAuthenticated } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* ── ยังไม่ได้ล็อกอิน ── */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            {/* P2.2: CustomerEntry (2-option: Walk-in / Member) */}
            <Stack.Screen name="CustomerEntry"  component={CustomerEntryScreen} />
            {/* CustomerLogin ยังคงไว้เพื่อ backward compat */}
            <Stack.Screen name="CustomerLogin"  component={CustomerLoginScreen} />
            {/* POS walk-in สำหรับลูกค้าทั่วไป */}
            <Stack.Screen name="POS"            component={POSScreen} />
            {/* WholesaleOrder สำหรับสมาชิก */}
            <Stack.Screen name="WholesaleOrder" component={WholesaleOrderScreen} />
          </>

        /* ── Admin ── */
        ) : userRole === "admin" ? (
          <>
            <Stack.Screen name="AdminHome"       component={AdminTabs} />
            <Stack.Screen name="AddProduct"      component={AddProductScreen} />
            <Stack.Screen name="AddCustomer"     component={AddCustomerScreen} />
            <Stack.Screen name="ProductList"     component={ProductListScreen} />
            <Stack.Screen name="CustomerList"    component={CustomerListScreen} />
            <Stack.Screen name="AllOrders"       component={AllOrdersScreen} />
            <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
          </>

        /* ── Cashier / Stock ── */
        ) : userRole === "cashier" || userRole === "stock" ? (
          <>
            <Stack.Screen name="CashierHome"     component={CashierTabs} />
            <Stack.Screen name="Cashier"         component={CashierScreen} />
            <Stack.Screen name="POS"             component={POSScreen} />
            <Stack.Screen name="CustomerEntry"   component={CustomerEntryScreen} />
            <Stack.Screen name="WholesaleOrder"  component={WholesaleOrderScreen} />
            <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
          </>

        /* ── Customer (Wholesale dealer) ── */
        ) : userRole === "customer" ? (
          <>
            <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} />
            <Stack.Screen name="WholesaleOrder"    component={WholesaleOrderScreen} />
          </>

        /* ── Fallback ── */
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
