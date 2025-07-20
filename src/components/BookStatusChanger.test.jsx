import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
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

// テスト用のヘルパー関数
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
   * テストケース: 読書状態ボタンの表示確認
   * 
   * 目的: 書籍の読書状態に応じて適切なボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. 読書中の書籍でBookStatusChangerをレンダリング
   * 2. 「読了」ボタンが表示されることを確認
   * 3. 読了済みの書籍でBookStatusChangerをレンダリング
   * 4. 「読書中」ボタンが表示されることを確認
   */
  it('displays correct status button based on book status', () => {
    const readingBook = { ...mockBook, status: 'reading' };
    const completedBook = { ...mockBook, status: 'completed' };

    // 読書中の書籍
    const { rerender } = renderWithProviders(
      <BookStatusChanger book={readingBook} onStatusChange={mockOnStatusChange} />
    );
    expect(screen.getByTestId('status-complete-button')).toBeInTheDocument();

    // 読了済みの書籍
    rerender(<BookStatusChanger book={completedBook} onStatusChange={mockOnStatusChange} />);
    expect(screen.getByTestId('status-reading-button')).toBeInTheDocument();
  });

  /**
   * テストケース: 読書状態変更時のFirestore更新
   * 
   * 目的: 読書状態ボタンをクリックした場合、FirestoreのupdateDocが正しいデータで呼ばれることを確認
   * 
   * テストステップ:
   * 1. FirestoreのupdateDocモックを設定
   * 2. 読書状態ボタンをクリック
   * 3. updateDocが正しいデータで呼ばれることを確認
   * 4. onStatusChangeコールバックが呼ばれることを確認
   */
  it('updates Firestore when status button is clicked', async () => {
    const { updateDoc } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // 読書状態ボタンをクリック
    const statusButton = screen.getByTestId('status-complete-button');
    fireEvent.click(statusButton);

    // FirestoreのupdateDocが正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: 'finished',
        })
      );
    }, { timeout: 3000 });

    // onStatusChangeコールバックが呼ばれることを確認
    expect(mockOnStatusChange).toHaveBeenCalledWith('finished');
  });

  /**
   * テストケース: null書籍の処理
   * 
   * 目的: 書籍データがnullの場合、コンポーネントが適切に処理されることを確認
   * 
   * テストステップ:
   * 1. 書籍データをnullにしてBookStatusChangerをレンダリング
   * 2. コンポーネントが正常にレンダリングされることを確認
   * 3. ボタンが表示されないことを確認
   */
  it('handles null book gracefully', () => {
    renderWithProviders(
      <BookStatusChanger book={null} onStatusChange={mockOnStatusChange} />
    );

    // コンポーネントが正常にレンダリングされることを確認
    expect(screen.queryByTestId('status-complete-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('status-reading-button')).not.toBeInTheDocument();
  });
}); 