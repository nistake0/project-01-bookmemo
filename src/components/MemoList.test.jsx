import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemoList from './MemoList';
import { useMemo } from '../hooks/useMemo';
import { renderWithProviders, resetMocks } from '../test-utils';

// useMemoフックをモック
jest.mock('../hooks/useMemo');
jest.mock('./MemoCard', () => {
  return function MockMemoCard({ memo, onEdit, onDelete }) {
    return (
      <div data-testid={`memo-card-${memo.id}`}>
        <span>{memo.text}</span>
        <button onClick={() => onEdit(memo)} data-testid={`edit-${memo.id}`}>編集</button>
        <button onClick={() => onDelete(memo.id)} data-testid={`delete-${memo.id}`}>削除</button>
      </div>
    );
  };
});
jest.mock('./MemoEditor', () => {
  return function MockMemoEditor({ open, memo, onUpdate, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="memo-editor">
        <button onClick={() => {
          // 実際のMemoEditorの動作を模倣：onUpdateを呼び出してからエディタを閉じる
          if (onUpdate) {
            onUpdate();
          }
          onClose();
        }} data-testid="update-button">更新</button>
      </div>
    );
  };
});

describe('MemoList', () => {
  const mockUseMemo = useMemo;
  const mockMemos = [
    { id: 'memo-1', text: 'テストメモ1', comment: 'コメント1', tags: ['tag1'] },
    { id: 'memo-2', text: 'テストメモ2', comment: 'コメント2', tags: ['tag2'] },
  ];

  beforeEach(() => {
    resetMocks();
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    });
  });

  test('renders memo list correctly', () => {
    render(<MemoList bookId="book-1" />);
    
    expect(screen.getByTestId('memo-card-memo-1')).toBeInTheDocument();
    expect(screen.getByTestId('memo-card-memo-2')).toBeInTheDocument();
    expect(screen.getByText('テストメモ1')).toBeInTheDocument();
    expect(screen.getByText('テストメモ2')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseMemo.mockReturnValue({
      memos: [],
      loading: true,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    });

    render(<MemoList bookId="book-1" />);
    expect(screen.getByText('メモを読み込み中...')).toBeInTheDocument();
  });

  test('shows empty state', () => {
    mockUseMemo.mockReturnValue({
      memos: [],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    });

    render(<MemoList bookId="book-1" />);
    expect(screen.getByText('まだメモはありません。')).toBeInTheDocument();
  });

  test('handles edit button click', () => {
    render(<MemoList bookId="book-1" />);
    
    const editButton = screen.getByTestId('edit-memo-1');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('memo-editor')).toBeInTheDocument();
  });

  test('handles delete button click', () => {
    const mockDeleteMemo = jest.fn();
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: mockDeleteMemo,
    });

    render(<MemoList bookId="book-1" />);
    
    const deleteButton = screen.getByTestId('delete-memo-1');
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('memo-delete-dialog')).toBeInTheDocument();
  });

  // 今回の修正に関連するテストケース
  describe('修正関連のテスト', () => {
    test('should call onMemoUpdated callback when memo is updated - メモ更新時のコールバックテスト', async () => {
      const mockOnMemoUpdated = jest.fn();
      const mockUpdateMemo = jest.fn().mockResolvedValue(true);
      
      mockUseMemo.mockReturnValue({
        memos: mockMemos,
        loading: false,
        updateMemo: mockUpdateMemo,
        deleteMemo: jest.fn(),
      });

      render(<MemoList bookId="book-1" onMemoUpdated={mockOnMemoUpdated} />);
      
      // 編集ボタンをクリック
      const editButton = screen.getByTestId('edit-memo-1');
      fireEvent.click(editButton);
      
      // 更新ボタンをクリック
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      // onMemoUpdatedコールバックが呼ばれることを確認
      await waitFor(() => {
        expect(mockOnMemoUpdated).toHaveBeenCalledTimes(1);
      });
    });

    test('should not call onMemoUpdated when callback is not provided - コールバック未提供時のテスト', () => {
      const mockUpdateMemo = jest.fn().mockResolvedValue(true);
      
      mockUseMemo.mockReturnValue({
        memos: mockMemos,
        loading: false,
        updateMemo: mockUpdateMemo,
        deleteMemo: jest.fn(),
      });

      render(<MemoList bookId="book-1" />); // onMemoUpdatedを渡さない
      
      // 編集ボタンをクリック
      const editButton = screen.getByTestId('edit-memo-1');
      fireEvent.click(editButton);
      
      // 更新ボタンをクリック
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      // エラーが発生しないことを確認（onUpdateコールバックが呼ばれる）
      // 実際のMemoEditorではupdateMemoを呼び出すが、テストではonUpdateコールバックが呼ばれる
    });

    test('should handle memo deletion with confirmation - メモ削除確認テスト', async () => {
      const mockDeleteMemo = jest.fn().mockResolvedValue(true);
      
      mockUseMemo.mockReturnValue({
        memos: mockMemos,
        loading: false,
        updateMemo: jest.fn(),
        deleteMemo: mockDeleteMemo,
      });

      render(<MemoList bookId="book-1" />);
      
      // 削除ボタンをクリック
      const deleteButton = screen.getByTestId('delete-memo-1');
      fireEvent.click(deleteButton);
      
      // 確認ダイアログが表示されることを確認
      expect(screen.getByTestId('memo-delete-dialog')).toBeInTheDocument();
      expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument();
      
      // 削除確認ボタンをクリック
      const confirmDeleteButton = screen.getByTestId('memo-delete-confirm-button');
      fireEvent.click(confirmDeleteButton);
      
      // deleteMemoが呼ばれることを確認
      await waitFor(() => {
        expect(mockDeleteMemo).toHaveBeenCalledWith('memo-1');
      });
    });

    test('should close editor when update is successful - 更新成功時のエディタ閉じるテスト', () => {
      const mockUpdateMemo = jest.fn().mockResolvedValue(true);
      
      mockUseMemo.mockReturnValue({
        memos: mockMemos,
        loading: false,
        updateMemo: mockUpdateMemo,
        deleteMemo: jest.fn(),
      });

      render(<MemoList bookId="book-1" />);
      
      // 編集ボタンをクリック
      const editButton = screen.getByTestId('edit-memo-1');
      fireEvent.click(editButton);
      
      // エディタが表示されることを確認
      expect(screen.getByTestId('memo-editor')).toBeInTheDocument();
      
      // 更新ボタンをクリック
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      // エディタが閉じられることを確認
      expect(screen.queryByTestId('memo-editor')).not.toBeInTheDocument();
    });

    test('should handle multiple memo updates without conflicts - 複数メモ更新の競合防止テスト', () => {
      const mockUpdateMemo = jest.fn().mockResolvedValue(true);
      const mockOnMemoUpdated = jest.fn();
      
      mockUseMemo.mockReturnValue({
        memos: mockMemos,
        loading: false,
        updateMemo: mockUpdateMemo,
        deleteMemo: jest.fn(),
      });

      render(<MemoList bookId="book-1" onMemoUpdated={mockOnMemoUpdated} />);
      
      // 最初のメモを編集
      const editButton1 = screen.getByTestId('edit-memo-1');
      fireEvent.click(editButton1);
      
      // 更新ボタンをクリック
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      // エディタが閉じられることを確認
      expect(screen.queryByTestId('memo-editor')).not.toBeInTheDocument();
      
      // 2番目のメモを編集
      const editButton2 = screen.getByTestId('edit-memo-2');
      fireEvent.click(editButton2);
      
      // エディタが再表示されることを確認
      expect(screen.getByTestId('memo-editor')).toBeInTheDocument();
      
      // 更新ボタンをクリック
      const updateButton2 = screen.getByTestId('update-button');
      fireEvent.click(updateButton2);
      
      // 両方の更新が正常に処理されることを確認
      // 実際のMemoEditorではupdateMemoを呼び出すが、テストではonUpdateコールバックが呼ばれる
      expect(mockOnMemoUpdated).toHaveBeenCalledTimes(2);
    });
  });
}); 