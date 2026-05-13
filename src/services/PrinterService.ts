import {
  ReactNativePosPrinter,
  ThermalPrinterDevice,
} from 'react-native-thermal-pos-printer';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export type PrinterConnectionType = 'BLUETOOTH' | 'USB' | 'WIFI';

export interface PrinterInfo {
  name:      string;
  address:   string;
  type:      PrinterConnectionType;
  connected: boolean;
}

export interface StickerData {
  shopName:       string;
  productName:    string;
  productNameSub?: string;
  weightKg:       number;
  pricePerKg:     number;
  totalPrice:     number;
  orderNumber:    string;
  date:           string;
}

export interface ReceiptData {
  shopName:    string;
  orderNumber: string;
  items:       { name: string; qty: number; unit: string; price: number; subtotal: number }[];
  total:       number;
  payStatus:   string;
  date:        string;
  note?:       string;
}

let activePrinter: ThermalPrinterDevice | null = null;
let savedAddress  = '';
let savedType: PrinterConnectionType = 'BLUETOOTH';

export const PrinterService = {

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const sdkInt = parseInt(Platform.Version as string, 10);
      const perms: any[] = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      if (sdkInt >= 31) {
        perms.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }
      if (sdkInt >= 33) {
        perms.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      } else {
        perms.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
      const result = await PermissionsAndroid.requestMultiple(perms);
      return Object.values(result).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch {
      return false;
    }
  },

  async scanDevices(): Promise<PrinterInfo[]> {
    try {
      await ReactNativePosPrinter.init();
      const granted = await this.requestPermissions();
      if (!granted) {
        Alert.alert('⚠️ ไม่ได้รับสิทธิ์',
          'กรุณาอนุญาต Bluetooth/Location ในการตั้งค่า');
        return [];
      }
      const [discovered, paired] = await Promise.all([
        ReactNativePosPrinter.discoverDevices(8000).catch(() => []),
        ReactNativePosPrinter.getDeviceList().catch(() => []),
      ]);
      const all    = [...(discovered as any[]), ...(paired as any[])];
      const unique = Array.from(new Map(all.map(d => [d.address, d])).values());
      return unique.map(d => ({
        name:      d.name      || 'Unknown Printer',
        address:   d.address   || '',
        type:      (d.type     || 'BLUETOOTH') as PrinterConnectionType,
        connected: d.connected || false,
      }));
    } catch (e) {
      console.error('scanDevices error:', e);
      return [];
    }
  },

  async connect(address: string, type: PrinterConnectionType = 'BLUETOOTH'): Promise<boolean> {
    try {
      await ReactNativePosPrinter.init();
      const device = await ReactNativePosPrinter.getDevice(address);
      if (!device) return false;
      await device.connect({ timeout: 8000, encoding: 'UTF-8' });
      activePrinter = device;
      savedAddress  = address;
      savedType     = type;
      return true;
    } catch (e) {
      console.error('connect error:', e);
      activePrinter = null;
      return false;
    }
  },

  async disconnect(): Promise<void> {
    try {
      if (activePrinter) {
        await activePrinter.disconnect();
        activePrinter = null;
      }
    } catch (e) {
      console.error('disconnect error:', e);
    }
  },

  async isConnected(): Promise<boolean> {
    if (!activePrinter) return false;
    try { return await activePrinter.isConnected(); }
    catch { return false; }
  },

  getConnectedInfo(): PrinterInfo | null {
    if (!activePrinter) return null;
    return {
      name:      activePrinter.name    || 'Printer',
      address:   activePrinter.address || savedAddress,
      type:      savedType,
      connected: true,
    };
  },

  async ensureConnected(): Promise<boolean> {
    if (await this.isConnected()) return true;
    if (savedAddress) return await this.connect(savedAddress, savedType);
    return false;
  },

  async printSticker(data: StickerData): Promise<boolean> {
    try {
      const ok = await this.ensureConnected();
      if (!ok || !activePrinter) {
        Alert.alert('🖨️ ไม่ได้เชื่อมต่อปรินเตอร์',
          'กรุณาเชื่อมต่อปรินเตอร์ก่อนพิมพ์\nไปที่ ตั้งค่า > ปรินเตอร์');
        return false;
      }
      const pad = (l: string, r: string, w = 32) =>
        l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r;
      const line = '================================';

      await activePrinter.printText('J.Rung Chilli',
        { align: 'CENTER', size: 24, bold: true });
      await activePrinter.printText('ร้านเจริญชิลลี่',
        { align: 'CENTER', size: 18 });
      await activePrinter.printText(line, { align: 'CENTER' });
      if (data.shopName && data.shopName !== 'ลูกค้าทั่วไป') {
        await activePrinter.printText(`🏪 ${data.shopName}`,
          { align: 'CENTER', bold: true });
      }
      await activePrinter.printText(data.productName,
        { align: 'CENTER', size: 24, bold: true });
      if (data.productNameSub) {
        await activePrinter.printText(data.productNameSub,
          { align: 'CENTER', size: 18 });
      }
      await activePrinter.printText('--------------------------------',
        { align: 'CENTER' });
      await activePrinter.printText(
        pad('น้ำหนัก:', `${data.weightKg.toFixed(3)} kg`));
      await activePrinter.printText(
        pad('ราคา:', `${data.pricePerKg} บาท/kg`));
      await activePrinter.printText('--------------------------------',
        { align: 'CENTER' });
      await activePrinter.printText('รวม / TOTAL',
        { align: 'CENTER', size: 18 });
      await activePrinter.printText(`฿ ${data.totalPrice.toFixed(2)}`,
        { align: 'CENTER', size: 36, bold: true });
      await activePrinter.printText(line, { align: 'CENTER' });
      await activePrinter.printText(`#${data.orderNumber}`,
        { align: 'CENTER' });
      await activePrinter.printText(data.date, { align: 'CENTER' });
      await activePrinter.printText('ขอบคุณที่ใช้บริการ',
        { align: 'CENTER' });
      await activePrinter.printText('\n\n\n');
      await ReactNativePosPrinter.cutPaper();
      return true;
    } catch (e) {
      console.error('printSticker error:', e);
      Alert.alert('❌ พิมพ์ไม่สำเร็จ', 'เกิดข้อผิดพลาดขณะพิมพ์');
      return false;
    }
  },

  async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      const ok = await this.ensureConnected();
      if (!ok || !activePrinter) {
        Alert.alert('🖨️ ไม่ได้เชื่อมต่อปรินเตอร์',
          'กรุณาเชื่อมต่อปรินเตอร์ก่อนพิมพ์');
        return false;
      }
      const pad  = (l: string, r: string, w = 32) =>
        l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r;
      const line = '================================';

      await activePrinter.printText('J.Rung Chilli',
        { align: 'CENTER', size: 24, bold: true });
      await activePrinter.printText('ร้านเจริญชิลลี่', { align: 'CENTER' });
      await activePrinter.printText(line, { align: 'CENTER' });
      await activePrinter.printText(`ออเดอร์ #${data.orderNumber}`,
        { align: 'CENTER', bold: true });
      await activePrinter.printText(`ร้าน: ${data.shopName}`,
        { align: 'CENTER' });
      await activePrinter.printText(`วันที่: ${data.date}`,
        { align: 'CENTER' });
      await activePrinter.printText(line, { align: 'CENTER' });
      for (const item of data.items) {
        await activePrinter.printText(item.name, { bold: true });
        await activePrinter.printText(
          pad(`  ${item.qty}${item.unit} x ฿${item.price}`,
            `฿${item.subtotal.toFixed(2)}`));
      }
      await activePrinter.printText(line, { align: 'CENTER' });
      await activePrinter.printText(
        pad('รวม / TOTAL', `฿${data.total.toFixed(2)}`),
        { bold: true, size: 24 });
      await activePrinter.printText(
        pad('สถานะ', data.payStatus === 'paid' ? '✅ ชำระแล้ว' : '⏳ ค้างชำระ'));
      if (data.note) {
        await activePrinter.printText(line, { align: 'CENTER' });
        await activePrinter.printText(`หมายเหตุ: ${data.note}`);
      }
      await activePrinter.printText('\n');
      await activePrinter.printText('ขอบคุณที่ใช้บริการ', { align: 'CENTER' });
      await activePrinter.printText('\n\n\n');
      await ReactNativePosPrinter.cutPaper();
      return true;
    } catch (e) {
      console.error('printReceipt error:', e);
      Alert.alert('❌ พิมพ์ไม่สำเร็จ', 'เกิดข้อผิดพลาดขณะพิมพ์');
      return false;
    }
  },

  async printPickList(
    items: { name: string; totalKg: number }[],
    date: string
  ): Promise<boolean> {
    try {
      const ok = await this.ensureConnected();
      if (!ok || !activePrinter) {
        Alert.alert('🖨️ ไม่ได้เชื่อมต่อปรินเตอร์',
          'กรุณาเชื่อมต่อปรินเตอร์ก่อนพิมพ์');
        return false;
      }
      const pad  = (l: string, r: string, w = 32) =>
        l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r;
      const line = '================================';

      await activePrinter.printText('MASTER PICK LIST',
        { align: 'CENTER', size: 24, bold: true });
      await activePrinter.printText('ร้านเจริญชิลลี่', { align: 'CENTER' });
      await activePrinter.printText(`วันที่: ${date}`, { align: 'CENTER' });
      await activePrinter.printText(line, { align: 'CENTER' });
      for (let i = 0; i < items.length; i++) {
        await activePrinter.printText(
          pad(`${i + 1}. ${items[i].name}`,
            `${items[i].totalKg.toFixed(1)} กก.`),
          { bold: true });
      }
      await activePrinter.printText(line, { align: 'CENTER' });
      await activePrinter.printText(
        `รวม ${items.length} รายการ`, { align: 'CENTER' });
      await activePrinter.printText('\n\n\n');
      await ReactNativePosPrinter.cutPaper();
      return true;
    } catch (e) {
      console.error('printPickList error:', e);
      return false;
    }
  },

  async testPrint(): Promise<boolean> {
    try {
      const ok = await this.ensureConnected();
      if (!ok || !activePrinter) return false;
      await activePrinter.printText('=== TEST PRINT ===',
        { align: 'CENTER', bold: true, size: 24 });
      await activePrinter.printText('J.Rung Chilli', { align: 'CENTER' });
      await activePrinter.printText('ร้านเจริญชิลลี่', { align: 'CENTER' });
      await activePrinter.printText('ปรินเตอร์ทำงานปกติ ✓', { align: 'CENTER' });
      await activePrinter.printText('Printer OK ✓', { align: 'CENTER' });
      await activePrinter.printText(
        new Date().toLocaleString('th-TH'), { align: 'CENTER' });
      await activePrinter.printText('\n\n\n');
      await ReactNativePosPrinter.cutPaper();
      return true;
    } catch (e) {
      console.error('testPrint error:', e);
      return false;
    }
  },
};

export default PrinterService;