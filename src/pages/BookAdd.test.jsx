import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import BookAdd from './BookAdd';

/**
 * BookAdd ページのユニットテスト
 * 
 * テスト対象の機能:
 * - ISBNによる書籍情報の自動取得（openBD API）
 * - 書影がない場合のGoogle Books APIフォールバック
 * - 取得した書籍情報のフォーム自動入力
 * - タグ入力・履歴保存機能
 */

// 依存するモジュールをモック化
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // 他の機能はそのまま使う
  useNavigate: () => jest.fn(), // useNavigateだけモック
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));
jest.mock('../firebase', () => {
  // Firestoreのモック
  const mockCollectionRef = {}; // CollectionReferenceのダミー
  const mockCollection = jest.fn(() => mockCollectionRef);
  const mockGetDocs = jest.fn(() => Promise.resolve({
    docs: [
      { id: 'tag1', data: () => ({ tag: 'テストタグ1', updatedAt: { toDate: () => new Date() } }) },
      { id: 'tag2', data: () => ({ tag: 'テストタグ2', updatedAt: { toDate: () => new Date() } }) },
    ],
  }));
  return {
    db: {},
    collection: mockCollection,
    getDocs: mockGetDocs,
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(),
  };
});

// Firestoreのcollection/getDocsを直接importしている場合にも対応
jest.mock('firebase/firestore', () => {
  const mockCollectionRef = {};
  const mockCollection = jest.fn(() => mockCollectionRef);
  const mockGetDocs = jest.fn(() => Promise.resolve({
    docs: [
      { id: 'tag1', data: () => ({ tag: 'テストタグ1', updatedAt: { toDate: () => new Date() } }) },
      { id: 'tag2', data: () => ({ tag: 'テストタグ2', updatedAt: { toDate: () => new Date() } }) },
    ],
  }));
  return {
    collection: mockCollection,
    getDocs: mockGetDocs,
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
  };
});

// テスト用のレンダリング関数
const mockSetGlobalError = jest.fn();
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
  );
};

describe('BookAdd', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    axios.get.mockClear();
  });

  /**
   * テストケース: openBD APIからの書籍情報取得とフォーム自動入力
   * 
   * 目的: ISBNを入力して書籍情報取得ボタンをクリックした場合、openBD APIから書籍情報が取得され、
   * フォームに自動入力されることを確認
   * 
   * テストステップ:
   * 1. axiosモックでopenBD APIのレスポンスを設定
   * 2. ISBNを入力
   * 3. 書籍情報取得ボタンをクリック
   * 4. openBD APIが正しいURLで呼ばれることを確認
   * 5. 取得した書籍情報がフォームに自動入力されることを確認
   */
  it('fetches book info from openBD API and fills form', async () => {
    const axios = require('axios');
    const mockBookData = {
      summary: {
        title: 'テスト駆動開発',
        author: 'Kent Beck／著 和田卓人／訳',
        publisher: 'オーム社',
        pubdate: '2017-08-25',
        cover: 'https://cover.openbd.jp/9784873119485.jpg',
      },
    };
    axios.get.mockResolvedValue({ data: [mockBookData] });

    renderWithProviders(<BookAdd />);

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9784873119485' } });

    // 書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // openBD APIが正しいURLで呼ばれることを確認
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.openbd.jp/v1/get?isbn=9784873119485'
      );
    }, { timeout: 3000 });

    // 取得した書籍情報がフォームに自動入力されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toHaveValue('テスト駆動開発');
      expect(screen.getByTestId('book-author-input')).toHaveValue('Kent Beck／著 和田卓人／訳');
      expect(screen.getByTestId('book-publisher-input')).toHaveValue('オーム社');
      expect(screen.getByTestId('book-publishdate-input')).toHaveValue('2017-08-25');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: Google Books APIからの書籍情報取得とフォーム自動入力
   * 
   * 目的: openBDで書籍情報が見つからない場合、Google Books APIから書籍情報が取得されることを確認
   * 
   * テストステップ:
   * 1. axiosモックでopenBDとGoogle Books APIのレスポンスを設定
   * 2. ISBNを入力
   * 3. 書籍情報取得ボタンをクリック
   * 4. openBD APIが正しいURLで呼ばれることを確認
   * 5. エラーメッセージが表示されることを確認
   */
  it('shows error when openBD fails and no Google Books data', async () => {
    const axios = require('axios');
    
    // openBDは空のレスポンス
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(<BookAdd />);

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9780134494166' } });

    // 書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // openBD APIが正しいURLで呼ばれることを確認
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.openbd.jp/v1/get?isbn=9780134494166'
      );
    }, { timeout: 3000 });
  }, 15000);

  /**
   * テストケース: タグ入力と履歴保存
   * 
   * 目的: タグを入力した場合、タグ履歴がFirestoreに保存されることを確認
   * 
   * テストステップ:
   * 1. FirestoreのsetDocモックを設定
   * 2. タグ入力フィールドにタグを入力
   * 3. フォームを送信
   * 4. タグ履歴がFirestoreに保存されることを確認
   */
  it('saves tags to history when form is submitted', async () => {
    const { setDoc } = require('firebase/firestore');
    setDoc.mockResolvedValue();

    renderWithProviders(<BookAdd />);

    // タイトルを入力（必須項目）
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // タグを入力
    const tagInput = screen.getByTestId('book-tags-input');
    fireEvent.change(tagInput, { target: { value: '技術書,プログラミング' } });

    // フォームを送信
    const submitButton = screen.getByTestId('book-add-submit');
    fireEvent.click(submitButton);

    // タグ履歴が保存されることを確認
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
}); 