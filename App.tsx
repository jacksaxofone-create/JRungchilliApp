import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { DatabaseService } from './src/services/database';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    DatabaseService.init()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Image source={require('./src/assets/logo.png')} style={styles.logo} />
        <ActivityIndicator size="large" color="#c0392b" style={{ marginTop: 24 }} />
        <Text style={styles.text}>กำลังโหลด...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loading: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' },
  logo: { width:150, height:150, resizeMode:'contain' },
  text: { fontSize:16, color:'#c0392b', marginTop:12, fontWeight:'600' },
});