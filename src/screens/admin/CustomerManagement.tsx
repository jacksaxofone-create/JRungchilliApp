import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../../services/database';

export const CustomerManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    try {
      const list = await DatabaseService.getAllCustomers();
      setCustomers(list);
    } catch(e) { Alert.alert('❌','โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  if (loading) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" color="#14532d" />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>👥 ลูกค้าทั้งหมด ({customers.length})</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddCustomer')}>
          <Text style={s.addBtnText}>➕ เพิ่ม</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={customers}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems:'center', padding: 48 }}>
            <Text style={{ fontSize:40 }}>👤</Text>
            <Text style={{ color:'#9ca3af', marginTop:8, fontSize:15 }}>ยังไม่มีลูกค้า</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}
            onPress={() => navigation.navigate('AddCustomer', { customer: item })}>
            <Text style={s.shopName}>🏪 {item.name}</Text>
            <Text style={s.phone}>📞 {item.phone || '—'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f5f5f5' },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
               backgroundColor:'#14532d', padding:16 },
  title:     { color:'#fff', fontSize:16, fontWeight:'bold' },
  addBtn:    { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:8,
               paddingHorizontal:12, paddingVertical:6 },
  addBtnText:{ color:'#fff', fontWeight:'bold' },
  card:      { backgroundColor:'#fff', borderRadius:10, padding:14, elevation:2 },
  shopName:  { fontSize:15, fontWeight:'bold', color:'#2c3e50' },
  phone:     { fontSize:13, color:'#7f8c8d', marginTop:4 },
});

export default CustomerManagement;