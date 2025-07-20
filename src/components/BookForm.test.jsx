import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookForm from './BookForm';
import { ErrorDialogContext } from './CommonErrorDialog';

/**
 * BookForm コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - 書籍情報入力フォームの表示
 * - バリデーション（タイトル必須チェック）
 * - ISBNによる書籍情報の自動取得
 * - Firestoreへの書籍データ保存
 * - エラーハンドリング
 */

// Firebase モック
jest.mock('../firebase', () => ({
  db: {},
}));

// Firestore モック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

// Auth モック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
  }),
}));

// axios モック
jest.mock('axios', () => ({
  get: jest.fn(),
}));

const mockSetGlobalError = jest.fn();

/**
 * テスト用のレンダリング関数
 * ErrorDialogContextとBrowserRouterでコンポーネントをラップ
 */
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
  );
};

describe('BookForm', () => {
  const mockOnBookAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Firestore モックの設定 - タグ履歴の取得をシミュレート
    const { getDocs, query, orderBy } = require('firebase/firestore');
    getDocs.mockResolvedValue({
      docs: [
        { data: () => ({ tag: '小説' }) },
        { data: () => ({ tag: '技術書' }) },
      ],
    });
    query.mockReturnValue({});
    orderBy.mockReturnValue({});
  });

  /**
   * テストケース: フォームフィールドの表示確認
   * 
   * 目的: 書籍追加フォームに必要なすべての入力フィールドが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. BookFormコンポーネントをレンダリング
   * 2. 各入力フィールド（ISBN、タイトル、著者、出版社、出版日、タグ）が存在することを確認
   * 3. 機能ボタン（ISBN取得、書籍追加）が存在することを確認
   */
  it('renders form fields', () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 必須入力フィールドの存在確認
    expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-author-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publisher-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publishdate-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-tags-input')).toBeInTheDocument();
    
    // 機能ボタンの存在確認
    expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    expect(screen.getByTestId('book-add-submit')).toBeInTheDocument();
  });

  /**
   * テストケース: タイトル未入力時のバリデーション
   * 
   * 目的: タイトルが入力されていない状態でフォームを送信した場合、適切なエラーメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. BookFormコンポーネントをレンダリング
   * 2. タイトルを入力せずにフォームを送信
   * 3. エラーメッセージ「タイトルは必須です」が表示されることを確認
   */
  it('shows error when submitting without title', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // フォームの送信をシミュレート（タイトル未入力）
    fireEvent.submit(screen.getByTestId('book-form'));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-form-error')).toHaveTextContent('タイトルは必須です');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: 正常な書籍追加処理
   * 
   * 目的: 必要な情報が入力された状態でフォームを送信した場合、Firestoreにデータが保存され、コールバックが呼ばれることを確認
   * 
   * テストステップ:
   * 1. FirestoreのaddDocモックを設定
   * 2. タイトルを入力
   * 3. フォームを送信
   * 4. Firestoreに正しいデータが保存されることを確認
   * 5. onBookAddedコールバックが正しいIDで呼ばれることを確認
   */
  it('calls onBookAdded when form is submitted successfully', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-book-id' });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // タイトルを入力（必須項目）
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // フォームを送信
    const submitButton = screen.getByTestId('book-add-submit');
    fireEvent.click(submitButton);

    // Firestoreへの保存とコールバックの呼び出しを確認
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'テスト本',
          status: 'reading',
        })
      );
      expect(mockOnBookAdded).toHaveBeenCalledWith('test-book-id');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: ISBN未入力時のエラーハンドリング
   * 
   * 目的: ISBNが入力されていない状態で書籍情報取得ボタンをクリックした場合、適切なエラーメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. BookFormコンポーネントをレンダリング
   * 2. ISBNを入力せずに書籍情報取得ボタンをクリック
   * 3. エラーメッセージ「ISBNを入力してください」が表示されることを確認
   */
  it('shows error when ISBN is empty and fetch button is clicked', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // ISBN未入力で書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-form-error')).toHaveTextContent('ISBNを入力してください');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: ISBNによる書籍情報の自動取得
   * 
   * 目的: 有効なISBNを入力して書籍情報取得ボタンをクリックした場合、openBD APIから書籍情報が取得され、フォームに自動入力されることを確認
   * 
   * テストステップ:
   * 1. axiosモックでopenBD APIのレスポンスを設定
   * 2. ISBNを入力
   * 3. 書籍情報取得ボタンをクリック
   * 4. openBD APIが正しいURLで呼ばれることを確認
   * 5. 取得した書籍情報がフォームに自動入力されることを確認
   */
  it('fetches book info when ISBN is provided', async () => {
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

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

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
}); 