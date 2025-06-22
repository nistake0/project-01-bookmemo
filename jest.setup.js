import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// firebase.jsをモック化して、import.meta.envエラーを回避
jest.mock('./src/firebase', () => ({
  db: jest.fn(),
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-user-id' }); // 常にログイン状態を返す
      return jest.fn(); // unsubscribe関数
    }),
  },
}));

// navigator.mediaDevices.getUserMedia をモック化
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }],
  }),
};

// @zxing/library をモック化
jest.mock('@zxing/library', () => {
  const originalModule = jest.requireActual('@zxing/library');
  return {
    ...originalModule,
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
      decodeFromVideoDevice: jest.fn((deviceId, videoElement, callback) => {
        // テストコード側でスキャン結果をシミュレートできるように、
        // videoElementに属性を持たせておく
        const barcode = videoElement.getAttribute('data-test-barcode');
        if (barcode) {
          callback({ getText: () => barcode }, null);
        }
        const error = videoElement.getAttribute('data-test-error');
        if (error) {
          callback(null, new Error(error));
        }
        return Promise.resolve({ stop: jest.fn() });
      }),
      reset: jest.fn(),
    })),
  };
}); 