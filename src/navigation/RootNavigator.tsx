import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAppStore } from "../core/store/appStore";

import LoginScreen from "../features/auth/LoginScreen";
import POSScreen from "../features/pos/POSScreen";
import AdminDashboardScreen from "../features/admin/AdminDashboardScreen";
import AddProductScreen from "../features/admin/AddProductScreen";
import ProductListScreen from "../features/admin/ProductListScreen";
import AddCustomerScreen from "../features/admin/AddCustomerScreen";
import CustomerListScreen from "../features/admin/CustomerListScreen";
import AllOrdersScreen from "../features/admin/AllOrdersScreen";
import OrderScreen from "../features/order/OrderScreen";
import PrinterSettingsScreen from "../features/settings/PrinterSettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

export default function RootNavigator() {
  const { userRole, isAuthenticated } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userRole === "admin" ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminTabs} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
          </>
        ) : userRole === "stock" ? (
          <>
            <Stack.Screen name="POS" component={POSScreen} />
            <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Order" component={OrderScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}