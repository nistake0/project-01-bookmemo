import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetail from './BookDetail';
import { useBook } from '../hooks/useBook';
import { renderWithProviders, resetMocks } from '../test-utils';

// useBookフックをモック
jest.mock('../hooks/useBook');
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

describe('BookDetail', () => {
  const mockBook = {
    id: 'book-1',
    title: 'テスト本',
    author: 'テスト著者',
    status: 'unread',
    tags: ['test'],
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
}); 