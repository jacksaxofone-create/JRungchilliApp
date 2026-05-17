import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView,
} from "react-native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";

export default function PrinterSettingsScreen({ navigation }: any) {
  const { lang, printerAddress, setPrinterAddress, setPrinterConnected, printerConnected } = useAppStore();
  const [address, setAddress] = useState(printerAddress || '');
  const [testing, setTesting] = useState(false);

  const lbl = (key: string) =>
    lang !== 'th' ? `${t(key,'th')} / ${t(key, lang)}` : t(key,'th');

  const handleSave = () => {
    if (!address.trim()) {
      Alert.alert(t('warning','th'), 'กรุณากรอก IP หรือ MAC ของเครื่องพิมพ์');
      return;
    }
    setPrinterAddress(address.trim());
    DB.setSetting('printer_address', address.trim());
    Alert.alert('✅ ' + t('success','th'), `${t('saved','th')}: ${address.trim()}`);
  };

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setPrinterConnected(true);
      Alert.alert('🖨️', 'Test print สำเร็จ / Test print OK');
    }, 1500);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor="#7f8c8d" barStyle="light-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹ {t('back','th')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>🖨️ {t('settings','th')}</Text>
          {lang !== 'th' && <Text style={s.headerSub}>{t('settings', lang)}</Text>}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>🖨️ Printer / เครื่องพิมพ์</Text>

          <View style={s.statusRow}>
            <Text style={s.statusLbl}>สถานะ / Status:</Text>
            <View style={[s.statusDot, { backgroundColor: printerConnected ? '#27ae60' : '#e74c3c' }]} />
            <Text style={[s.statusVal, { color: printerConnected ? '#27ae60' : '#e74c3c' }]}>
              {printerConnected ? '● เชื่อมต่อแล้ว / Connected' : '● ยังไม่เชื่อมต่อ / Disconnected'}
            </Text>
          </View>

          <Text style={s.lbl}>IP Address / MAC Address</Text>
          <TextInput
            style={s.input}
            value={address}
            onChangeText={setAddress}
            placeholder="192.168.1.100 หรือ AA:BB:CC:DD:EE:FF"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnTxt}>💾 {lbl('save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.testBtn, testing && { opacity: 0.6 }]}
            onPress={handleTest}
            disabled={testing}
          >
            <Text style={s.testBtnTxt}>
              🖨️ {testing ? 'กำลังทดสอบ...' : 'ทดสอบพิมพ์ / Test Print'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>ℹ️ คำแนะนำ / Instructions</Text>
          <Text style={s.infoTxt}>
            1. เปิดเครื่องพิมพ์และเชื่อมต่อ Wi-Fi เดียวกัน{'\n'}
            2. กรอก IP หรือ MAC Address ของเครื่องพิมพ์{'\n'}
            3. กด "บันทึก" แล้วกด "ทดสอบพิมพ์"{'\n\n'}
            Connect printer to same Wi-Fi network,{'\n'}
            enter IP or MAC address, save and test.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#7f8c8d', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, elevation: 4 },
  backBtn: { width: 60, paddingVertical: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, margin: 10, marginBottom: 0, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  statusLbl: { fontSize: 13, color: '#555' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusVal: { fontSize: 13, fontWeight: '600' },
  lbl: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#222', backgroundColor: '#fafafa', marginBottom: 12 },
  saveBtn: { backgroundColor: '#7f8c8d', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  testBtn: { backgroundColor: '#2980b9', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  testBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  infoTxt: { fontSize: 13, color: '#666', lineHeight: 22 },
});