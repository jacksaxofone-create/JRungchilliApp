import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

type WeightCallback = (weight: number, stable: boolean) => void;
type ErrorCallback = (error: string) => void;

let weightCallback: WeightCallback | null = null;
let errorCallback: ErrorCallback | null = null;
let isListening = false;
let buffer = '';
let eventSubscription: any = null;

// ใช้ NativeModules แบบ generic เพื่อรองรับทุก library
const SerialPort = NativeModules.RNSerialport || NativeModules.UsbSerialportForAndroid || null;

export const ScaleService = {
  async listDevices(): Promise<any[]> {
    try {
      if (!SerialPort) return [];
      const devices = await SerialPort.list?.() ?? [];
      return devices;
    } catch (e) {
      console.error('[Scale] List devices error:', e);
      return [];
    }
  },

  async connect(deviceId: number, baudRate: number = 9600): Promise<boolean> {
    try {
      if (!SerialPort) {
        console.warn('[Scale] No serial port module found');
        return false;
      }
      await SerialPort.open?.(deviceId, {
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 0,
      });
      console.log('[Scale] Connected via USB Serial');
      return true;
    } catch (e) {
      console.error('[Scale] Connect error:', e);
      return false;
    }
  },

  startReading(onWeight: WeightCallback, onError: ErrorCallback): void {
    weightCallback = onWeight;
    errorCallback = onError;
    isListening = true;

    if (!SerialPort) {
      console.warn('[Scale] Serial port module not available – using mock data');
      // Mock data สำหรับทดสอบเมื่อไม่มี hardware
      const mockInterval = setInterval(() => {
        if (!isListening) { clearInterval(mockInterval); return; }
        const mockWeight = 1.234 + Math.random() * 0.001;
        if (weightCallback) weightCallback(mockWeight, true);
      }, 1000);
      return;
    }

    try {
      const emitter = new NativeEventEmitter(SerialPort);
      eventSubscription = emitter.addListener('onReceived', (data: any) => {
        if (!isListening) return;
        try {
          buffer += data?.data ?? '';
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const parsed = this.parseScaleData(line.trim());
            if (parsed !== null && weightCallback) {
              const stable = !line.includes('US') && !line.includes('UNSTABLE');
              weightCallback(parsed, stable);
            }
          }
        } catch (e) {
          if (errorCallback) errorCallback('Parse error: ' + String(e));
        }
      });
    } catch (e) {
      console.warn('[Scale] Event listener error:', e);
    }
  },

  parseScaleData(raw: string): number | null {
    if (!raw) return null;
    const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
    const match = cleaned.match(/([+-]?\d+\.?\d*)\s*(kg|KG|g|G)?/);
    if (!match) return null;
    let value = parseFloat(match[1]);
    if (isNaN(value)) return null;
    const unit = (match[2] ?? 'kg').toLowerCase();
    if (unit === 'g') value = value / 1000;
    return Math.abs(value);
  },

  stopReading(): void {
    isListening = false;
    weightCallback = null;
    errorCallback = null;
    buffer = '';
    if (eventSubscription) {
      eventSubscription.remove();
      eventSubscription = null;
    }
  },

  async disconnect(): Promise<void> {
    this.stopReading();
    try {
      await SerialPort?.close?.();
    } catch (e) {
      console.warn('[Scale] Disconnect warning:', e);
    }
  },
};
