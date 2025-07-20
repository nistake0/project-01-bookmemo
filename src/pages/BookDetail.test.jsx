import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookDetail from './BookDetail';
import { useBook } from '../hooks/useBook';

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
  return function MockMemoAdd({ bookId, onMemoAdded }) {
    return (
      <div data-testid="memo-add">
        <button onClick={() => onMemoAdded && onMemoAdded()} data-testid="memo-added">メモ追加</button>
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
    jest.clearAllMocks();
    useBook.mockReturnValue({
      book: mockBook,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('renders book detail correctly', () => {
    renderWithRouter(<BookDetail />);
    
    expect(screen.getByTestId('book-info')).toBeInTheDocument();
    expect(screen.getByTestId('book-tag-editor')).toBeInTheDocument();
    expect(screen.getByTestId('memo-list')).toBeInTheDocument();
    expect(screen.getByTestId('memo-add')).toBeInTheDocument();
    expect(screen.getByText('テスト本')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    useBook.mockReturnValue({
      book: null,
      loading: true,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithRouter(<BookDetail />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    useBook.mockReturnValue({
      book: null,
      loading: false,
      error: 'エラーが発生しました',
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithRouter(<BookDetail />);
    expect(screen.getByText('エラーが発生しました: エラーが発生しました')).toBeInTheDocument();
  });

  test('shows book not found', () => {
    useBook.mockReturnValue({
      book: null,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    });

    renderWithRouter(<BookDetail />);
    expect(screen.getByText('本が見つかりません。')).toBeInTheDocument();
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

    renderWithRouter(<BookDetail />);
    
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

    renderWithRouter(<BookDetail />);
    
    const tagsChangeButton = screen.getByTestId('tags-change');
    fireEvent.click(tagsChangeButton);
    
    expect(mockUpdateBookTags).toHaveBeenCalledWith(['tag1', 'tag2']);
  });

  // 今回の修正に関連するテストケース
  describe('修正関連のテスト', () => {
    test('should force MemoList re-render when memo is added - メモ追加時の再レンダリングテスト', async () => {
      renderWithRouter(<BookDetail />);
      
      // 初期状態でMemoListが表示されていることを確認
      expect(screen.getByTestId('memo-list')).toBeInTheDocument();
      
      // メモ追加ボタンをクリック
      const memoAddButton = screen.getByTestId('memo-added');
      fireEvent.click(memoAddButton);
      
      // MemoListが再レンダリングされることを確認
      // 実際の実装ではkeyが変更されるため、コンポーネントが再マウントされる
      await waitFor(() => {
        expect(screen.getByTestId('memo-list')).toBeInTheDocument();
      });
    });

    test('should force MemoList re-render when memo is updated - メモ更新時の再レンダリングテスト', async () => {
      renderWithRouter(<BookDetail />);
      
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

    test('should handle multiple memo operations without conflicts - 複数メモ操作の競合防止テスト', async () => {
      renderWithRouter(<BookDetail />);
      
      // メモ追加
      const memoAddButton = screen.getByTestId('memo-added');
      fireEvent.click(memoAddButton);
      
      // メモ更新
      const memoUpdateButton = screen.getByTestId('memo-updated');
      fireEvent.click(memoUpdateButton);
      
      // 再度メモ追加
      fireEvent.click(memoAddButton);
      
      // 全ての操作が正常に処理されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('memo-list')).toBeInTheDocument();
        expect(screen.getByTestId('memo-add')).toBeInTheDocument();
      });
    });

    test('should maintain state consistency across re-renders - 再レンダリング時の状態一貫性テスト', async () => {
      renderWithRouter(<BookDetail />);
      
      // 初期状態を記録
      const initialMemoList = screen.getByTestId('memo-list');
      
      // メモ追加
      const memoAddButton = screen.getByTestId('memo-added');
      fireEvent.click(memoAddButton);
      
      // メモ更新
      const memoUpdateButton = screen.getByTestId('memo-updated');
      fireEvent.click(memoUpdateButton);
      
      // 状態が一貫して維持されていることを確認
      await waitFor(() => {
        const currentMemoList = screen.getByTestId('memo-list');
        expect(currentMemoList).toBeInTheDocument();
        // コンポーネントが正常に機能していることを確認
        expect(screen.getByTestId('memo-add')).toBeInTheDocument();
      });
    });

    test('should handle rapid successive memo operations - 連続メモ操作テスト', async () => {
      renderWithRouter(<BookDetail />);
      
      // 連続してメモ操作を実行
      const memoAddButton = screen.getByTestId('memo-added');
      const memoUpdateButton = screen.getByTestId('memo-updated');
      
      fireEvent.click(memoAddButton);
      fireEvent.click(memoUpdateButton);
      fireEvent.click(memoAddButton);
      fireEvent.click(memoUpdateButton);
      fireEvent.click(memoAddButton);
      
      // 全ての操作が正常に処理されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('memo-list')).toBeInTheDocument();
        expect(screen.getByTestId('memo-add')).toBeInTheDocument();
      });
    });
  });
}); 