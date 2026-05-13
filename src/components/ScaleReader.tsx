import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {ScaleService} from '../services/scaleService';
import {useAppStore} from '../store/appStore';

interface Props {
  onWeightConfirmed: (weight: number) => void;
}

export const ScaleReader: React.FC<Props> = ({onWeightConfirmed}) => {
  const {currentWeight, isScaleConnected, setCurrentWeight, setScaleConnected} =
    useAppStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastReadings, setLastReadings] = useState<number[]>([]);

  const scanDevices = useCallback(async () => {
    setIsScanning(true);
    const found = await ScaleService.listDevices();
    setDevices(found);
    setIsScanning(false);
  }, []);

  const connectToDevice = useCallback(
    async (deviceId: number) => {
      const connected = await ScaleService.connect(deviceId);
      if (connected) {
        setScaleConnected(true);
        ScaleService.startReading(
          (weight, stable) => {
            setCurrentWeight(weight);
            setLastReadings(prev => {
              const updated = [...prev.slice(-4), weight];
              return updated;
            });
          },
          error => {
            console.error('[Scale]', error);
            setScaleConnected(false);
          },
        );
      } else {
        Alert.alert(
          'ข้อผิดพลาด',
          'ไม่สามารถเชื่อมต่อเครื่องชั่งได้\nกรุณาตรวจสอบสายสัญญาณ USB',
        );
      }
    },
    [setCurrentWeight, setScaleConnected],
  );

  const handleConfirmWeight = () => {
    if (currentWeight > 0) {
      onWeightConfirmed(currentWeight);
    } else {
      Alert.alert('แจ้งเตือน', 'ยังไม่มีค่าน้ำหนัก กรุณาวางสินค้าบนเครื่องชั่ง');
    }
  };

  useEffect(() => {
    return () => {
      ScaleService.stopReading();
    };
  }, []);

  const isReadingStable =
    lastReadings.length >= 3 &&
    Math.max(...lastReadings.slice(-3)) -
      Math.min(...lastReadings.slice(-3)) <
      0.005;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚖️ เครื่องชั่ง (USB/RS232)</Text>

      {!isScaleConnected ? (
        <View>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={scanDevices}
            disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>🔍 ค้นหาเครื่องชั่ง USB</Text>
            )}
          </TouchableOpacity>

          <FlatList
            data={devices}
            keyExtractor={item => String(item.deviceId)}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.deviceItem}
                onPress={() => connectToDevice(item.deviceId)}>
                <Text style={styles.deviceName}>
                  🔌 {item.name || `USB Device ${item.deviceId}`}
                </Text>
                <Text style={styles.deviceId}>
                  VID: {item.vendorId} | PID: {item.productId}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isScanning ? (
                <Text style={styles.emptyText}>
                  ไม่พบอุปกรณ์ USB{'\n'}เชื่อมต่อสาย RS232-USB แล้วลองใหม่
                </Text>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={styles.weightDisplay}>
          <View
            style={[
              styles.weightBox,
              isReadingStable && styles.weightBoxStable,
            ]}>
            <Text style={styles.weightValue}>{currentWeight.toFixed(3)}</Text>
            <Text style={styles.weightUnit}>กิโลกรัม</Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.indicator,
                isReadingStable
                  ? styles.indicatorGreen
                  : styles.indicatorYellow,
              ]}
            />
            <Text style={styles.statusText}>
              {isReadingStable ? '✅ ค่าคงที่ (Stable)' : '⏳ กำลังชั่ง...'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !isReadingStable && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirmWeight}>
            <Text style={styles.confirmBtnText}>
              ✓ ยืนยันน้ำหนัก {currentWeight.toFixed(3)} กก.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={() => {
              ScaleService.disconnect();
              setScaleConnected(false);
              setCurrentWeight(0);
            }}>
            <Text style={styles.disconnectText}>ตัดการเชื่อมต่อ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  title: {fontSize: 16, fontWeight: '700', color: '#14532d', marginBottom: 12},
  scanBtn: {
    backgroundColor: '#15803d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {color: '#fff', fontWeight: '600'},
  deviceItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  deviceName: {fontSize: 14, fontWeight: '600', color: '#14532d'},
  deviceId: {fontSize: 12, color: '#6b7280', marginTop: 2},
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 16,
    lineHeight: 22,
  },
  weightDisplay: {alignItems: 'center'},
  weightBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1fae5',
    minWidth: 200,
  },
  weightBoxStable: {borderColor: '#22c55e', backgroundColor: '#f0fdf4'},
  weightValue: {fontSize: 48, fontWeight: '800', color: '#14532d'},
  weightUnit: {fontSize: 18, color: '#6b7280', marginTop: 4},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicator: {width: 10, height: 10, borderRadius: 5},
  indicatorGreen: {backgroundColor: '#22c55e'},
  indicatorYellow: {backgroundColor: '#f59e0b'},
  statusText: {fontSize: 14, color: '#374151'},
  confirmBtn: {
    marginTop: 16,
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmBtnDisabled: {backgroundColor: '#9ca3af'},
  confirmBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  disconnectBtn: {marginTop: 8, padding: 8},
  disconnectText: {color: '#ef4444', fontSize: 13},
});
