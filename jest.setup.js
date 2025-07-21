import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// React Testing Libraryの設定
import { configure } from '@testing-library/react';

// act()警告を抑制するための設定
configure({
  asyncUtilTimeout: 10000,
  // 非同期処理の警告を抑制
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    return error;
  },
});

// コンソールエラーを抑制（開発中の警告のみ）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // act()関連の警告を抑制
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('was not wrapped in act') ||
       args[0].includes('The current testing environment is not configured to support act') ||
       args[0].includes('You seem to have overlapping act() calls'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// グローバルFirebase モック
jest.mock('./src/firebase', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  },
}));

// グローバルFirestore モック
jest.mock('firebase/firestore', () => {
  const mockCollectionRef = { id: 'books' };
  const mockDocRef = { id: 'test-doc-id' };
  
  return {
    // コレクション関連
    collection: jest.fn(() => mockCollectionRef),
    doc: jest.fn(() => mockDocRef),
    
    // クエリ関連
    query: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    limit: jest.fn(() => ({})),
    startAfter: jest.fn(() => ({})),
    
    // データ取得
    getDocs: jest.fn(() => Promise.resolve({
      docs: [
        { id: 'doc1', data: () => ({ title: 'テスト本1' }) },
        { id: 'doc2', data: () => ({ title: 'テスト本2' }) },
      ],
      forEach: jest.fn((callback) => {
        const docs = [
          { data: () => ({ tag: '小説' }) },
          { data: () => ({ tag: '技術書' }) },
        ];
        docs.forEach(callback);
      }),
    })),
    getDoc: jest.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({ title: 'テスト本' }),
    })),
    
    // データ書き込み
    addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    
    // タイムスタンプ
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    
    // リアルタイムリスナー
    onSnapshot: jest.fn(() => jest.fn()),
  };
});

// グローバルAuth モック
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-user-id' } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-user-id' } })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

// グローバルAuthProvider モック
jest.mock('./src/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// グローバルモックは削除 - テストヘルパーで統一する

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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

const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response; 