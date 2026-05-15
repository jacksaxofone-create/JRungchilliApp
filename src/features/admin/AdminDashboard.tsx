import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export const AdminDashboard: React.FC<any> = () => (
  <View style={s.c}><Text style={s.t}>🚧 Admin Dashboard\nกำลังพัฒนา...</Text></View>
);
const s = StyleSheet.create({
  c: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f5f5f5' },
  t: { fontSize:18, textAlign:'center', color:'#6b7280' },
});
export default AdminDashboard;