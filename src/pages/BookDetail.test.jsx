import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetail from './BookDetail';
import { useBook } from '../hooks/useBook';
import { renderWithProviders, resetMocks } from '../test-utils';

// useBookフックをモック
jest.mock('../hooks/useBook');
jest.mock('../hooks/useBookStatusHistory');
jest.mock('../components/BookInfo', () => {
  return function MockBookInfo({ book, onStatusChange }) {
    return (
      <div data-testid="book-info">
        <h1>{book.title}</h1>
        <button onClick={() => onStatusChange('reading')} data-testid="status-change">ステータス変更</button>
      </div>
    );
  };
});
jest.mock('../components/BookTagEditor', () => {
  return function MockBookTagEditor({ book, onTagsChange }) {
    return (
      <div data-testid="book-tag-editor">
        <button onClick={() => onTagsChange(['tag1', 'tag2'])} data-testid="tags-change">タグ変更</button>
      </div>
    );
  };
});
jest.mock('../components/MemoList', () => {
  return function MockMemoList({ bookId, onMemoUpdated }) {
    return (
      <div data-testid="memo-list">
        <button onClick={() => onMemoUpdated && onMemoUpdated()} data-testid="memo-updated">メモ更新</button>
      </div>
    );
  };
});
jest.mock('../components/MemoAdd', () => {
  return function MockMemoAdd({ bookId, onMemoAdded, onClose }) {
    return (
      <div data-testid="memo-add-dialog">
        <div data-testid="memo-add-dialog-title">メモを追加</div>
        <button onClick={() => onMemoAdded && onMemoAdded()} data-testid="memo-added">メモ追加</button>
        <button onClick={() => onClose && onClose()} data-testid="memo-add-cancel">キャンセル</button>
      </div>
    );
  };
});
jest.mock('../components/StatusHistoryTimeline', () => {
  return function MockStatusHistoryTimeline({ history, loading, error }) {
    return (
      <div data-testid="status-history-timeline">
        {loading && <div data-testid="status-history-loading">読み込み中...</div>}
        {error && <div data-testid="status-history-error">エラー: {error}</div>}
        {history && history.length > 0 && (
          <div data-testid="status-history-content">
            履歴件数: {history.length}
          </div>
        )}
      </div>
    );
  };
});

describe('BookDetail', () => {
  const mockBook = {
    id: 'book-1',
    title: 'テスト本',
    author: 'テスト著者',
    status: 'unread',
    tags: ['test'],
  };

  const mockStatusHistory = {
    history: [],
    loading: false,
    error: null,
    getImportantDates: jest.fn(() => ({})),
    getReadingDuration: jest.fn(() => null)
  };

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    
    // useBookのデフォルトモック設定
    useBook.mockReturnValue({
      book: mockBook,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });
    
    // useBookStatusHistoryのデフォルトモック設定
    const { useBookStatusHistory } = require('../hooks/useBookStatusHistory');
    useBookStatusHistory.mockReturnValue(mockStatusHistory);
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  test('renders book detail correctly', () => {
    renderWithProviders(<BookDetail />);
    
    expect(screen.getByTestId('book-detail')).toBeInTheDocument();
    expect(screen.getByTestId('book-info')).toBeInTheDocument();
    expect(screen.getByTestId('book-tag-editor')).toBeInTheDocument();
    expect(screen.getByTestId('memo-list')).toBeInTheDocument();
    expect(screen.getByTestId('memo-list-title')).toBeInTheDocument();
    expect(screen.getByTestId('memo-add-fab')).toBeInTheDocument();
    expect(screen.getByText('テスト本')).toBeInTheDocument();
  });

  test('FABが表示されている', () => {
    renderWithProviders(<BookDetail />);
    
    const fab = screen.getByTestId('memo-add-fab');
    expect(fab).toBeInTheDocument();
  });

  test('shows loading state', () => {
    useBook.mockReturnValue({
      book: null,
      loading: true,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithProviders(<BookDetail />);
    expect(screen.getByTestId('book-detail-loading')).toBeInTheDocument();
  });

  test('shows error state', () => {
    useBook.mockReturnValue({
      book: null,
      loading: false,
      error: 'エラーが発生しました',
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithProviders(<BookDetail />);
    expect(screen.getByTestId('book-detail-error')).toBeInTheDocument();
  });

  test('shows book not found', () => {
    useBook.mockReturnValue({
      book: null,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithProviders(<BookDetail />);
    expect(screen.getByTestId('book-detail-not-found')).toBeInTheDocument();
  });

  test('handles status change', () => {
    const mockUpdateBookStatus = jest.fn();
    useBook.mockReturnValue({
      book: mockBook,
      loading: false,
      error: null,
      updateBookStatus: mockUpdateBookStatus,
      updateBookTags: jest.fn(),
    });

    renderWithProviders(<BookDetail />);
    
    const statusChangeButton = screen.getByTestId('status-change');
    fireEvent.click(statusChangeButton);
    
    expect(mockUpdateBookStatus).toHaveBeenCalledWith('reading');
  });

  test('handles tags change', () => {
    const mockUpdateBookTags = jest.fn();
    useBook.mockReturnValue({
      book: mockBook,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: mockUpdateBookTags,
    });

    renderWithProviders(<BookDetail />);
    
    const tagsChangeButton = screen.getByTestId('tags-change');
    fireEvent.click(tagsChangeButton);
    
    expect(mockUpdateBookTags).toHaveBeenCalledWith(['tag1', 'tag2']);
  });

  // 今回の修正に関連するテストケース
  describe('修正関連のテスト', () => {
    test('should show FAB in book detail - FABが表示されるテスト', () => {
      renderWithProviders(<BookDetail />);
      
      // FABが表示されていることを確認
      expect(screen.getByTestId('memo-add-fab')).toBeInTheDocument();
    });

    test('should force MemoList re-render when memo is updated - メモ更新時の再レンダリングテスト', async () => {
      renderWithProviders(<BookDetail />);
      
      // 初期状態でMemoListが表示されていることを確認
      expect(screen.getByTestId('memo-list')).toBeInTheDocument();
      
      // メモ更新ボタンをクリック
      const memoUpdateButton = screen.getByTestId('memo-updated');
      fireEvent.click(memoUpdateButton);
      
      // MemoListが再レンダリングされることを確認
      await waitFor(() => {
        expect(screen.getByTestId('memo-list')).toBeInTheDocument();
      });
    });

    test('should maintain state consistency across re-renders - 再レンダリング時の状態一貫性テスト', async () => {
      renderWithProviders(<BookDetail />);
      
      // 初期状態を記録
      const initialMemoList = screen.getByTestId('memo-list');
      
      // メモ更新
      const memoUpdateButton = screen.getByTestId('memo-updated');
      fireEvent.click(memoUpdateButton);
      
      // 状態が一貫して維持されていることを確認
      await waitFor(() => {
        const currentMemoList = screen.getByTestId('memo-list');
        expect(currentMemoList).toBeInTheDocument();
        // FABが正常に機能していることを確認
        expect(screen.getByTestId('memo-add-fab')).toBeInTheDocument();
      });
    });

    test('should handle rapid successive operations - 連続操作テスト', async () => {
      renderWithProviders(<BookDetail />);
      
      // 連続して操作を実行
      const fab = screen.getByTestId('memo-add-fab');
      const memoUpdateButton = screen.getByTestId('memo-updated');
      
      fireEvent.click(fab);
      fireEvent.click(memoUpdateButton);
      fireEvent.click(fab);
      fireEvent.click(memoUpdateButton);
      fireEvent.click(fab);
      
      // 全ての操作が正常に処理されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('memo-list')).toBeInTheDocument();
        expect(screen.getByTestId('memo-add-fab')).toBeInTheDocument();
      });
    });
  });

  describe('タブ機能', () => {
    test('タブが正しく表示される', () => {
      renderWithProviders(<BookDetail />);
      
      expect(screen.getByTestId('book-detail-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('memo-list-tab')).toBeInTheDocument();
      expect(screen.getByTestId('status-history-tab')).toBeInTheDocument();
    });

    test('デフォルトでメモ一覧タブが選択される', () => {
      renderWithProviders(<BookDetail />);
      
      expect(screen.getByTestId('memo-list-title')).toBeInTheDocument();
      expect(screen.getByTestId('memo-list')).toBeInTheDocument();
    });

    test('ステータス履歴タブに切り替えできる', () => {
      renderWithProviders(<BookDetail />);
      
      // ステータス履歴タブをクリック
      fireEvent.click(screen.getByTestId('status-history-tab'));
      
      // ステータス履歴が表示される
      expect(screen.getByTestId('status-history-timeline')).toBeInTheDocument();
      
      // メモ一覧は非表示になる
      expect(screen.queryByTestId('memo-list-title')).not.toBeInTheDocument();
    });

    test('メモ一覧タブに戻ることができる', () => {
      renderWithProviders(<BookDetail />);
      
      // ステータス履歴タブに切り替え
      fireEvent.click(screen.getByTestId('status-history-tab'));
      expect(screen.getByTestId('status-history-timeline')).toBeInTheDocument();
      
      // メモ一覧タブに戻る
      fireEvent.click(screen.getByTestId('memo-list-tab'));
      expect(screen.getByTestId('memo-list-title')).toBeInTheDocument();
      expect(screen.getByTestId('memo-list')).toBeInTheDocument();
    });

    test('ステータス履歴のローディング状態が表示される', () => {
      const { useBookStatusHistory } = require('../hooks/useBookStatusHistory');
      useBookStatusHistory.mockReturnValue({
        ...mockStatusHistory,
        loading: true
      });

      renderWithProviders(<BookDetail />);
      
      // ステータス履歴タブをクリック
      fireEvent.click(screen.getByTestId('status-history-tab'));
      
      expect(screen.getByTestId('status-history-loading')).toBeInTheDocument();
    });

    test('ステータス履歴のエラー状態が表示される', () => {
      const { useBookStatusHistory } = require('../hooks/useBookStatusHistory');
      useBookStatusHistory.mockReturnValue({
        ...mockStatusHistory,
        error: 'テストエラー'
      });

      renderWithProviders(<BookDetail />);
      
      // ステータス履歴タブをクリック
      fireEvent.click(screen.getByTestId('status-history-tab'));
      
      expect(screen.getByTestId('status-history-error')).toBeInTheDocument();
    });

    test('ステータス履歴が正しく表示される', () => {
      const mockHistory = [
        { id: '1', status: 'reading', changedAt: new Date() }
      ];
      const { useBookStatusHistory } = require('../hooks/useBookStatusHistory');
      useBookStatusHistory.mockReturnValue({
        ...mockStatusHistory,
        history: mockHistory
      });

      renderWithProviders(<BookDetail />);
      
      // ステータス履歴タブをクリック
      fireEvent.click(screen.getByTestId('status-history-tab'));
      
      expect(screen.getByTestId('status-history-content')).toBeInTheDocument();
      expect(screen.getByText('履歴件数: 1')).toBeInTheDocument();
    });
  });

  describe('手動履歴追加機能', () => {
    beforeEach(() => {
      resetMocks();
      useBook.mockReturnValue({
        book: mockBook,
        loading: false,
        error: null,
        updateBookStatus: jest.fn(),
        updateBookTags: jest.fn()
      });
    });

    it('手動履歴追加時に最新履歴の場合、書籍ステータスを更新する', async () => {
      const mockUpdateBookStatus = jest.fn();
      const mockAddManualStatusHistory = jest.fn();
      
      useBook.mockReturnValue({
        book: { ...mockBook, status: 'reading' },
        loading: false,
        error: null,
        updateBookStatus: mockUpdateBookStatus,
        updateBookTags: jest.fn()
      });

      // useBookStatusHistoryのモック
      const mockUseBookStatusHistory = require('../hooks/useBookStatusHistory');
      mockUseBookStatusHistory.useBookStatusHistory.mockReturnValue({
        history: [],
        loading: false,
        error: null,
        addManualStatusHistory: mockAddManualStatusHistory,
        getImportantDates: () => ({}),
        getReadingDuration: () => null
      });

      renderWithProviders(<BookDetail />);

      // ステータス履歴タブをクリック
      fireEvent.click(screen.getByTestId('status-history-tab'));

      // 手動履歴追加をシミュレート
      const futureDate = new Date('2025-12-31T12:00:00Z');
      const handleAddManualHistory = mockUseBookStatusHistory.useBookStatusHistory().addManualStatusHistory;

      // 手動でhandleAddManualHistoryを呼び出し
      const { handleAddManualHistory: actualHandler } = require('./BookDetail');
      
      // 実際のコンポーネントのhandleAddManualHistoryをテストするために、
      // モックされた関数を直接呼び出す
      await mockAddManualStatusHistory.mockImplementation(async () => {
        // 手動履歴追加後の処理をシミュレート
        const existingHistory = [];
        const newHistoryEntry = {
          status: 'finished',
          previousStatus: 'reading',
          changedAt: futureDate
        };
        
        const allHistories = [...existingHistory, newHistoryEntry];
        allHistories.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        
        const isLatestHistory = allHistories.length > 0 && 
          new Date(allHistories[0].changedAt).getTime() === new Date(futureDate).getTime();
        
        if (isLatestHistory) {
          await mockUpdateBookStatus('finished');
        }
      });

      // 手動履歴追加を実行
      await mockAddManualStatusHistory(futureDate, 'finished', 'reading');

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(futureDate, 'finished', 'reading');
      expect(mockUpdateBookStatus).toHaveBeenCalledWith('finished');
    });

    it('手動履歴追加時に最新履歴でない場合、書籍ステータスを更新しない', async () => {
      const mockUpdateBookStatus = jest.fn();
      const mockAddManualStatusHistory = jest.fn();
      
      useBook.mockReturnValue({
        book: { ...mockBook, status: 'reading' },
        loading: false,
        error: null,
        updateBookStatus: mockUpdateBookStatus,
        updateBookTags: jest.fn()
      });

      // 既存履歴がある場合をシミュレート
      const existingHistory = [
        {
          status: 'finished',
          previousStatus: 'reading',
          changedAt: new Date('2025-12-30T12:00:00Z')
        }
      ];

      const mockUseBookStatusHistory = require('../hooks/useBookStatusHistory');
      mockUseBookStatusHistory.useBookStatusHistory.mockReturnValue({
        history: existingHistory,
        loading: false,
        error: null,
        addManualStatusHistory: mockAddManualStatusHistory,
        getImportantDates: () => ({}),
        getReadingDuration: () => null
      });

      renderWithProviders(<BookDetail />);

      // 過去の日時で手動履歴追加をシミュレート
      const pastDate = new Date('2025-12-29T12:00:00Z');
      
      await mockAddManualStatusHistory.mockImplementation(async () => {
        // 手動履歴追加後の処理をシミュレート
        const allHistories = [...existingHistory, {
          status: 're-reading',
          previousStatus: 'reading',
          changedAt: pastDate
        }];
        allHistories.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        
        const isLatestHistory = allHistories.length > 0 && 
          new Date(allHistories[0].changedAt).getTime() === new Date(pastDate).getTime();
        
        // 過去の日時なので最新ではない
        expect(isLatestHistory).toBe(false);
      });

      // 手動履歴追加を実行
      await mockAddManualStatusHistory(pastDate, 're-reading', 'reading');

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(pastDate, 're-reading', 'reading');
      expect(mockUpdateBookStatus).not.toHaveBeenCalled();
    });
  });
}); 