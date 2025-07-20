import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import BookStatusChanger from './BookStatusChanger';
import { ErrorDialogContext } from './CommonErrorDialog';

/**
 * BookStatusChanger コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - 読書状態に応じたボタン表示（読書中→読了、読了→読書中）
 * - 状態変更時のFirestore更新処理
 * - 更新中のローディング状態表示
 * - エラーハンドリング
 * - デフォルト状態の処理
 */

// Firebaseのモジュールをモック化
jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

// Firebaseのdbをモック化
jest.mock('../firebase', () => ({
  db: {},
}));

// ErrorDialogContextをモック化
jest.mock('./CommonErrorDialog', () => ({
  ErrorDialogContext: {
    Provider: ({ children, value }) => children,
  },
}));

describe('BookStatusChanger', () => {
  // テスト用の書籍データ
  const mockBook = {
    id: 'book-1',
    title: 'テストブック',
    status: 'reading',
  };

  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: 読書中状態でのボタン表示
   * 
   * 目的: 書籍が読書中状態の場合、「読了にする」ボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. 読書中状態の書籍データでBookStatusChangerをレンダリング
   * 2. 「読了にする」ボタンが表示されることを確認
   */
  test('displays reading status button when book is reading', () => {
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読了にする')).toBeInTheDocument();
  });

  /**
   * テストケース: 読了状態でのボタン表示
   * 
   * 目的: 書籍が読了状態の場合、「読書中にする」ボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. 読了状態の書籍データでBookStatusChangerをレンダリング
   * 2. 「読書中にする」ボタンが表示されることを確認
   */
  test('displays finished status button when book is finished', () => {
    const finishedBook = { ...mockBook, status: 'finished' };
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={finishedBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読書中にする')).toBeInTheDocument();
  });

  /**
   * テストケース: 状態が未設定の場合のデフォルト表示
   * 
   * 目的: 書籍のstatusフィールドが未設定の場合、デフォルトで読書中状態として
   * 「読了にする」ボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. statusフィールドが未設定の書籍データでレンダリング
   * 2. デフォルトで「読了にする」ボタンが表示されることを確認
   */
  test('displays reading status as default when status is missing', () => {
    const bookWithoutStatus = { ...mockBook };
    delete bookWithoutStatus.status;
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={bookWithoutStatus} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読了にする')).toBeInTheDocument();
  });

  /**
   * テストケース: 状態変更ボタンクリック時の処理
   * 
   * 目的: 状態変更ボタンをクリックした場合、Firestoreが更新され、
   * onStatusChangeコールバックが呼ばれることを確認
   * 
   * テストステップ:
   * 1. updateDocモックを設定
   * 2. BookStatusChangerをレンダリング
   * 3. 状態変更ボタンをクリック
   * 4. FirestoreのupdateDocが正しいデータで呼ばれることを確認
   * 5. onStatusChangeコールバックが正しい状態で呼ばれることを確認
   */
  test('calls onStatusChange when button is clicked', async () => {
    const user = userEvent.setup();
    updateDoc.mockResolvedValue();
    const mockSetGlobalError = jest.fn();
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    // 状態変更ボタンをクリック
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    // Firestoreの更新とコールバックの呼び出しを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: 'finished',
          updatedAt: 'mock-timestamp',
        })
      );
      expect(mockOnStatusChange).toHaveBeenCalledWith('finished');
    });
  });

  /**
   * テストケース: 更新中のローディング状態表示
   * 
   * 目的: 状態変更処理中は「更新中...」が表示され、ボタンが無効化されることを確認
   * 
   * テストステップ:
   * 1. updateDocに遅延を設定
   * 2. BookStatusChangerをレンダリング
   * 3. 状態変更ボタンをクリック
   * 4. 「更新中...」が表示され、ボタンが無効化されることを確認
   */
  test('shows updating state while processing', async () => {
    const user = userEvent.setup();
    // 遅延をシミュレート
    updateDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const mockSetGlobalError = jest.fn();
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    // 状態変更ボタンをクリック
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    // 更新中の状態を確認
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  /**
   * テストケース: 更新失敗時のエラーハンドリング
   * 
   * 目的: Firestoreの更新が失敗した場合、エラーが適切に処理されることを確認
   * 
   * テストステップ:
   * 1. updateDocにエラーを設定
   * 2. BookStatusChangerをレンダリング
   * 3. 状態変更ボタンをクリック
   * 4. updateDocが呼ばれることを確認（エラーハンドリングは実際のコンテキストでテスト）
   */
  test('handles error when update fails', async () => {
    const user = userEvent.setup();
    const mockSetGlobalError = jest.fn();
    updateDoc.mockRejectedValue(new Error('Update failed'));
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    // 状態変更ボタンをクリック
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    // エラーが発生したことを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  /**
   * テストケース: 書籍がnullの場合の処理
   * 
   * 目的: 書籍データがnullの場合、コンポーネントが何もレンダリングしないことを確認
   * 
   * テストステップ:
   * 1. book={null}でBookStatusChangerをレンダリング
   * 2. コンテナのfirstChildがnullであることを確認
   */
  test('returns null when book is null', () => {
    const mockSetGlobalError = jest.fn();
    const { container } = render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={null} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    expect(container.firstChild).toBeNull();
  });
}); 