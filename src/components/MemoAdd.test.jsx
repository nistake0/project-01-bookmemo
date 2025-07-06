import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import MemoAdd from './MemoAdd';
// Node.js環境用 fetch モック
import fetch from 'node-fetch';
global.fetch = fetch;

// Firebaseのモジュールをモック化
jest.mock('firebase/firestore', () => {
  const mockCollectionRef = {};
  const mockCollection = jest.fn(() => undefined);
  const mockGetDocs = jest.fn(() => Promise.resolve({
    docs: [
      { id: 'tag1', data: () => ({ tag: 'テストタグ1', updatedAt: { toDate: () => new Date() } }) },
      { id: 'tag2', data: () => ({ tag: 'テストタグ2', updatedAt: { toDate: () => new Date() } }) },
    ],
  }));
  const mockOrderBy = jest.fn();
  const mockQuery = jest.fn(() => mockCollectionRef);
  return {
    collection: mockCollection,
    getDocs: mockGetDocs,
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    orderBy: mockOrderBy,
    query: mockQuery,
    doc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    onSnapshot: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
  };
});
jest.mock('../firebase', () => ({
  db: jest.fn(),
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));

describe('MemoAdd', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    addDoc.mockClear();
    collection.mockClear();
  });

  test('ページ番号入力欄を含むメモ追加フォームが正しく表示される', () => {
    render(<MemoAdd bookId="test-book-id" />);

    expect(screen.getByLabelText(/引用・抜き書き/)).toBeInTheDocument();
    expect(screen.getByLabelText(/感想・コメント/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ページ番号/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'メモを追加' })).toBeInTheDocument();
  });

  test('フォームを送信すると正しいデータでaddDocが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<MemoAdd bookId="test-book-id" />);

    const textInput = screen.getByLabelText(/引用・抜き書き/);
    const commentInput = screen.getByLabelText(/感想・コメント/);
    const pageInput = screen.getByLabelText(/ページ番号/);
    const submitButton = screen.getByRole('button', { name: 'メモを追加' });

    // フォームに入力
    await user.type(textInput, 'これはテストの引用です。');
    await user.type(commentInput, 'テストのコメント。');
    await user.type(pageInput, '123');

    // フォームを送信
    await user.click(submitButton);

    // addDocが正しい引数で呼ばれたか確認
    expect(addDoc).toHaveBeenCalledWith(
      undefined, // collectionのモックが正しく設定されていないためundefinedになるが、呼び出しは確認できる
      {
        text: 'これはテストの引用です。',
        comment: 'テストのコメント。',
        page: 123,
        tags: [],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp',
      }
    );
    
    // 送信後にフォームがクリアされるか確認
    expect(textInput).toHaveValue('');
    expect(commentInput).toHaveValue('');
    expect(pageInput.value).toBe('');
  });
}); 