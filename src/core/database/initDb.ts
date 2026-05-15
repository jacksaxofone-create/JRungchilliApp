import { initDB } from './db';

export const initDatabase = async (): Promise<void> => {
  // initDB เป็น sync แต่ wrap ใน Promise เพื่อให้ App.tsx ใช้ await ได้
  return new Promise((resolve, reject) => {
    try {
      initDB();
      resolve();
    } catch (e) {
      console.error('initDatabase error:', e);
      reject(e);
    }
  });
};