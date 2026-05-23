import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { initDatabase } from "./src/core/database/initDb";
import { DB } from "./src/core/database/DatabaseService";
import { useAppStore } from "./src/core/store/appStore";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const { setSettings, setProducts, setCustomers } = useAppStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        console.log("[App] Starting bootstrap...");
        await initDatabase();
        console.log("[App] DB initialized");

        const adminPin    = DB.getSetting("admin_pin")    || "0000";
        const shopName    = DB.getSetting("shop_name")    || "JRung Chilli";
        const shopAddress = DB.getSetting("shop_address") || "Mae Sot";
        const changeFund  = parseFloat(DB.getSetting("change_fund") || "500");

        setSettings({ admin_pin: adminPin, shop_name: shopName, shop_address: shopAddress, change_fund: changeFund });
        console.log("[App] Settings loaded");

        const products  = DB.getAllProducts();
        const customers = DB.getAllCustomers();
        setProducts(products);
        setCustomers(customers);
        console.log("[App] Loaded " + products.length + " products, " + customers.length + " customers");

        setReady(true);
      } catch (e) {
        console.error("[App] Bootstrap error:", e);
        setError(String((e as any)?.message || e));
      }
    }
    bootstrap();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", fontSize: 16, textAlign: "center", padding: 20 }}>
          {"\u274C"} Error:{"\n"}{error}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 28, marginBottom: 16 }}>{"\uD83C\uDF36"}</Text>
        <ActivityIndicator size="large" color="#c0392b" />
        <Text style={{ marginTop: 12, color: "#555" }}>Loading JRungChilli POS...</Text>
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fef9f0" },
});
