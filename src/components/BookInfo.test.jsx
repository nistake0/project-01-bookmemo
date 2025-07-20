import React from 'react';
import { render, screen } from '@testing-library/react';
import BookInfo from './BookInfo';

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
    coverImageUrl: 'http://example.com/cover.jpg',
    status: 'reading',
    tags: ['小説', '名作']
  };

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
    expect(screen.getByText('テストブック')).toBeInTheDocument();
    expect(screen.getByText('著者A')).toBeInTheDocument();
    expect(screen.getByText(/出版社: テスト出版社/)).toBeInTheDocument();
    expect(screen.getByText(/出版日: 2024-01-01/)).toBeInTheDocument();
    expect(screen.getByText('読書中')).toBeInTheDocument();
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
    const coverImage = screen.getByAltText('テストブックの表紙');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'http://example.com/cover.jpg');
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
    expect(screen.getByText('書影なし')).toBeInTheDocument();
    expect(screen.queryByAltText('テストブックの表紙')).not.toBeInTheDocument();
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
    
    expect(screen.getByText('読了')).toBeInTheDocument();
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
    
    expect(screen.getByText('読書中')).toBeInTheDocument();
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
    expect(screen.getByText('テストブック')).toBeInTheDocument();
    expect(screen.getByText('著者A')).toBeInTheDocument();
    
    // オプションフィールドが表示されないことを確認
    expect(screen.queryByText(/出版社:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/出版日:/)).not.toBeInTheDocument();
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
}); 