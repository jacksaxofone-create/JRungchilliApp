import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Switch, ScrollView
} from 'react-native';
import { PrinterService, PrinterInfo, PrinterConnectionType } from '../../services/PrinterService';

type TabType = 'bluetooth' | 'usb' | 'wifi';

export const PrinterSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab]       = useState<TabType>('bluetooth');
  const [devices, setDevices]           = useState<PrinterInfo[]>([]);
  const [scanning, setScanning]         = useState(false);
  const [connecting, setConnecting]     = useState('');
  const [connectedInfo, setConnectedInfo] = useState<PrinterInfo | null>(null);
  const [testPrinting, setTestPrinting] = useState(false);
  const [wifiHost, setWifiHost]         = useState('192.168.1.100');
  const [wifiPort, setWifiPort]         = useState('9100');

  useEffect(() => {
    refreshConnectedStatus();
  }, []);

  const refreshConnectedStatus = async () => {
    const info = PrinterService.getConnectedInfo();
    setConnectedInfo(info);
  };

  const scanDevices = useCallback(async () => {
    setScanning(true);
    setDevices([]);
    try {
      const list = await PrinterService.scanDevices();
      const filtered = list.filter(d =>
        activeTab === 'bluetooth'
          ? d.type === 'BLUETOOTH'
          : activeTab === 'usb'
          ? d.type === 'USB'
          : d.type === 'WIFI'
      );
      setDevices(filtered);
      if (filtered.length === 0) {
        Alert.alert(
          '📭 ไม่พบอุปกรณ์',
          activeTab === 'bluetooth'
            ? 'ไม่พบปรินเตอร์ Bluetooth\nตรวจสอบว่าเปิด Bluetooth และจับคู่อุปกรณ์แล้ว'
            : activeTab === 'usb'
            ? 'ไม่พบปรินเตอร์ USB\nตรวจสอบสายต่อ USB'
            : 'ไม่พบปรินเตอร์ WiFi\nตรวจสอบว่าอยู่ในวง LAN เดียวกัน'
        );
      }
    } catch (e) {
      Alert.alert('❌ สแกนไม่สำเร็จ', 'เกิดข้อผิดพลาดขณะสแกน');
    } finally {
      setScanning(false);
    }
  }, [activeTab]);

  const connectDevice = async (device: PrinterInfo) => {
    setConnecting(device.address);
    try {
      const ok = await PrinterService.connect(device.address, device.type);
      if (ok) {
        setConnectedInfo(device);
        Alert.alert('✅ เชื่อมต่อสำเร็จ', `เชื่อมต่อกับ ${device.name} เรียบร้อย`);
      } else {
        Alert.alert('❌ เชื่อมต่อไม่สำเร็จ',
          'ไม่สามารถเชื่อมต่อได้\nตรวจสอบว่าปรินเตอร์เปิดอยู่และอยู่ในระยะ');
      }
    } catch (e) {
      Alert.alert('❌ ผิดพลาด', 'เกิดข้อผิดพลาดขณะเชื่อมต่อ');
    } finally {
      setConnecting('');
    }
  };

  const disconnectPrinter = async () => {
    Alert.alert(
      '🔌 ตัดการเชื่อมต่อ',
      'ต้องการตัดการเชื่อมต่อปรินเตอร์?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ตัดการเชื่อมต่อ', style: 'destructive',
          onPress: async () => {
            await PrinterService.disconnect();
            setConnectedInfo(null);
          }
        }
      ]
    );
  };

  const runTestPrint = async () => {
    setTestPrinting(true);
    try {
      const ok = await PrinterService.testPrint();
      if (ok) Alert.alert('✅ พิมพ์ทดสอบสำเร็จ', 'ปรินเตอร์ทำงานปกติ');
    } finally {
      setTestPrinting(false);
    }
  };

  const TABS: { key: TabType; label: string; icon: string }[] = [
    { key: 'bluetooth', label: 'Bluetooth', icon: '📶' },
    { key: 'usb',       label: 'USB (สาย)', icon: '🔌' },
    { key: 'wifi',      label: 'WiFi/LAN',  icon: '🌐' },
  ];

  const renderDevice = ({ item }: { item: PrinterInfo }) => {
    const isConnected  = connectedInfo?.address === item.address;
    const isConnecting = connecting === item.address;
    return (
      <View style={[styles.deviceCard, isConnected && styles.deviceCardConnected]}>
        <View style={styles.deviceLeft}>
          <Text style={styles.deviceIcon}>
            {item.type === 'BLUETOOTH' ? '📶' : item.type === 'USB' ? '🔌' : '🌐'}
          </Text>
          <View>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceAddress}>{item.address}</Text>
            {isConnected && (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>✅ เชื่อมต่ออยู่</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.deviceRight}>
          {isConnected ? (
            <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectPrinter}>
              <Text style={styles.disconnectBtnText}>ตัดการเชื่อมต่อ</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, isConnecting && styles.connectBtnDisabled]}
              onPress={() => connectDevice(item)}
              disabled={!!connecting}
            >
              {isConnecting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.connectBtnText}>เชื่อมต่อ</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🖨️ ตั้งค่าปรินเตอร์</Text>
      </View>

      <ScrollView>
        {/* Connected Status Card */}
        <View style={[styles.statusCard,
          connectedInfo ? styles.statusCardConnected : styles.statusCardDisconnected]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{connectedInfo ? '🟢' : '🔴'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {connectedInfo ? 'เชื่อมต่อแล้ว / Connected' : 'ยังไม่ได้เชื่อมต่อ / Not Connected'}
              </Text>
              {connectedInfo && (
                <>
                  <Text style={styles.statusName}>{connectedInfo.name}</Text>
                  <Text style={styles.statusAddr}>{connectedInfo.address}</Text>
                  <Text style={styles.statusType}>
                    {connectedInfo.type === 'BLUETOOTH' ? '📶 Bluetooth'
                      : connectedInfo.type === 'USB' ? '🔌 USB'
                      : '🌐 WiFi'}
                  </Text>
                </>
              )}
            </View>
            {connectedInfo && (
              <TouchableOpacity
                style={[styles.testBtn, testPrinting && styles.testBtnDisabled]}
                onPress={runTestPrint}
                disabled={testPrinting}
              >
                {testPrinting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.testBtnText}>🖨️ ทดสอบ</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* How to use guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📖 วิธีเชื่อมต่อ</Text>
          <Text style={styles.guideText}>
            <Text style={styles.guideBold}>Bluetooth: </Text>
            เปิดปรินเตอร์ → จับคู่ใน Settings → กด Scan แล้วเลือกเครื่อง{'\n'}
            <Text style={styles.guideBold}>USB (สาย): </Text>
            เสียบสาย USB OTG → กด Scan แล้วเลือกเครื่อง{'\n'}
            <Text style={styles.guideBold}>WiFi/LAN: </Text>
            ปรินเตอร์ต้องอยู่ในวง WiFi เดียวกัน → กด Scan
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { setActiveTab(tab.key); setDevices([]); }}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
          onPress={scanDevices}
          disabled={scanning}
          activeOpacity={0.85}
        >
          {scanning ? (
            <View style={styles.scanningRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.scanBtnText}>  กำลังสแกน...</Text>
            </View>
          ) : (
            <Text style={styles.scanBtnText}>
              🔍 สแกนหาปรินเตอร์{' '}
              {activeTab === 'bluetooth' ? 'Bluetooth'
                : activeTab === 'usb' ? 'USB'
                : 'WiFi/LAN'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Device List */}
        {devices.length > 0 && (
          <View style={styles.deviceSection}>
            <Text style={styles.deviceSectionTitle}>
              พบ {devices.length} เครื่อง / Found {devices.length} device(s)
            </Text>
            {devices.map((item, idx) => (
              <View key={idx}>{renderDevice({ item })}</View>
            ))}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 เคล็ดลับ / Tips</Text>
          {[
            'ปรินเตอร์ที่รองรับ: Xprinter, Epson TM, Star, Citizen หรือ ESC/POS ทั่วไป',
            'ขนาดกระดาษแนะนำ: 58mm หรือ 80mm',
            'สำหรับ Bluetooth ต้องจับคู่ใน Android Settings ก่อน',
            'สำหรับ USB ต้องใช้สาย OTG (USB-C to USB-A)',
            'หากเชื่อมต่อแล้วพิมพ์ไม่ออก ให้ลองตัดแล้วเชื่อมต่อใหม่',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipText}>• {tip}</Text>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#f5f5f5' },
  header:                 { flexDirection: 'row', alignItems: 'center',
                            backgroundColor: '#c0392b', padding: 16, gap: 12 },
  backBtn:                { padding: 4 },
  backText:               { color: '#fff', fontSize: 15 },
  headerTitle:            { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  statusCard:             { margin: 12, borderRadius: 14, padding: 16, elevation: 3 },
  statusCardConnected:    { backgroundColor: '#eafaf1', borderWidth: 1.5, borderColor: '#27ae60' },
  statusCardDisconnected: { backgroundColor: '#fdecea', borderWidth: 1.5, borderColor: '#e74c3c' },
  statusRow:              { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusIcon:             { fontSize: 28, marginTop: 2 },
  statusTitle:            { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  statusName:             { fontSize: 14, color: '#2c3e50', marginTop: 4 },
  statusAddr:             { fontSize: 12, color: '#7f8c8d' },
  statusType:             { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  testBtn:                { backgroundColor: '#27ae60', borderRadius: 10,
                            paddingHorizontal: 14, paddingVertical: 10 },
  testBtnDisabled:        { backgroundColor: '#95a5a6' },
  testBtnText:            { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  guideCard:              { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
                            borderRadius: 12, padding: 14, elevation: 1 },
  guideTitle:             { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  guideText:              { fontSize: 13, color: '#7f8c8d', lineHeight: 22 },
  guideBold:              { fontWeight: 'bold', color: '#2c3e50' },
  tabRow:                 { flexDirection: 'row', marginHorizontal: 12,
                            backgroundColor: '#fff', borderRadius: 12,
                            padding: 4, elevation: 1, marginBottom: 8 },
  tab:                    { flex: 1, alignItems: 'center', paddingVertical: 10,
                            borderRadius: 10 },
  tabActive:              { backgroundColor: '#c0392b' },
  tabIcon:                { fontSize: 18 },
  tabText:                { fontSize: 12, color: '#7f8c8d', marginTop: 2, fontWeight: '600' },
  tabTextActive:          { color: '#fff' },
  scanBtn:                { backgroundColor: '#2980b9', marginHorizontal: 12, marginBottom: 12,
                            borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  scanBtnDisabled:        { backgroundColor: '#95a5a6' },
  scanBtnText:            { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanningRow:            { flexDirection: 'row', alignItems: 'center' },
  deviceSection:          { marginHorizontal: 12, marginBottom: 8 },
  deviceSectionTitle:     { fontSize: 13, color: '#7f8c8d', marginBottom: 8 },
  deviceCard:             { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                            marginBottom: 8, elevation: 2, flexDirection: 'row',
                            alignItems: 'center', justifyContent: 'space-between' },
  deviceCardConnected:    { borderWidth: 2, borderColor: '#27ae60', backgroundColor: '#f0fff4' },
  deviceLeft:             { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  deviceIcon:             { fontSize: 28 },
  deviceName:             { fontSize: 15, fontWeight: 'bold', color: '#2c3e50' },
  deviceAddress:          { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  connectedBadge:         { backgroundColor: '#27ae60', borderRadius: 6,
                            paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
                            alignSelf: 'flex-start' },
  connectedBadgeText:     { color: '#fff', fontSize: 11, fontWeight: '600' },
  deviceRight:            { marginLeft: 8 },
  connectBtn:             { backgroundColor: '#c0392b', borderRadius: 10,
                            paddingHorizontal: 16, paddingVertical: 10, minWidth: 80,
                            alignItems: 'center' },
  connectBtnDisabled:     { backgroundColor: '#95a5a6' },
  connectBtnText:         { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  disconnectBtn:          { backgroundColor: '#ecf0f1', borderRadius: 10,
                            paddingHorizontal: 12, paddingVertical: 10, minWidth: 80,
                            alignItems: 'center' },
  disconnectBtnText:      { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
  tipsCard:               { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
                            borderRadius: 12, padding: 14, elevation: 1 },
  tipsTitle:              { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  tipText:                { fontSize: 12, color: '#7f8c8d', lineHeight: 20, marginBottom: 2 },
});

export default PrinterSettingsScreen;