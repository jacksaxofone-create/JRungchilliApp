import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator,
  StyleSheet, Alert, SafeAreaView, StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PrinterService from "../../core/hardware/PrinterService";

interface BtDevice {
  name: string;
  address: string;
}

export default function PrinterSettingsScreen() {
  const navigation = useNavigation<any>();
  const printer = PrinterService.getInstance();
  const [devices, setDevices] = useState<BtDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState(printer.getIsConnected());
  const [connectedAddr, setConnectedAddr] = useState(printer.getConnectedAddress());

  const scan = async () => {
    setScanning(true);
    setDevices([]);
    const found = await printer.scanDevices();
    setDevices(found);
    setScanning(false);
  };

  const connect = async (device: BtDevice) => {
    setConnecting(device.address);
    const ok = await printer.connect(device.address);
    if (ok) {
      setConnected(true);
      setConnectedAddr(device.address);
      Alert.alert("✅", `เชื่อมต่อ ${device.name} สำเร็จ`);
    } else {
      Alert.alert("❌", `เชื่อมต่อ ${device.name} ไม่สำเร็จ`);
    }
    setConnecting(null);
  };

  const testPrint = async () => {
    const ok = await printer.printSticker({
      shopName: "เจรุ่งชิลลี่",
      productName: "TEST ITEM",
      weight: 1.234,
      unitPrice: 45,
      totalPrice: 55.53,
      priceType: "retail",
      date: new Date().toLocaleDateString("th-TH"),
      orderNumber: "TEST001",
    });
    if (ok) Alert.alert("✅", "พิมพ์ทดสอบสำเร็จ");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#c0392b" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🖨️ ตั้งค่าเครื่องพิมพ์</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🏠</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Status */}
        <View style={[styles.statusBox, { backgroundColor: connected ? "#d5f5e3" : "#fde8e8" }]}>
          <Text style={styles.statusIcon}>{connected ? "🟢" : "🔴"}</Text>
          <View>
            <Text style={styles.statusTitle}>{connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}</Text>
            <Text style={styles.statusAddr}>{connectedAddr || "VOZY U8 — Bluetooth"}</Text>
          </View>
        </View>

        {/* Printer Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 ข้อมูลเครื่องพิมพ์</Text>
          <Text style={styles.infoText}>รุ่น: VOZY U8 Thermal Label Printer</Text>
          <Text style={styles.infoText}>Interface: Bluetooth (TSC Command)</Text>
          <Text style={styles.infoText}>กระดาษ: 110mm MAX</Text>
          <Text style={styles.infoText}>ขนาดสติ๊กเกอร์: 60mm × 40mm (มาตรฐานห้างฯ)</Text>
        </View>

        {/* Scan Button */}
        <TouchableOpacity style={styles.scanBtn} onPress={scan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanBtnText}>🔍 สแกนหา Bluetooth Devices</Text>
          )}
        </TouchableOpacity>

        {/* Device List */}
        <FlatList
          data={devices}
          keyExtractor={(item) => item.address}
          style={{ marginTop: 8 }}
          ListEmptyComponent={
            !scanning ? (
              <Text style={styles.emptyText}>กด "สแกน" เพื่อค้นหาเครื่องพิมพ์</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.deviceCard,
                connectedAddr === item.address && styles.deviceCardConnected,
              ]}
              onPress={() => connect(item)}
              disabled={connecting === item.address}
            >
              <View>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceAddr}>{item.address}</Text>
              </View>
              {connecting === item.address ? (
                <ActivityIndicator color="#c0392b" />
              ) : connectedAddr === item.address ? (
                <Text style={styles.connectedBadge}>✅ เชื่อมต่อ</Text>
              ) : (
                <Text style={styles.connectBtn}>เชื่อมต่อ</Text>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Test Print */}
        {connected && (
          <TouchableOpacity style={styles.testBtn} onPress={testPrint}>
            <Text style={styles.testBtnText}>🖨️ พิมพ์ทดสอบ (60×40mm)</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#c0392b", flexDirection: "row",
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 10,
  },
  headerBtn: { padding: 8 },
  headerBtnText: { color: "#fff", fontSize: 18 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  body: { flex: 1, padding: 16 },
  statusBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 10, padding: 14, marginBottom: 12,
  },
  statusIcon: { fontSize: 28 },
  statusTitle: { fontSize: 15, fontWeight: "bold", color: "#333" },
  statusAddr: { fontSize: 12, color: "#666" },
  infoBox: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    marginBottom: 12, elevation: 1,
  },
  infoTitle: { fontSize: 14, fontWeight: "bold", color: "#c0392b", marginBottom: 8 },
  infoText: { fontSize: 13, color: "#555", marginBottom: 3 },
  scanBtn: {
    backgroundColor: "#2980b9", borderRadius: 8,
    paddingVertical: 12, alignItems: "center",
  },
  scanBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#aaa", marginTop: 20 },
  deviceCard: {
    backgroundColor: "#fff", borderRadius: 8, padding: 14,
    marginBottom: 8, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
    elevation: 1, borderWidth: 1, borderColor: "#eee",
  },
  deviceCardConnected: { borderColor: "#27ae60", backgroundColor: "#f0fff4" },
  deviceName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  deviceAddr: { fontSize: 12, color: "#888" },
  connectedBadge: { color: "#27ae60", fontWeight: "bold" },
  connectBtn: { color: "#2980b9", fontWeight: "bold" },
  testBtn: {
    backgroundColor: "#27ae60", borderRadius: 8,
    paddingVertical: 12, alignItems: "center", marginTop: 12,
  },
  testBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
