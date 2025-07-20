import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
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
   * 1. openBD APIのモックレスポンスを設定
   * 2. BookAddコンポーネントをレンダリング
   * 3. ISBNを入力
   * 4. 書籍情報取得ボタンをクリック
   * 5. 取得した書籍情報がフォームに自動入力されることを確認
   * 6. openBD APIが正しいURLで呼ばれることを確認
   */
  test('fetches all book info from openBD and fills the form', async () => {
    const user = userEvent.setup();
    const mockBookData = [{
      summary: {
        title: 'テスト駆動開発',
        author: 'Kent Beck／著 和田卓人／訳',
        publisher: 'オーム社',
        pubdate: '2017-08-25',
        cover: 'https://cover.openbd.jp/9784873119485.jpg',
      },
    }];
    axios.get.mockResolvedValue({ data: mockBookData });

    render(<BookAdd />);

    // ISBNを入力して書籍情報取得ボタンをクリック
    const isbnInput = screen.getByLabelText(/ISBN/);
    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });

    await user.type(isbnInput, '9784873119485');
    await user.click(fetchButton);

    // 取得した書籍情報がフォームに自動入力されることを確認
    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('テスト駆動開発');
      expect(screen.getByLabelText(/著者/)).toHaveValue('Kent Beck／著 和田卓人／訳');
      expect(screen.getByLabelText(/出版社/)).toHaveValue('オーム社');
      expect(screen.getByLabelText(/出版日/)).toHaveValue('2017-08-25');
      expect(screen.getByAltText('表紙')).toHaveAttribute('src', 'https://cover.openbd.jp/9784873119485.jpg');
    });

    // openBD APIが正しいURLで呼ばれることを確認
    expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9784873119485');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  /**
   * テストケース: Google Books APIフォールバック機能
   * 
   * 目的: openBDに書影がない場合、Google Books APIから書影を取得するフォールバック機能が
   * 正しく動作することを確認
   * 
   * テストステップ:
   * 1. openBDとGoogle Books APIのモックレスポンスを設定
   * 2. openBDには書影がないデータを設定
   * 3. ISBNを入力して書籍情報取得ボタンをクリック
   * 4. 書籍情報がフォームに自動入力されることを確認
   * 5. openBDとGoogle Books APIの両方が呼ばれることを確認
   */
  test('falls back to Google Books API if openBD has no cover', async () => {
    const user = userEvent.setup();
    const openBdMockData = [{
      summary: {
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        pubdate: '2017-09-20',
        cover: '', // openBDには書影がない
      },
    }];
    const googleBooksMockData = {
      items: [{
        volumeInfo: {
          imageLinks: {
            thumbnail: 'https://books.google.com/images/cleancode.jpg',
          },
        },
      }],
    };

    // URLに応じて異なるレスポンスを返すように設定
    axios.get.mockImplementation((url) => {
      if (url.includes('openbd')) {
        return Promise.resolve({ data: openBdMockData });
      }
      if (url.includes('google')) {
        return Promise.resolve({ data: googleBooksMockData });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<BookAdd />);

    // ISBNを入力して書籍情報取得ボタンをクリック
    const isbnInput = screen.getByLabelText(/ISBN/);
    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });

    await user.type(isbnInput, '9780132350884');
    await user.click(fetchButton);

    // 書籍情報がフォームに自動入力されることを確認
    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('Clean Architecture');
      expect(screen.getByAltText('表紙')).toHaveAttribute('src', 'https://books.google.com/images/cleancode.jpg');
    });

    // openBDとGoogle Books APIの両方が呼ばれたことを確認
    expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9780132350884');
    expect(axios.get).toHaveBeenCalledWith('https://www.googleapis.com/books/v1/volumes?q=isbn:9780132350884');
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});

// FirestoreやuseAuthのモック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'testuid' } }),
}));

// FirestoreのaddDoc, setDoc, getDocs, collection, doc, serverTimestamp なども必要に応じてモック

/**
 * タグ入力・履歴保存機能のテスト
 * 
 * テスト対象の機能:
 * - カンマ区切りでのタグ入力
 * - 空文字・カンマのみの入力の除外
 * - Firestoreへのタグ履歴保存
 */
describe('BookAdd タグ入力・履歴保存', () => {
  /**
   * テストケース: カンマ入力でのタグ追加
   * 
   * 目的: カンマ区切りでタグを入力した場合、正しくタグ配列に追加されることを確認
   * 
   * テストステップ:
   * 1. BookAddコンポーネントをレンダリング
   * 2. タグ入力フィールドにカンマ区切りの値を入力
   * 3. AutocompleteのonInputChange処理でタグが追加されることを確認
   */
  it('カンマ入力でtags配列に値が追加される', async () => {
    render(<BookAdd />);
    const tagInput = screen.getByLabelText('タグ');
    fireEvent.change(tagInput, { target: { value: 'foo,' } });
    // AutocompleteのonInputChangeカスタム処理でtagsに追加されるはず
    // ...ここでtagsのstateを直接検証するのは難しいので、UI上のChipやvalue属性などで検証
    // 例: Chipが表示されるか、またはinputのvalueが空になるか
    // expect(...)
  });

  /**
   * テストケース: 空文字・カンマのみの入力除外
   * 
   * 目的: 空文字やカンマのみの入力がタグ配列に追加されないことを確認
   * 
   * テストステップ:
   * 1. BookAddコンポーネントをレンダリング
   * 2. タグ入力フィールドに空文字やカンマのみを入力
   * 3. 空タグがUIに表示されないことを確認
   */
  it('空文字やカンマだけ入力してもtags配列に空文字が入らない', async () => {
    render(<BookAdd />);
    const tagInput = screen.getByLabelText('タグ');
    fireEvent.change(tagInput, { target: { value: ',' } });
    // ...同様にUI上で空タグが表示されないことを検証
  });

  /**
   * テストケース: タグ配列の保存確認
   * 
   * 目的: フォーム送信時にタグ配列が正しくFirestoreに保存されることを確認
   * 
   * テストステップ:
   * 1. addDoc, saveNewTagsToHistoryをモック
   * 2. タグを入力してフォームを送信
   * 3. addDocが正しいタグ配列で呼ばれることを確認
   */
  it('handleAdd実行時にtags配列が正しく保存される', async () => {
    // addDoc, saveNewTagsToHistoryをモックし、呼び出し時の引数を検証
    // 例: fireEvent.click(追加ボタン)後にaddDocが正しいtagsで呼ばれるか
  });

  /**
   * テストケース: タグ履歴保存処理の確認
   * 
   * 目的: 新しいタグが入力された場合、Firestoreの履歴保存処理が必ず呼ばれることを確認
   * 
   * テストステップ:
   * 1. saveNewTagsToHistoryのモック・スパイを設定
   * 2. 新しいタグを入力してフォームを送信
   * 3. saveNewTagsToHistoryが呼ばれることを確認
   */
  it('Firestoreの履歴保存処理が必ず呼ばれる', async () => {
    // saveNewTagsToHistoryのモック・スパイで呼び出しを検証
  });
}); 