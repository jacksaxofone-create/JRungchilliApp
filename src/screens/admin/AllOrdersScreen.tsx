import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { DatabaseService } from '../../services/database';

export const AllOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DatabaseService.getOrdersToday()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" color="#e67e22" />
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.header}>🗂️ ออเดอร์วันนี้ ({orders.length} รายการ)</Text>
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding:12, gap:8 }}
        ListEmptyComponent={
          <View style={{ alignItems:'center', padding:48 }}>
            <Text style={{ fontSize:40 }}>📭</Text>
            <Text style={{ color:'#9ca3af', marginTop:8 }}>ยังไม่มีออเดอร์วันนี้</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.orderNum}>#{item.order_number}</Text>
            <Text style={s.customer}>🏪 {item.customer_name || 'ลูกค้าทั่วไป'}</Text>
            <Text style={s.total}>฿{(item.total || 0).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#f5f5f5' },
  header:     { fontSize:16, fontWeight:'bold', color:'#2c3e50',
                padding:16, backgroundColor:'#fff', elevation:1 },
  card:       { backgroundColor:'#fff', borderRadius:10, padding:14, elevation:2 },
  orderNum:   { fontSize:15, fontWeight:'bold', color:'#e67e22' },
  customer:   { fontSize:13, color:'#7f8c8d', marginTop:4 },
  total:      { fontSize:16, fontWeight:'bold', color:'#27ae60', marginTop:4 },
});

export default AllOrdersScreen;