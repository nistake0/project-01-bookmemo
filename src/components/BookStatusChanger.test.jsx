import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
import BookStatusChanger from './BookStatusChanger';
import { ErrorDialogContext } from './CommonErrorDialog';
import { BOOK_STATUS } from '../constants/bookStatus';

/**
 * BookStatusChanger コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - ステータスメニューの表示
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
    status: BOOK_STATUS.TSUNDOKU,
  };

  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: ステータス表示とメニュー
   */
  it('displays correct status chip and change button', () => {
    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // ステータスチップが表示される
    expect(screen.getByTestId('book-status-chip')).toBeInTheDocument();
    expect(screen.getByText('積読')).toBeInTheDocument();

    // ステータス変更ボタンが表示される
    expect(screen.getByTestId('book-status-change-button')).toBeInTheDocument();
    expect(screen.getByText('ステータス変更')).toBeInTheDocument();
  });

  /**
   * テストケース: ステータスメニューの表示
   */
  it('opens status menu when button is clicked', async () => {
    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // ステータス変更ボタンをクリック
    const statusButton = screen.getByTestId('book-status-change-button');
    fireEvent.click(statusButton);

    // メニューが表示される
    await waitFor(() => {
      expect(screen.getByTestId('book-status-menu')).toBeInTheDocument();
    });

    // 全ステータスのメニューアイテムが表示される
    expect(screen.getByTestId('status-menu-item-tsundoku')).toBeInTheDocument();
    expect(screen.getByTestId('status-menu-item-reading')).toBeInTheDocument();
    expect(screen.getByTestId('status-menu-item-re-reading')).toBeInTheDocument();
    expect(screen.getByTestId('status-menu-item-finished')).toBeInTheDocument();
  });

  /**
   * テストケース: ステータス変更時のFirestore更新
   */
  it('updates Firestore when status is changed', async () => {
    const { updateDoc } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // ステータス変更ボタンをクリック
    const statusButton = screen.getByTestId('book-status-change-button');
    fireEvent.click(statusButton);

    // メニューが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-status-menu')).toBeInTheDocument();
    });

    // 積読ステータスを選択
    const tsundokuItem = screen.getByTestId('status-menu-item-tsundoku');
    fireEvent.click(tsundokuItem);

    // FirestoreのupdateDocが正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: BOOK_STATUS.TSUNDOKU,
        })
      );
    }, { timeout: 3000 });

    // onStatusChangeコールバックが呼ばれることを確認
    expect(mockOnStatusChange).toHaveBeenCalledWith(BOOK_STATUS.TSUNDOKU);
  });

  /**
   * テストケース: 読了時のfinishedAtフィールド設定
   */
  it('sets finishedAt when status is changed to finished', async () => {
    const { updateDoc, serverTimestamp } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // ステータス変更ボタンをクリック
    const statusButton = screen.getByTestId('book-status-change-button');
    fireEvent.click(statusButton);

    // メニューが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-status-menu')).toBeInTheDocument();
    });

    // 読了ステータスを選択
    const finishedItem = screen.getByTestId('status-menu-item-finished');
    fireEvent.click(finishedItem);

    // FirestoreのupdateDocがfinishedAtフィールド付きで呼ばれることを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: BOOK_STATUS.FINISHED,
          finishedAt: 'mock-timestamp',
        })
      );
    }, { timeout: 3000 });
  });

  /**
   * テストケース: ローディング状態の表示
   */
  it('displays loading state during update', async () => {
    const { updateDoc } = require('firebase/firestore');
    // 更新を遅延させる
    updateDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(
      <BookStatusChanger book={mockBook} onStatusChange={mockOnStatusChange} />
    );

    // ステータス変更ボタンをクリック
    const statusButton = screen.getByTestId('book-status-change-button');
    fireEvent.click(statusButton);

    // メニューが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-status-menu')).toBeInTheDocument();
    });

    // ステータスを変更
    const tsundokuItem = screen.getByTestId('status-menu-item-tsundoku');
    fireEvent.click(tsundokuItem);

    // ローディング状態が表示される
    expect(screen.getByText('更新中...')).toBeInTheDocument();
  });

  /**
   * テストケース: null書籍の処理
   */
  it('handles null book gracefully', () => {
    renderWithProviders(
      <BookStatusChanger book={null} onStatusChange={mockOnStatusChange} />
    );

    // コンポーネントが表示されないことを確認
    expect(screen.queryByTestId('book-status-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('book-status-change-button')).not.toBeInTheDocument();
  });

  /**
   * テストケース: デフォルトステータスの処理
   */
  it('uses default status when book status is undefined', () => {
    const bookWithoutStatus = { ...mockBook };
    delete bookWithoutStatus.status;

    renderWithProviders(
      <BookStatusChanger book={bookWithoutStatus} onStatusChange={mockOnStatusChange} />
    );

    // デフォルトステータス（読書中）が表示される
    expect(screen.getByText('積読')).toBeInTheDocument();
  });
});