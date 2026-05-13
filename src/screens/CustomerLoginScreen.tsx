import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { DatabaseService } from '../services/database';

export default function CustomerLoginScreen({ navigation, onLogout }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!password.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const customer = await DatabaseService.getCustomerByPhone(phone.trim(), password.trim());
      if (customer) {
        navigation.navigate('CustomerOrder', { customer });
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogout} style={styles.backBtn}>
            <Text style={styles.backText}>← กลับ</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoBox}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>จ.รุ่งชิลลี่</Text>
          <Text style={styles.subtitle}>เข้าสู่ระบบลูกค้า</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>📞 เบอร์โทรศัพท์</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0XX-XXX-XXXX"
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Text style={styles.label}>🔐 รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="กรอกรหัสผ่าน"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Demo accounts */}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>บัญชีทดสอบ</Text>
          {[
            { name: 'ร้านแม่สอดพริก', phone: '081-234-5678', pass: 'shop001' },
            { name: 'ร้านตลาดริมเมย', phone: '082-345-6789', pass: 'shop002' },
          ].map((d, i) => (
            <TouchableOpacity
              key={i}
              style={styles.demoItem}
              onPress={() => { setPhone(d.phone); setPassword(d.pass); }}
            >
              <Text style={styles.demoName}>{d.name}</Text>
              <Text style={styles.demoInfo}>📞 {d.phone} • 🔑 {d.pass}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: {
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8,
    backgroundColor: '#c0392b',
  },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoBox: { backgroundColor: '#c0392b', alignItems: 'center', paddingBottom: 32, paddingTop: 8 },
  logo: { width: 90, height: 90, resizeMode: 'contain', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  card: {
    backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  loginBtn: {
    backgroundColor: '#c0392b', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24, elevation: 2,
  },
  loginBtnDisabled: { backgroundColor: '#ccc' },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  demoBox: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, elevation: 2,
  },
  demoTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 10 },
  demoItem: {
    backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#eee',
  },
  demoName: { fontSize: 14, fontWeight: '600', color: '#333' },
  demoInfo: { fontSize: 12, color: '#888', marginTop: 2 },
});