import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookInfo from './BookInfo';
import { resetMocks } from '../test-utils';

// navigator.clipboardのモック
const mockClipboard = {
  writeText: jest.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true,
});

// window.openのモック
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

/**
 * BookInfo コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - 書籍基本情報の表示（タイトル、著者、出版社、出版日）
 * - 書影の表示・プレースホルダー処理
 * - 読書状態の表示（読書中、読了）
 * - オプションフィールドの処理
 * - エッジケースの処理（null値、未設定フィールド）
 */

describe('BookInfo', () => {
  // テスト用の書籍データ（全フィールド付き）
  const mockBook = {
    id: 'book-1',
    title: 'テストブック',
    author: '著者A',
    publisher: 'テスト出版社',
    publishedDate: '2024-01-01',
    isbn: '978-4-87311-9485',
    coverImageUrl: 'http://example.com/cover.jpg',
    status: 'tsundoku',
    tags: ['小説', '名作']
  };

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    mockClipboard.writeText.mockClear();
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  /**
   * テストケース: 書籍基本情報の表示
   * 
   * 目的: 書籍の基本情報（タイトル、著者、出版社、出版日、読書状態）が
   * 正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 全フィールド付きの書籍データでBookInfoをレンダリング
   * 2. タイトル、著者、出版社、出版日、読書状態が表示されることを確認
   */
  test('displays book information correctly', () => {
    render(<BookInfo book={mockBook} />);
    
    // 書籍の基本情報が表示されることを確認
    expect(screen.getByTestId('book-info')).toBeInTheDocument();
    expect(screen.getByTestId('book-title')).toHaveTextContent('テストブック');
    expect(screen.getByTestId('book-author')).toHaveTextContent('著者A');
    expect(screen.getByTestId('book-publisher')).toHaveTextContent('出版社: テスト出版社');
    expect(screen.getByTestId('book-published-date')).toHaveTextContent('出版日: 2024-01-01');
    expect(screen.getByTestId('book-isbn')).toHaveTextContent('ISBN: 978-4-87311-9485');
    expect(screen.getByTestId('book-status-chip')).toHaveTextContent('積読');
  });

  /**
   * テストケース: 書影の表示
   * 
   * 目的: 書影URLが設定されている場合、画像が正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 書影URL付きの書籍データでBookInfoをレンダリング
   * 2. 書影画像が正しいalt属性とsrc属性で表示されることを確認
   */
  test('displays cover image when available', () => {
    render(<BookInfo book={mockBook} />);
    
    // 書影画像が正しく表示されることを確認
    expect(screen.getByTestId('book-cover-section')).toBeInTheDocument();
    const coverImage = screen.getByTestId('book-cover-image');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'http://example.com/cover.jpg');
    expect(coverImage).toHaveAttribute('alt', 'テストブックの表紙');
  });

  /**
   * テストケース: 書影がない場合のプレースホルダー表示
   * 
   * 目的: 書影URLが空文字の場合、「書影なし」のプレースホルダーが表示されることを確認
   * 
   * テストステップ:
   * 1. 書影URLが空文字の書籍データでBookInfoをレンダリング
   * 2. 「書影なし」が表示されることを確認
   * 3. 書影画像が表示されないことを確認
   */
  test('displays placeholder when cover image is missing', () => {
    const bookWithoutCover = { ...mockBook, coverImageUrl: '' };
    render(<BookInfo book={bookWithoutCover} />);
    
    // プレースホルダーが表示されることを確認
    expect(screen.getByTestId('book-cover-placeholder')).toBeInTheDocument();
    expect(screen.getByText('書影なし')).toBeInTheDocument();
    expect(screen.queryByTestId('book-cover-image')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 読了状態の表示
   * 
   * 目的: 書籍が読了状態の場合、「読了」が正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 読了状態の書籍データでBookInfoをレンダリング
   * 2. 「読了」が表示されることを確認
   */
  test('displays finished status correctly', () => {
    const finishedBook = { ...mockBook, status: 'finished' };
    render(<BookInfo book={finishedBook} />);
    
    expect(screen.getByTestId('book-status-chip')).toHaveTextContent('読了');
  });

  /**
   * テストケース: 読書状態が未設定の場合のデフォルト表示
   * 
   * 目的: 書籍のstatusフィールドが未設定の場合、デフォルトで「読書中」が
   * 表示されることを確認
   * 
   * テストステップ:
   * 1. statusフィールドが未設定の書籍データでBookInfoをレンダリング
   * 2. デフォルトで「読書中」が表示されることを確認
   */
  test('displays reading status as default when status is missing', () => {
    const bookWithoutStatus = { ...mockBook };
    delete bookWithoutStatus.status;
    render(<BookInfo book={bookWithoutStatus} />);
    
    expect(screen.getByTestId('book-status-chip')).toHaveTextContent('積読');
  });

  /**
   * テストケース: オプションフィールドがない場合の処理
   * 
   * 目的: 出版社、出版日などのオプションフィールドがない書籍でも
   * 正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 最小限のフィールド（id, title, author）のみの書籍データでレンダリング
   * 2. 必須フィールド（タイトル、著者）が表示されることを確認
   * 3. オプションフィールド（出版社、出版日）が表示されないことを確認
   */
  test('handles missing optional fields gracefully', () => {
    const minimalBook = {
      id: 'book-1',
      title: 'テストブック',
      author: '著者A'
    };
    render(<BookInfo book={minimalBook} />);
    
    // 必須フィールドが表示されることを確認
    expect(screen.getByTestId('book-title')).toHaveTextContent('テストブック');
    expect(screen.getByTestId('book-author')).toHaveTextContent('著者A');
    
    // オプションフィールドが表示されないことを確認
    expect(screen.queryByTestId('book-publisher')).not.toBeInTheDocument();
    expect(screen.queryByTestId('book-published-date')).not.toBeInTheDocument();
    expect(screen.queryByTestId('book-isbn')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 書籍がnullの場合の処理
   * 
   * 目的: 書籍データがnullの場合、コンポーネントが何もレンダリングしないことを確認
   * 
   * テストステップ:
   * 1. book={null}でBookInfoをレンダリング
   * 2. コンテナのfirstChildがnullであることを確認
   */
  test('returns null when book is null', () => {
    const { container } = render(<BookInfo book={null} />);
    expect(container.firstChild).toBeNull();
  });

  /**
   * テストケース: 取得方法の表示
   * 
   * 目的: 取得方法が「不明」以外の場合にChipで表示されることを確認
   */
  test('displays acquisition type when not unknown', () => {
    const bookWithAcquisitionType = {
      ...mockBook,
      acquisitionType: 'bought'
    };

    render(<BookInfo book={bookWithAcquisitionType} />);
    
    expect(screen.getByTestId('book-acquisition-type')).toBeInTheDocument();
    expect(screen.getByText('取得方法: 購入')).toBeInTheDocument();
  });

  test('renders edit button when onEdit is provided', () => {
    const handleEdit = jest.fn();
    render(<BookInfo book={mockBook} onEdit={handleEdit} />);

    const editButton = screen.getByTestId('book-edit-button');
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalled();
  });

  /**
   * テストケース: 取得方法が不明の場合は表示しない
   * 
   * 目的: 取得方法が「不明」の場合はChipが表示されないことを確認
   */
  test('does not display acquisition type when unknown', () => {
    const bookWithUnknownAcquisitionType = {
      ...mockBook,
      acquisitionType: 'unknown'
    };

    render(<BookInfo book={bookWithUnknownAcquisitionType} />);
    
    expect(screen.queryByTestId('book-acquisition-type')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 取得方法が未設定の場合は表示しない
   * 
   * 目的: 取得方法が未設定の場合はChipが表示されないことを確認
   */
  test('does not display acquisition type when not set', () => {
    const bookWithoutAcquisitionType = {
      ...mockBook
      // acquisitionType is undefined
    };

    render(<BookInfo book={bookWithoutAcquisitionType} />);
    
    expect(screen.queryByTestId('book-acquisition-type')).not.toBeInTheDocument();
  });

  /**
   * テストケース: ISBNの表示
   * 
   * 目的: ISBNが設定されている場合に正しく表示されることを確認
   */
  test('displays ISBN when available', () => {
    render(<BookInfo book={mockBook} />);
    
    expect(screen.getByTestId('book-isbn')).toBeInTheDocument();
    expect(screen.getByTestId('book-isbn')).toHaveTextContent('ISBN: 978-4-87311-9485');
  });

  /**
   * テストケース: ISBNが未設定の場合は表示しない
   * 
   * 目的: ISBNが未設定の場合は表示されないことを確認
   */
  test('does not display ISBN when not set', () => {
    const bookWithoutIsbn = {
      ...mockBook
    };
    delete bookWithoutIsbn.isbn;

    render(<BookInfo book={bookWithoutIsbn} />);
    
    expect(screen.queryByTestId('book-isbn')).not.toBeInTheDocument();
  });
});