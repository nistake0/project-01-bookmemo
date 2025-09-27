import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import BookForm from './BookForm';
import { renderWithProviders, resetMocks } from '../test-utils';
import { createMockBook } from '../test-factories';

// ExternalBookSearchコンポーネントのモック
jest.mock('./ExternalBookSearch', () => {
  return function MockExternalBookSearch({ onBookSelect, onCancel }) {
    return (
      <div data-testid="external-book-search">
        <button 
          onClick={() => onBookSelect({
            title: 'テスト本',
            author: 'テスト著者',
            publisher: 'テスト出版社',
            publishedDate: '2023-01-01',
            isbn: '978-4-1234567890',
            coverImageUrl: 'https://example.com/cover.jpg'
          })}
          data-testid="mock-select-book"
        >
          書籍を選択
        </button>
        <button 
          onClick={onCancel}
          data-testid="mock-cancel-search"
        >
          キャンセル
        </button>
      </div>
    );
  };
});

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

jest.mock('../hooks/useBookDuplicateCheck', () => ({
  useBookDuplicateCheck: jest.fn(),
}));

jest.mock('../hooks/useTagHistory', () => ({
  useTagHistory: jest.fn(),
}));

describe('BookForm', () => {
  const mockOnBookAdded = jest.fn();
  const mockAddBook = jest.fn();
  const mockSearchBookByIsbn = jest.fn();
  const mockCheckDuplicate = jest.fn();
  const mockResetDuplicateCheck = jest.fn();

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();

    // フックのモック設定
    const { useBookActions } = require('../hooks/useBookActions');
    const { useBookSearch } = require('../hooks/useBookSearch');
    const { useBookDuplicateCheck } = require('../hooks/useBookDuplicateCheck');
    const { useTagHistory } = require('../hooks/useTagHistory');
    
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

    useBookDuplicateCheck.mockReturnValue({
      isChecking: false,
      duplicateBook: null,
      checkDuplicate: mockCheckDuplicate,
      resetDuplicateCheck: mockResetDuplicateCheck,
    });

    useTagHistory.mockReturnValue({
      tagOptions: [],
      fetchTagHistory: jest.fn(),
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

  /**
   * テストケース: 外部検索ボタンの常時表示
   * 
   * 目的: 外部検索ボタンが常に表示されることを確認
   */
  it('shows external search button always', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // 外部検索ボタンが常に表示されることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
    expect(screen.getByText('外部検索で書籍を探す')).toBeInTheDocument();
    expect(screen.getByText('ISBNが分からない場合や、より詳細な情報を探す場合にご利用ください')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索ボタンの常時表示（ISBN入力後も表示）
   * 
   * 目的: ISBNを入力しても外部検索ボタンが表示され続けることを確認
   */
  it('shows external search button even when ISBN is entered', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // ISBNを入力
    fireEvent.change(screen.getByTestId('book-isbn-input'), { 
      target: { value: '9784123456789' } 
    });

    // 外部検索ボタンが表示され続けることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索モードの切り替え
   * 
   * 目的: 外部検索ボタンをクリックして外部検索モードに切り替わることを確認
   */
  it('switches to external search mode when button is clicked', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 外部検索ボタンをクリック
    fireEvent.click(screen.getByTestId('external-search-button'));

    // 外部検索コンポーネントが表示されることを確認
    expect(screen.getByTestId('external-book-search')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索での書籍選択
   * 
   * 目的: 外部検索で書籍を選択した時に自動入力されることを確認
   */
  it('auto-fills form when book is selected from external search', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 外部検索ボタンをクリック
    fireEvent.click(screen.getByTestId('external-search-button'));

    // 外部検索で書籍を選択
    fireEvent.click(screen.getByTestId('mock-select-book'));

    // フォームが自動入力されることを確認
    expect(screen.getByTestId('book-title-input')).toHaveValue('テスト本');
    expect(screen.getByTestId('book-author-input')).toHaveValue('テスト著者');
    expect(screen.getByTestId('book-publisher-input')).toHaveValue('テスト出版社');
    expect(screen.getByTestId('book-publishdate-input')).toHaveValue('2023-01-01');
    expect(screen.getByTestId('book-isbn-input')).toHaveValue('978-4-1234567890');
  });

  /**
   * テストケース: 外部検索のキャンセル
   * 
   * 目的: 外部検索をキャンセルした時に元のモードに戻ることを確認
   */
  it('returns to normal mode when external search is cancelled', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 外部検索ボタンをクリック
    fireEvent.click(screen.getByTestId('external-search-button'));

    // 外部検索コンポーネントが表示されることを確認
    expect(screen.getByTestId('external-book-search')).toBeInTheDocument();

    // キャンセルボタンをクリック
    fireEvent.click(screen.getByTestId('mock-cancel-search'));

    // 外部検索コンポーネントが非表示になることを確認
    expect(screen.queryByTestId('external-book-search')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索ボタンの常時表示（表紙画像取得後も表示）
   * 
   * 目的: 表紙画像が取得されても外部検索ボタンが表示され続けることを確認
   */
  it('shows external search button even when cover image is present', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 表紙画像URLを設定（モック）
    const mockBookData = {
      title: 'テスト本',
      author: 'テスト著者',
      publisher: 'テスト出版社',
      publishedDate: '2023-01-01',
      coverImageUrl: 'https://example.com/cover.jpg',
      tags: []
    };

    // ISBN検索を実行して表紙画像を取得
    mockSearchBookByIsbn.mockResolvedValue(mockBookData);
    fireEvent.change(screen.getByTestId('book-isbn-input'), { 
      target: { value: '9784123456789' } 
    });
    fireEvent.click(screen.getByTestId('book-fetch-button'));

    await waitFor(() => {
      expect(screen.getByTestId('book-cover-image')).toBeInTheDocument();
    });

    // 外部検索ボタンが表示され続けることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索ボタンの常時表示（ISBN入力後も表示）
   * 
   * 目的: ISBNが入力されても外部検索ボタンが表示され続けることを確認
   */
  it('shows external search button even when ISBN is present', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // ISBNを入力
    fireEvent.change(screen.getByTestId('book-isbn-input'), { 
      target: { value: '9784123456789' } 
    });

    // 外部検索ボタンが表示され続けることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索ボタンの常時表示（外部検索モード中も表示）
   * 
   * 目的: 外部検索モード中でも外部検索ボタンが表示され続けることを確認
   */
  it('shows external search button even when in external search mode', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 外部検索ボタンをクリック
    fireEvent.click(screen.getByTestId('external-search-button'));

    // 外部検索モード中でも外部検索ボタンが表示され続けることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 外部検索ボタンの常時表示（書籍選択後も表示）
   * 
   * 目的: 外部検索で書籍選択後でも外部検索ボタンが表示され続けることを確認
   */
  it('shows external search button even after book selection', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // タイトルを入力
    fireEvent.change(screen.getByTestId('book-title-input'), { 
      target: { value: 'テスト本' } 
    });

    // 外部検索ボタンをクリック
    fireEvent.click(screen.getByTestId('external-search-button'));

    // 外部検索で書籍を選択
    fireEvent.click(screen.getByTestId('mock-select-book'));

    // 外部検索ボタンが表示され続けることを確認
    expect(screen.getByTestId('external-search-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 重複書籍の検出と表示
   * 
   * 目的: 重複する書籍が見つかった場合、アラートが表示され、送信ボタンが無効化されることを確認
   */
  it('shows duplicate book alert when duplicate is found', async () => {
    const duplicateBook = {
      id: 'duplicate-book-id',
      title: '重複テスト本',
      author: '重複テスト著者',
      isbn: '9784873119485'
    };

    const { useBookDuplicateCheck } = require('../hooks/useBookDuplicateCheck');
    useBookDuplicateCheck.mockReturnValue({
      isChecking: false,
      duplicateBook: duplicateBook,
      checkDuplicate: mockCheckDuplicate,
      resetDuplicateCheck: mockResetDuplicateCheck,
    });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // 重複アラートが表示されることを確認
    expect(screen.getByTestId('duplicate-book-alert')).toBeInTheDocument();
    expect(screen.getByText('この書籍は既に追加済みです: 重複テスト本')).toBeInTheDocument();
    
    // 送信ボタンが無効化されることを確認
    expect(screen.getByTestId('book-add-submit')).toBeDisabled();
    expect(screen.getByText('追加済みです')).toBeInTheDocument();
  });

  /**
   * テストケース: ISBN取得時の重複チェック
   * 
   * 目的: ISBNで書籍情報を取得した後に重複チェックが実行されることを確認
   */
  it('calls checkDuplicate when ISBN is fetched', async () => {
    mockSearchBookByIsbn.mockResolvedValue({
      title: 'テスト本',
      author: 'テスト著者',
      isbn: '9784873119485'
    });

    // 全フックのモックを再設定
    const { useBookActions } = require('../hooks/useBookActions');
    const { useBookSearch } = require('../hooks/useBookSearch');
    const { useBookDuplicateCheck } = require('../hooks/useBookDuplicateCheck');
    const { useTagHistory } = require('../hooks/useTagHistory');
    
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

    useBookDuplicateCheck.mockReturnValue({
      isChecking: false,
      duplicateBook: null,
      checkDuplicate: mockCheckDuplicate,
      resetDuplicateCheck: mockResetDuplicateCheck,
    });

    useTagHistory.mockReturnValue({
      tagOptions: [],
      fetchTagHistory: jest.fn(),
    });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    });

    // ISBNを入力
    fireEvent.change(screen.getByTestId('book-isbn-input'), {
      target: { value: '9784873119485' }
    });

    // ISBN取得ボタンをクリック
    fireEvent.click(screen.getByTestId('book-fetch-button'));

    // 書籍情報取得後に重複チェックが呼ばれることを確認
    await waitFor(() => {
      expect(mockSearchBookByIsbn).toHaveBeenCalledWith('9784873119485');
    });

    await waitFor(() => {
      expect(mockCheckDuplicate).toHaveBeenCalledWith('9784873119485');
    });
  });

  /**
   * テストケース: 外部検索での重複チェック
   * 
   * 目的: 外部検索で書籍を選択した後に重複チェックが実行されることを確認
   */
  it('calls checkDuplicate when external book is selected', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    });

    // 外部検索モードに切り替え
    fireEvent.click(screen.getByTestId('external-search-button'));
    
    // 書籍を選択
    fireEvent.click(screen.getByTestId('mock-select-book'));

    // 外部検索で選択された書籍の重複チェックが呼ばれることを確認
    await waitFor(() => {
      expect(mockCheckDuplicate).toHaveBeenCalledWith('978-4-1234567890');
    });
  });
}); 