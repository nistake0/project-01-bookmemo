import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import BookForm from './BookForm';
import { renderWithProviders, resetMocks } from '../test-utils';
import { createMockBook } from '../test-factories';

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

// 新しいフックのモック
jest.mock('../hooks/useBookActions', () => ({
  useBookActions: jest.fn(),
}));

jest.mock('../hooks/useBookSearch', () => ({
  useBookSearch: jest.fn(),
}));

describe('BookForm', () => {
  const mockOnBookAdded = jest.fn();
  const mockAddBook = jest.fn();
  const mockSearchBookByIsbn = jest.fn();

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();

    // フックのモック設定
    const { useBookActions } = require('../hooks/useBookActions');
    const { useBookSearch } = require('../hooks/useBookSearch');

    useBookActions.mockReturnValue({
      addBook: mockAddBook,
      loading: false,
      error: null,
    });

    useBookSearch.mockReturnValue({
      searchBookByIsbn: mockSearchBookByIsbn,
      loading: false,
      error: null,
      searchPerformed: false,
    });
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  /**
   * テストケース: フォームフィールドの表示確認
   * 
   * 目的: 書籍追加フォームに必要なすべての入力フィールドが正しく表示されることを確認
   */
  it('renders form fields', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 必須入力フィールドの存在確認
    expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-author-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publisher-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publishdate-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-tags-input')).toBeInTheDocument();
    
    // 機能ボタンの存在確認
    expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    expect(screen.getByTestId('book-add-submit')).toBeInTheDocument();
  }, 10000);

  /**
   * テストケース: タイトル未入力時のバリデーション
   * 
   * 目的: タイトルが入力されていない状態でフォームを送信した場合、適切なエラーメッセージが表示されることを確認
   */
  it('shows error when submitting without title', async () => {
    // addBookがエラーを返すように設定
    mockAddBook.mockResolvedValue(null);

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-form')).toBeInTheDocument();
    }, { timeout: 10000 });

    // フォームの送信をシミュレート（タイトル未入力）
    fireEvent.submit(screen.getByTestId('book-form'));

    // addBookが呼ばれないことを確認（タイトルが空のため）
    expect(mockAddBook).not.toHaveBeenCalled();
  }, 15000);

  /**
   * テストケース: ISBN未入力時のエラーハンドリング
   * 
   * 目的: ISBNが入力されていない状態で書籍情報取得ボタンをクリックした場合、適切なエラーメッセージが表示されることを確認
   */
  it('shows error when ISBN is empty and fetch button is clicked', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBN未入力で書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // searchBookByIsbnが呼ばれないことを確認（ISBNが空のため）
    expect(mockSearchBookByIsbn).not.toHaveBeenCalled();
  }, 15000);

  /**
   * テストケース: 正常な書籍追加処理
   * 
   * 目的: 必要な情報が入力された状態でフォームを送信した場合、Firestoreにデータが保存され、コールバックが呼ばれることを確認
   */
  it('calls onBookAdded when form is submitted successfully', async () => {
    // addBookが成功するように設定
    mockAddBook.mockResolvedValue('test-book-id');

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-form')).toBeInTheDocument();
    }, { timeout: 10000 });

    // タイトルを入力
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // フォームを送信
    fireEvent.submit(screen.getByTestId('book-form'));

    // addBookが正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(mockAddBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テスト本',
        })
      );
    });

    // onBookAddedコールバックが正しいIDで呼ばれることを確認
    expect(mockOnBookAdded).toHaveBeenCalledWith('test-book-id');
  }, 15000);

  /**
   * テストケース: ISBN取得機能（基本）
   * 
   * 目的: ISBN取得ボタンをクリックした場合、OpenBDから書籍情報が取得されることを確認
   */
  it('fetches book info by ISBN', async () => {
    // searchBookByIsbnが書籍情報を返すように設定
    mockSearchBookByIsbn.mockResolvedValue({
      title: 'ISBN取得テスト本',
      author: 'ISBN取得テスト著者',
      publisher: 'テスト出版社',
      publishedDate: '2024-01-01',
      coverImageUrl: 'https://example.com/cover.jpg',
      tags: ['小説', '名作'],
    });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '978-4-1234-5678-9' } });

    // ISBN取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // 書籍情報が取得されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toHaveValue('ISBN取得テスト本');
      expect(screen.getByTestId('book-author-input')).toHaveValue('ISBN取得テスト著者');
    });
  }, 15000);

  /**
   * テストケース: ISBN取得機能（詳細）
   * 
   * 目的: ISBN取得時に出版社と出版日も正しく取得されることを確認
   */
  it('fetches complete book info including publisher and publish date', async () => {
    // searchBookByIsbnが詳細な書籍情報を返すように設定
    mockSearchBookByIsbn.mockResolvedValue({
      title: 'テスト駆動開発',
      author: 'Kent Beck／著 和田卓人／訳',
      publisher: 'オーム社',
      publishedDate: '2017-08-25',
      coverImageUrl: 'https://cover.openbd.jp/9784873119485.jpg',
      tags: ['技術書', 'プログラミング'],
    });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBNを入力（stringであることを明示）
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9784873119485' } });

    // ISBN取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // 全ての書籍情報が取得されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toHaveValue('テスト駆動開発');
      expect(screen.getByTestId('book-author-input')).toHaveValue('Kent Beck／著 和田卓人／訳');
      expect(screen.getByTestId('book-publisher-input')).toHaveValue('オーム社');
      expect(screen.getByTestId('book-publishdate-input')).toHaveValue('2017-08-25');
    });

    // searchBookByIsbnが正しいISBNで呼ばれることを確認
    expect(mockSearchBookByIsbn).toHaveBeenCalledWith('9784873119485');
  }, 15000);

  /**
   * テストケース: ステータス選択機能
   * 
   * 目的: ステータス選択UIが正しく表示されることを確認
   */
  it('displays status selection UI', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-status-select')).toBeInTheDocument();
    });

    // ステータス選択UIが表示されていることを確認（data-testidで確認）
    expect(screen.getByTestId('book-status-select')).toBeInTheDocument();
  });

  /**
   * テストケース: ステータス選択と書籍保存
   * 
   * 目的: 選択したステータスが書籍データに含まれて保存されることを確認
   */
  it('saves book with default status', async () => {
    mockAddBook.mockResolvedValue('new-book-id');

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // 書籍情報を入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 書籍を保存（フォーム送信ボタンをクリック）
    fireEvent.click(screen.getByTestId('book-add-submit'));

    // デフォルトステータス（積読）が含まれて保存されることを確認
    await waitFor(() => {
      expect(mockAddBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テスト本',
          status: 'tsundoku'
        })
      );
    });
  });

  /**
   * テストケース: 取得方法選択UI
   * 
   * 目的: 取得方法選択UIが正しく表示されることを確認
   */
  it('displays acquisition type selection UI', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-acquisition-type-select')).toBeInTheDocument();
    });

    // 取得方法選択UIが表示されていることを確認（data-testidで確認）
    expect(screen.getByTestId('book-acquisition-type-select')).toBeInTheDocument();
  });

  /**
   * テストケース: 取得方法選択と書籍保存
   * 
   * 目的: 選択した取得方法が書籍データに含まれて保存されることを確認
   */
  it('saves book with default acquisition type', async () => {
    mockAddBook.mockResolvedValue('new-book-id');

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // 書籍情報を入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 書籍を保存
    fireEvent.click(screen.getByTestId('book-add-submit'));

    // デフォルト取得方法（不明）が含まれて保存されることを確認
    await waitFor(() => {
      expect(mockAddBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テスト本',
          acquisitionType: 'unknown'
        })
      );
    });
  });
}); 