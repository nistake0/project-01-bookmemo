import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// useExternalBookSearch をモック化（import.meta の問題回避）
jest.mock('../hooks/useExternalBookSearch', () => ({
  useExternalBookSearch: jest.fn(() => ({
    searchResults: [],
    loading: false,
    loadingStep: '',
    error: null,
    searchBooks: jest.fn(),
    clearSearchResults: jest.fn(),
    clearError: jest.fn(),
  })),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // 他の機能はそのまま使う
  useNavigate: () => jest.fn(), // useNavigateだけモック
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));

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
    // 完全なモックリセット
    jest.clearAllMocks();
    
    // 各テストの前にモックをリセット
    axios.get.mockClear();
    mockSetGlobalError.mockClear();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  /**
   * テストケース: コンポーネントのレンダリング
   * 
   * 目的: BookAddコンポーネントが正常にレンダリングされることを確認
   * 
   * テストステップ:
   * 1. BookAddコンポーネントをレンダリング
   * 2. 主要な要素が表示されることを確認
   */
  it('renders BookAdd component correctly', () => {
    renderWithProviders(<BookAdd />);

    // 主要な要素が表示されることを確認
    expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-author-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publisher-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publishdate-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-tags-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-add-submit')).toBeInTheDocument();
  });

  /**
   * テストケース: フォーム入力の動作確認
   * 
   * 目的: フォームに値を入力した場合、正しく状態が更新されることを確認
   * 
   * テストステップ:
   * 1. 各入力フィールドに値を入力
   * 2. 入力値が正しく反映されることを確認
   */
  it('handles form input correctly', () => {
    renderWithProviders(<BookAdd />);

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9784873119485' } });
    expect(isbnInput).toHaveValue('9784873119485');

    // タイトルを入力
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });
    expect(titleInput).toHaveValue('テスト本');

    // 著者を入力
    const authorInput = screen.getByTestId('book-author-input');
    fireEvent.change(authorInput, { target: { value: 'テスト著者' } });
    expect(authorInput).toHaveValue('テスト著者');
  });

  /**
   * テストケース: openBD APIからの書籍情報取得
   * 
   * 目的: ISBNを入力して書籍情報取得ボタンをクリックした場合、openBD APIから書籍情報が取得されることを確認
   * 
   * テストステップ:
   * 1. axiosモックでopenBD APIのレスポンスを設定
   * 2. ISBNを入力
   * 3. 書籍情報取得ボタンをクリック
   * 4. openBD APIが正しいURLで呼ばれることを確認
   */
  it('calls openBD API when fetch button is clicked', async () => {
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
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.openbd.jp/v1/get?isbn=9784873119485'
    );
  });

  /**
   * テストケース: Google Books APIのフォールバック機能
   * 
   * 目的: openBDで書籍情報が見つからない場合、Google Books APIが呼ばれることを確認
   * 
   * テストステップ:
   * 1. axiosモックでopenBDは空、Google Booksは成功を設定
   * 2. ISBNを入力
   * 3. 書籍情報取得ボタンをクリック
   * 4. 両方のAPIが呼ばれることを確認
   */
  it('calls Google Books API when openBD fails', async () => {
    const axios = require('axios');
    const mockGoogleBookData = {
      items: [{
        volumeInfo: {
          title: 'Clean Architecture',
          authors: ['Robert C. Martin'],
          publisher: 'Prentice Hall',
          publishedDate: '2017-09-20',
        }
      }]
    };
    
    // openBDは空のレスポンス、Google Booksは成功
    axios.get
      .mockResolvedValueOnce({ data: [] }) // openBD
      .mockResolvedValueOnce({ data: mockGoogleBookData }); // Google Books

    renderWithProviders(<BookAdd />);

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9780134494166' } });

    // 書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // openBD APIが呼ばれることを確認
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.openbd.jp/v1/get?isbn=9780134494166'
    );

    // Google Books APIも呼ばれることを確認
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/books/v1/volumes?q=isbn:9780134494166'
      );
    });
  });

  /**
   * テストケース: フォーム送信機能
   * 
   * 目的: フォーム送信時にFirestoreにデータが保存されることを確認
   * 
   * テストステップ:
   * 1. FirestoreのaddDocモックを設定
   * 2. 必須項目を入力
   * 3. フォームを送信
   * 4. Firestoreに保存されることを確認
   */
  it('submits form data to Firestore', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-book-id' });

    renderWithProviders(<BookAdd />);

    // タイトルを入力（必須項目）
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // 著者を入力
    const authorInput = screen.getByTestId('book-author-input');
    fireEvent.change(authorInput, { target: { value: 'テスト著者' } });

    // フォームを送信
    const submitButton = screen.getByTestId('book-add-submit');
    fireEvent.click(submitButton);

    // Firestoreに保存されることを確認
    expect(addDoc).toHaveBeenCalled();
  });
}); 