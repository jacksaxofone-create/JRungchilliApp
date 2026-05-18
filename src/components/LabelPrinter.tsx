// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PrinterService } from '../core/hardware/PrinterService';
import { LabelData } from '../types';
import { useAppStore } from '../core/store/appStore';

interface Props {
  labelData: LabelData;
  disabled?: boolean;
}

export const LabelPrinterButton: React.FC<Props> = ({ labelData, disabled }) => {
  const {
    isPrinterConnected,
    printerDeviceName,
    setPrinterConnected,
    setPrinterDeviceName,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [btDevices, setBtDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const scanPrinters = useCallback(async () => {
    setScanning(true);
    const devices = await PrinterService.scanBluetoothPrinters();
    setBtDevices(devices);
    setScanning(false);
  }, []);

  const connectToPrinter = useCallback(
    async (device: any) => {
      const ok = await PrinterService.connectBluetooth(device.address ?? device.id);
      if (ok) {
        setPrinterConnected(true);
        setPrinterDeviceName(device.name ?? 'VOZY U8');
        setShowModal(false);
        Alert.alert('✅ เชื่อมต่อสำเร็จ', `เครื่องพิมพ์: ${device.name}`);
      } else {
        Alert.alert('❌ เชื่อมต่อไม่ได้', 'กรุณาเปิด Bluetooth และตรวจสอบเครื่องพิมพ์');
      }
    },
    [setPrinterConnected, setPrinterDeviceName],
  );

  const handlePrintPress = () => {
    if (!isPrinterConnected) {
      Alert.alert(
        'ยังไม่ได้เชื่อมต่อเครื่องพิมพ์',
        'ต้องการเชื่อมต่อเครื่องพิมพ์ VOZY U8 ก่อนหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'เชื่อมต่อ', onPress: () => { setShowModal(true); scanPrinters(); } },
        ],
      );
      return;
    }
    setShowConfirm(true);
  };

  const executePrint = async () => {
    setShowConfirm(false);
    setPrinting(true);
    const ok = await PrinterService.printLabel(labelData);
    setPrinting(false);
    if (ok) {
      Alert.alert('✅ พิมพ์สำเร็จ', `สติกเกอร์ออเดอร์ ${labelData.order_number} พิมพ์แล้ว`);
    } else {
      Alert.alert('❌ พิมพ์ไม่สำเร็จ', 'กรุณาตรวจสอบเครื่องพิมพ์และลองใหม่');
    }
  };

  return (
    <View>
      {/* ปุ่มพิมพ์หลัก */}
      <TouchableOpacity
        style={[styles.printBtn, (disabled || printing) && styles.printBtnDisabled]}
        onPress={handlePrintPress}
        disabled={disabled || printing}>
        {printing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.printIcon}>🖨️</Text>
            <View>
              <Text style={styles.printText}>พิมพ์สติกเกอร์</Text>
              {isPrinterConnected && (
                <Text style={styles.printerName}>{printerDeviceName}</Text>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Modal ยืนยันการพิมพ์ */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>🖨️ ยืนยันการพิมพ์</Text>
            <Text style={styles.confirmSubtitle}>สติกเกอร์สำหรับออเดอร์</Text>
            <View style={styles.labelPreview}>
              <Text style={styles.labelLine}>📦 {labelData.product_name_th}</Text>
              <Text style={styles.labelLine}>⚖️ {labelData.weight_kg.toFixed(3)} กก.</Text>
              <Text style={styles.labelLine}>💰 ฿{labelData.total_price.toFixed(2)}</Text>
              <Text style={styles.labelLine}>👤 {labelData.customer_name}</Text>
              <Text style={styles.labelLine}>🔖 #{labelData.order_number}</Text>
            </View>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirm(false)}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={executePrint}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>🖨️ พิมพ์เลย</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal เลือกเครื่องพิมพ์ Bluetooth */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🖨️ เชื่อมต่อเครื่องพิมพ์</Text>
            <Text style={styles.modalSub}>VOZY U8 Thermal Label Printer</Text>
            <TouchableOpacity style={styles.scanBtn} onPress={scanPrinters} disabled={scanning}>
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600' }}>🔍 สแกน Bluetooth</Text>
              )}
            </TouchableOpacity>
            <FlatList
              data={btDevices}
              keyExtractor={item => item.address ?? item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deviceRow}
                  onPress={() => connectToPrinter(item)}>
                  <Text style={{ fontSize: 16 }}>🖨️</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: '600', color: '#14532d' }}>
                      {item.name ?? 'Unknown Printer'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>
                      {item.address ?? item.id}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !scanning ? (
                  <Text style={styles.emptyDevices}>
                    ไม่พบเครื่องพิมพ์{'\n'}กรุณาเปิด Bluetooth และเปิดเครื่องพิมพ์ VOZY U8
                  </Text>
                ) : null
              }
              style={{ maxHeight: 200, marginTop: 8 }}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowModal(false)}>
              <Text style={{ color: '#6b7280' }}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    justifyContent: 'center',
  },
  printBtnDisabled: { backgroundColor: '#9ca3af' },
  printIcon: { fontSize: 20 },
  printText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  printerName: { color: '#ddd6fe', fontSize: 11, marginTop: 2 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  labelPreview: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  labelLine: { fontSize: 14, color: '#374151', lineHeight: 22 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  okBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  scanBtn: {
    backgroundColor: '#15803d',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginTop: 6,
  },
  emptyDevices: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
    lineHeight: 24,
  },
  closeBtn: { marginTop: 12, alignItems: 'center', padding: 8 },
});