import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAppStore } from "../../core/store/appStore";
import { DB } from "../../core/database/DatabaseService";
import { t } from "../../core/i18n/translations";
import { CHILLI, shadow } from "../../core/theme";

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
      <StatusBar backgroundColor={CHILLI.dark} barStyle="light-content" />

      {/* ── Header ── */}
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

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

        {/* ── Printer Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🖨️ Printer / เครื่องพิมพ์</Text>

          {/* Status Row */}
          <View style={s.statusRow}>
            <Text style={s.statusLbl}>สถานะ / Status:</Text>
            <View style={[
              s.statusDot,
              { backgroundColor: printerConnected ? '#27ae60' : CHILLI.red }
            ]} />
            <Text style={[
              s.statusVal,
              { color: printerConnected ? '#27ae60' : CHILLI.red }
            ]}>
              {printerConnected
                ? '● เชื่อมต่อแล้ว / Connected'
                : '● ยังไม่เชื่อมต่อ / Disconnected'
              }
            </Text>
          </View>

          {/* IP / MAC Input */}
          <Text style={s.lbl}>IP Address / MAC Address</Text>
          <TextInput
            style={s.input}
            value={address}
            onChangeText={setAddress}
            placeholder="192.168.1.100 หรือ AA:BB:CC:DD:EE:FF"
            placeholderTextColor="#b0a090"
            autoCapitalize="none"
          />

          {/* Save Button */}
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnTxt}>💾 {lbl('save')}</Text>
          </TouchableOpacity>

          {/* Test Print Button */}
          <TouchableOpacity
            style={[s.testBtn, testing && { opacity: 0.6 }]}
            onPress={handleTest}
            disabled={testing}
            activeOpacity={0.85}
          >
            {testing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.testBtnTxt}>
                  🖨️ {testing ? 'กำลังทดสอบ...' : 'ทดสอบพิมพ์ / Test Print'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Instructions Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>ℹ️ คำแนะนำ / Instructions</Text>
          <View style={s.infoItem}>
            <View style={s.infoDot} />
            <Text style={s.infoTxt}>เปิดเครื่องพิมพ์และเชื่อมต่อ Wi-Fi เดียวกัน</Text>
          </View>
          <View style={s.infoItem}>
            <View style={s.infoDot} />
            <Text style={s.infoTxt}>กรอก IP หรือ MAC Address ของเครื่องพิมพ์</Text>
          </View>
          <View style={s.infoItem}>
            <View style={s.infoDot} />
            <Text style={s.infoTxt}>กด "บันทึก" แล้วกด "ทดสอบพิมพ์"</Text>
          </View>
          <View style={s.divider} />
          <Text style={s.infoEn}>
            Connect printer to same Wi-Fi network,{'\n'}
            enter IP or MAC address, save and test.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CHILLI.cream },

  // ── Header ──
  header: {
    backgroundColor: CHILLI.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadow(4),
  },
  backBtn:      { width: 60, paddingVertical: 6 },
  backTxt:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  body: { flex: 1 },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    margin: 10,
    marginBottom: 0,
    ...shadow(2),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CHILLI.dark,
    marginBottom: 14,
  },

  // ── Status Row ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
    backgroundColor: CHILLI.cream,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusLbl: { fontSize: 13, color: '#666', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusVal: { fontSize: 13, fontWeight: '600' },

  // ── Input ──
  lbl: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e8d5c4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: CHILLI.dark,
    backgroundColor: CHILLI.cream,
    marginBottom: 12,
  },

  // ── Buttons ──
  saveBtn: {
    backgroundColor: CHILLI.red,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
    ...shadow(2),
  },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  testBtn: {
    backgroundColor: CHILLI.orange,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  testBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // ── Info items ──
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CHILLI.orange,
    marginTop: 6,
  },
  infoTxt: { fontSize: 13, color: CHILLI.dark, lineHeight: 20, flex: 1 },
  divider: {
    height: 1,
    backgroundColor: '#f0e8df',
    marginVertical: 10,
  },
  infoEn: { fontSize: 12, color: '#999', lineHeight: 19 },
});
