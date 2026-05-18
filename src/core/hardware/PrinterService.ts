// @ts-nocheck
/**
 * PrinterService.ts
 * VOZY U8 Thermal Label Printer via Bluetooth (TSC Command)
 * Label Size: 60mm x 40mm (มาตรฐานห้างสรรพสินค้า)
 */

import {
  BluetoothManager,
  BluetoothTscPrinter,
} from "@brooons/react-native-bluetooth-escpos-printer";
import { Alert, PermissionsAndroid, Platform } from "react-native";

export interface StickerData {
  shopName: string;       // ชื่อร้าน
  productName: string;    // ชื่อสินค้า
  weight: number;         // น้ำหนัก กก.
  unitPrice: number;      // ราคาต่อกก.
  totalPrice: number;     // ราคารวม
  priceType: string;      // ปลีก/ส่ง
  date: string;           // วันที่
  orderNumber?: string;   // เลขที่ใบเสร็จ
}

export interface ReceiptData {
  shopName: string;
  orderNumber: string;
  customerName: string;
  items: {
    name: string;
    weight: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  payMethod: string;
  cashReceived?: number;
  change?: number;
  date: string;
  note?: string;
}

class PrinterService {
  private static instance: PrinterService;
  private connectedAddress: string | null = null;
  private isConnected: boolean = false;

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  // ขอ Permission Bluetooth
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(granted).every(
        (v) => v === PermissionsAndroid.RESULTS.GRANTED
      );
      return allGranted;
    } catch (e) {
      console.error("Permission error:", e);
      return false;
    }
  }

  // สแกนหาเครื่องพิมพ์
  async scanDevices(): Promise<{ name: string; address: string }[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      Alert.alert("⚠️", "กรุณาอนุญาต Bluetooth Permission");
      return [];
    }
    return new Promise((resolve) => {
      const devices: { name: string; address: string }[] = [];
      BluetoothManager.enableBluetooth().then((paired: string[]) => {
        if (paired && paired.length > 0) {
          for (const d of paired) {
            try {
              const parsed = JSON.parse(d);
              devices.push({ name: parsed.name || "Unknown", address: parsed.address });
            } catch {}
          }
        }
      }).catch(console.error);

      BluetoothManager.scanDevices().then((result: string) => {
        try {
          const r = JSON.parse(result);
          const all = [...(r.paired || []), ...(r.found || [])];
          for (const d of all) {
            if (!devices.find((x) => x.address === d.address)) {
              devices.push({ name: d.name || "Unknown", address: d.address });
            }
          }
        } catch {}
        resolve(devices);
      }).catch(() => resolve(devices));
    });
  }

  // เชื่อมต่อเครื่องพิมพ์
  async connect(address: string): Promise<boolean> {
    try {
      await BluetoothManager.connect(address);
      this.connectedAddress = address;
      this.isConnected = true;
      return true;
    } catch (e) {
      console.error("Connect printer error:", e);
      this.isConnected = false;
      return false;
    }
  }

  // ยกเลิกการเชื่อมต่อ
  async disconnect(): Promise<void> {
    try {
      if (this.connectedAddress) {
        await BluetoothManager.connect(this.connectedAddress);
      }
    } catch {}
    this.isConnected = false;
    this.connectedAddress = null;
  }

  /**
   * พิมพ์สติ๊กเกอร์ขนาด 60x40mm (มาตรฐานห้างสรรพสินค้า)
   * Layout:
   * +------------------------------------------+
   * | เจรุ่งชิลลี่ • Mae Sot          [วันที่] |
   * | ชื่อสินค้า (ตัวใหญ่)                      |
   * | น้ำหนัก: X.XXX กก.   ราคา/กก: ฿XX       |
   * | ============================               |
   * | ราคารวม  ฿ XXX.XX (ตัวใหญ่มาก)           |
   * | [ปลีก/ส่ง]                    [Barcode]  |
   * +------------------------------------------+
   */
  async printSticker(data: StickerData): Promise<boolean> {
    if (!this.isConnected) {
      Alert.alert("⚠️", "กรุณาเชื่อมต่อเครื่องพิมพ์ก่อน");
      return false;
    }
    try {
      // Label 60mm x 40mm, gap 3mm
      // VOZY U8 @ 203dpi: 60mm = ~480 dots, 40mm = ~320 dots
      const labelW = 60;
      const labelH = 40;
      const gap = 3;

      const options = {
        width: labelW,
        height: labelH,
        gap: gap,
        direction: BluetoothTscPrinter.DIRECTION.FORWARD,
        reference: [0, 0],
        tear: BluetoothTscPrinter.TEAR.ON,
        sound: 0,
        text: [
          // แถว 1: ชื่อร้าน
          {
            text: "JRungChilli • Mae Sot",
            x: 10,
            y: 5,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // วันที่ (มุมขวา)
          {
            text: data.date,
            x: 270,
            y: 5,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // เส้นคั่น
          {
            text: "------------------------------------------------",
            x: 5,
            y: 35,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // ชื่อสินค้า (ตัวใหญ่)
          {
            text: data.productName,
            x: 10,
            y: 55,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_2,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_2,
          },
          // น้ำหนัก
          {
            text: `Wt: ${data.weight.toFixed(3)} kg`,
            x: 10,
            y: 105,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // ราคาต่อกก.
          {
            text: `@${data.unitPrice}/kg`,
            x: 220,
            y: 105,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // เส้นคั่น
          {
            text: "------------------------------------------------",
            x: 5,
            y: 128,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
          // ราคารวม (ตัวใหญ่มาก — จุดเด่นสุด)
          {
            text: `B ${data.totalPrice.toFixed(2)}`,
            x: 60,
            y: 145,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_3,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_3,
          },
          // ประเภทราคา
          {
            text: `[${data.priceType === "retail" ? "Retail" : "Wholesale"}]`,
            x: 10,
            y: 215,
            fonttype: BluetoothTscPrinter.FONTTYPE.SIMPLIFIED_CHINESE,
            rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
            xscal: BluetoothTscPrinter.FONTMUL.MUL_1,
            yscal: BluetoothTscPrinter.FONTMUL.MUL_1,
          },
        ],
        barcode: data.orderNumber
          ? [
              {
                x: 220,
                y: 195,
                type: BluetoothTscPrinter.BARCODETYPE.CODE128,
                height: 40,
                readable: 0,
                rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
                code: data.orderNumber.slice(0, 12),
                wide: 2,
                narrow: 2,
              },
            ]
          : [],
        qrcode: [],
        image: [],
      };

      await BluetoothTscPrinter.printLabel(options);
      return true;
    } catch (e) {
      console.error("printSticker error:", e);
      Alert.alert("❌", "พิมพ์สติ๊กเกอร์ไม่สำเร็จ: " + String(e));
      return false;
    }
  }

  /**
   * พิมพ์ใบเสร็จ (ESC/POS Mode — เพื่อออกใบเสร็จรวม)
   * ใช้กระดาษม้วนของ VOZY U8 ในโหมด receipt
   */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      Alert.alert("⚠️", "กรุณาเชื่อมต่อเครื่องพิมพ์ก่อน");
      return false;
    }
    try {
      const { BluetoothEscposPrinter } = require("@brooons/react-native-bluetooth-escpos-printer");
      const opts = { encoding: "UTF8", codepage: 255, widthtimes: 0, heigthtimes: 0, fonttype: 0 };

      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("================================\n\r", opts);
      await BluetoothEscposPrinter.printText("   JRungChilli • Mae Sot\n\r", { ...opts, widthtimes: 1, heigthtimes: 1 });
      await BluetoothEscposPrinter.printText(`${data.date}\n\r`, opts);
      await BluetoothEscposPrinter.printText("================================\n\r", opts);

      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Order: ${data.orderNumber}\n\r`, opts);
      await BluetoothEscposPrinter.printText(`Customer: ${data.customerName}\n\r`, opts);
      await BluetoothEscposPrinter.printText("--------------------------------\n\r", opts);

      // รายการสินค้า
      for (const item of data.items) {
        await BluetoothEscposPrinter.printText(`${item.name}\n\r`, opts);
        await BluetoothEscposPrinter.printColumn(
          [14, 8, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          [`${item.weight}kg x B${item.unitPrice}`, "", `B${item.total.toFixed(2)}`],
          opts
        );
      }

      await BluetoothEscposPrinter.printText("================================\n\r", opts);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);

      if (data.discount > 0) {
        await BluetoothEscposPrinter.printText(`Subtotal: B${data.subtotal.toFixed(2)}\n\r`, opts);
        await BluetoothEscposPrinter.printText(`Discount: -B${data.discount.toFixed(2)}\n\r`, opts);
      }

      await BluetoothEscposPrinter.printText(`TOTAL: B${data.total.toFixed(2)}\n\r`, { ...opts, widthtimes: 1, heigthtimes: 1 });

      if (data.payMethod === "cash" && data.cashReceived !== undefined) {
        await BluetoothEscposPrinter.printText(`Cash: B${data.cashReceived.toFixed(2)}\n\r`, opts);
        await BluetoothEscposPrinter.printText(`Change: B${(data.change || 0).toFixed(2)}\n\r`, opts);
      } else {
        await BluetoothEscposPrinter.printText("Payment: Transfer\n\r", opts);
      }

      if (data.note) {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Note: ${data.note}\n\r`, opts);
      }

      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("================================\n\r", opts);
      await BluetoothEscposPrinter.printText("Thank you!\n\r", opts);
      await BluetoothEscposPrinter.printAndFeed(3);

      return true;
    } catch (e) {
      console.error("printReceipt error:", e);
      Alert.alert("❌", "พิมพ์ใบเสร็จไม่สำเร็จ: " + String(e));
      return false;
    }
  }
}

export default PrinterService;
