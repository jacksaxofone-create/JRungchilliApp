import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { initDatabase } from "./src/core/database/initDb";
import { DB } from "./src/core/database/DatabaseService";
import { useAppStore } from "./src/core/store/appStore";
import RootNavigator from "./src/navigation/RootNavigator";

function SplashScreen() {
  return (
    <View style={sp.container}>
      <Text style={sp.logo}>🌶️</Text>
      <ActivityIndicator size="large" color="#c0392b" style={{ marginTop: 24 }} />
      <Text style={sp.text}>กำลังโหลด... / Loading...</Text>
    </View>
  );
}

function AppContent() {
  const { setSettings } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        // โหลด settings จาก DB เข้า store
        const shopName    = DB.getSetting('shop_name')    || 'เจรุ่งชิลลี่';
        const shopAddress = DB.getSetting('shop_address') || 'แม่สอด';
        const adminPin    = DB.getSetting('admin_pin')    || '0000';
        const changeFund  = parseFloat(DB.getSetting('change_fund') || '500');
        setSettings({ shop_name: shopName, shop_address: shopAddress, admin_pin: adminPin, change_fund: changeFund });
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return <SplashScreen />;
  return <RootNavigator />;
}

export default function App() {
  return <AppContent />;
}

const sp = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { fontSize: 72 },
  text: { fontSize: 15, color: '#c0392b', marginTop: 12, fontWeight: '600' },
});