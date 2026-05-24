import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";
import { CHILLI, FONT, SPACE, RADIUS, shadow } from "../../core/theme";
import PrinterService from "../../core/hardware/PrinterService";

export default function PrinterSettingsScreen({ navigation }: any) {
  const { lang, printerAddress, setPrinterAddress, setPrinterConnected, printerConnected } = useAppStore();
  const [scanning, setScanning]   = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testing, setTesting]     = useState(false);
  const [devices, setDevices]     = useState<{ name: string; address: string }[]>([]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setDevices([]);
    try {
      const found = await PrinterService.getInstance().scanDevices();
      if (found.length === 0) {
        Alert.alert('🔍', lang === 'th' ? 'ไม่พบอุปกรณ์ Bluetooth\nตรวจสอบว่าเปิด Bluetooth แล้ว' : 'No Bluetooth devices found');
      }
      setDevices(found);
    } catch (e) {
      Alert.alert('❌', String(e));
    } finally {
      setScanning(false);
    }
  }, [lang]);

  const handleConnect = useCallback(async (address: string, name: string) => {
    setConnecting(address);
    try {
      const ok = await PrinterService.getInstance().connect(address);
      if (ok) {
        setPrinterAddress(address);
        DB.setSetting('printer_address', address);
        setPrinterConnected(true);
        Alert.alert('✅', `${lang === 'th' ? 'เชื่อมต่อสำเร็จ' : 'Connected'}: ${name}`);
      } else {
        setPrinterConnected(false);
        Alert.alert('❌', lang === 'th' ? 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่' : 'Connection failed, please try again');
      }
    } catch (e) {
      setPrinterConnected(false);
      Alert.alert('❌', String(e));
    } finally {
      setConnecting(null);
    }
  }, [lang, setPrinterAddress, setPrinterConnected]);

  const handleDisconnect = useCallback(async () => {
    try {
      await PrinterService.getInstance().disconnect();
      setPrinterConnected(false);
      setPrinterAddress('');
      DB.setSetting('printer_address', '');
      Alert.alert('🔌', lang === 'th' ? 'ยกเลิกการเชื่อมต่อแล้ว' : 'Disconnected');
    } catch (e) {
      Alert.alert('❌', String(e));
    }
  }, [lang, setPrinterAddress, setPrinterConnected]);

  const handleTestPrint = useCallback(async () => {
    if (!printerConnected) {
      Alert.alert('⚠️', lang === 'th' ? 'กรุณาเชื่อมต่อเครื่องพิมพ์ก่อน' : 'Please connect printer first');
      return;
    }
    setTesting(true);
    try {
      const ok = await PrinterService.getInstance().printSticker({
        shopName: 'JRung Chilli',
        productName: 'TEST PRINT',
        weight: 1.000,
        unitPrice: 50,
        totalPrice: 50,
        priceType: 'retail',
        date: new Date().toLocaleDateString('th-TH'),
        orderNumber: 'TEST001',
      });
      if (ok) {
        Alert.alert('✅', lang === 'th' ? 'พิมพ์ทดสอบสำเร็จ' : 'Test print OK');
      }
    } catch (e) {
      Alert.alert('❌', String(e));
    } finally {
      setTesting(false);
    }
  }, [printerConnected, lang]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>🏠 BACK</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🖨️ {t('printer','th')}{lang !== 'th' ? ` / ${t('printer',lang)}` : ''}</Text>
        <View style={{ width: 70 }} />
      </View>

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Status Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📡 {lang === 'th' ? 'สถานะ' : 'Status'}</Text>
              <View style={s.statusRow}>
                <View style={[s.dot, { backgroundColor: printerConnected ? '#27ae60' : '#e74c3c' }]} />
                <Text style={[s.statusTxt, { color: printerConnected ? '#27ae60' : '#e74c3c' }]}>
                  {printerConnected
                    ? (lang === 'th' ? '● เชื่อมต่อแล้ว' : '● Connected') + (printerAddress ? `\n${printerAddress}` : '')
                    : (lang === 'th' ? '● ยังไม่ได้เชื่อมต่อ' : '● Not connected')}
                </Text>
              </View>
              {printerConnected && (
                <View style={s.btnRow}>
                  <TouchableOpacity style={[s.btn, s.btnTest]} onPress={handleTestPrint} disabled={testing}>
                    {testing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.btnTxt}>🖨️ {lang === 'th' ? 'ทดสอบพิมพ์' : 'Test Print'}</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btn, s.btnDisconnect]} onPress={handleDisconnect}>
                    <Text style={s.btnTxt}>🔌 {lang === 'th' ? 'ยกเลิก' : 'Disconnect'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Scan Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🔍 {lang === 'th' ? 'ค้นหาเครื่องพิมพ์' : 'Scan Printers'}</Text>
              <TouchableOpacity style={[s.btn, s.btnScan]} onPress={handleScan} disabled={scanning}>
                {scanning
                  ? <><ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} /><Text style={s.btnTxt}>{lang === 'th' ? 'กำลังค้นหา...' : 'Scanning...'}</Text></>
                  : <Text style={s.btnTxt}>🔍 {lang === 'th' ? 'ค้นหาอุปกรณ์ Bluetooth' : 'Scan Bluetooth Devices'}</Text>
                }
              </TouchableOpacity>
              {devices.length > 0 && (
                <Text style={s.foundTxt}>{lang === 'th' ? `พบ ${devices.length} อุปกรณ์` : `Found ${devices.length} device(s)`}</Text>
              )}
            </View>

            {devices.length > 0 && (
              <Text style={s.listTitle}>📋 {lang === 'th' ? 'อุปกรณ์ที่พบ' : 'Found Devices'}</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[s.deviceCard, printerAddress === item.address && s.deviceCardActive]}>
            <View style={s.deviceInfo}>
              <Text style={s.deviceName}>{item.name || 'Unknown Device'}</Text>
              <Text style={s.deviceAddr}>{item.address}</Text>
            </View>
            <TouchableOpacity
              style={[s.btn, s.btnConnect, printerAddress === item.address && printerConnected && s.btnConnected]}
              onPress={() => handleConnect(item.address, item.name)}
              disabled={connecting === item.address}
            >
              {connecting === item.address
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnTxt}>
                    {printerAddress === item.address && printerConnected
                      ? (lang === 'th' ? '✅ เชื่อมต่อแล้ว' : '✅ Connected')
                      : (lang === 'th' ? '🔗 เชื่อมต่อ' : '🔗 Connect')}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>ℹ️ {lang === 'th' ? 'วิธีใช้งาน' : 'Instructions'}</Text>
            <Text style={s.infoTxt}>1. {lang === 'th' ? 'เปิดเครื่องพิมพ์และเปิด Bluetooth' : 'Turn on printer and enable Bluetooth'}</Text>
            <Text style={s.infoTxt}>2. {lang === 'th' ? 'กด "ค้นหาอุปกรณ์ Bluetooth"' : 'Tap "Scan Bluetooth Devices"'}</Text>
            <Text style={s.infoTxt}>3. {lang === 'th' ? 'เลือกเครื่องพิมพ์แล้วกด "เชื่อมต่อ"' : 'Select printer and tap "Connect"'}</Text>
            <Text style={s.infoTxt}>4. {lang === 'th' ? 'กด "ทดสอบพิมพ์" เพื่อตรวจสอบ' : 'Tap "Test Print" to verify'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: CHILLI.bg },
  scroll:            { paddingBottom: 40, paddingHorizontal: SPACE.md },
  header:            { flexDirection:'row', alignItems:'center', backgroundColor: CHILLI.dark,
                       paddingHorizontal: SPACE.md, paddingVertical: 10, justifyContent:'space-between' },
  backBtn:           { paddingVertical: 6, paddingHorizontal: 4 },
  backTxt:           { color:'#fff', fontSize: FONT.sm, fontWeight:'600' },
  headerTitle:       { color:'#fff', fontSize: FONT.md, fontWeight:'800' },
  card:              { backgroundColor:'#fff', borderRadius: RADIUS.md, padding: SPACE.md,
                       marginTop: SPACE.md, ...shadow },
  cardTitle:         { fontSize: FONT.md, fontWeight:'700', color: CHILLI.dark, marginBottom: SPACE.sm },
  statusRow:         { flexDirection:'row', alignItems:'flex-start', gap: SPACE.sm,
                       backgroundColor: CHILLI.bg, borderRadius: RADIUS.sm, padding: SPACE.sm },
  dot:               { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  statusTxt:         { fontSize: FONT.sm, fontWeight:'600', flex: 1 },
  btnRow:            { flexDirection:'row', gap: SPACE.sm, marginTop: SPACE.sm },
  btn:               { flex: 1, flexDirection:'row', alignItems:'center', justifyContent:'center',
                       borderRadius: RADIUS.sm, paddingVertical: 10, paddingHorizontal: SPACE.sm },
  btnTxt:            { color:'#fff', fontWeight:'700', fontSize: FONT.sm },
  btnScan:           { backgroundColor: CHILLI.primary, marginTop: SPACE.xs },
  btnTest:           { backgroundColor: CHILLI.orange },
  btnDisconnect:     { backgroundColor: '#e74c3c' },
  btnConnect:        { backgroundColor: CHILLI.primary, flex: 0, paddingHorizontal: SPACE.md },
  btnConnected:      { backgroundColor: '#27ae60' },
  foundTxt:          { marginTop: SPACE.xs, color: CHILLI.muted, fontSize: FONT.xs },
  listTitle:         { marginTop: SPACE.md, marginBottom: SPACE.xs, fontSize: FONT.md,
                       fontWeight:'700', color: CHILLI.dark },
  deviceCard:        { backgroundColor:'#fff', borderRadius: RADIUS.md, padding: SPACE.md,
                       marginTop: SPACE.sm, flexDirection:'row', alignItems:'center',
                       justifyContent:'space-between', ...shadow },
  deviceCardActive:  { borderWidth: 2, borderColor: CHILLI.primary },
  deviceInfo:        { flex: 1, marginRight: SPACE.sm },
  deviceName:        { fontSize: FONT.md, fontWeight:'700', color: CHILLI.dark },
  deviceAddr:        { fontSize: FONT.xs, color: CHILLI.muted, marginTop: 2 },
  infoCard:          { backgroundColor:'#fff', borderRadius: RADIUS.md, padding: SPACE.md,
                       marginTop: SPACE.md, ...shadow },
  infoTitle:         { fontSize: FONT.md, fontWeight:'700', color: CHILLI.dark, marginBottom: SPACE.sm },
  infoTxt:           { fontSize: FONT.sm, color: CHILLI.dark, lineHeight: 24, marginBottom: 2 },
});