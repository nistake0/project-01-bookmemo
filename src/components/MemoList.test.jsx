import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import MemoList from './MemoList';

// useMemoフックをモック
jest.mock('../hooks/useMemo', () => ({
  useMemo: jest.fn()
}));

// MemoEditorコンポーネントをモック
jest.mock('./MemoEditor', () => {
  return function MockMemoEditor({ open, memo, onClose, onUpdate, onDelete, editMode }) {
    if (!open) return null;
    return (
      <div data-testid="memo-detail-dialog">
        <div data-testid="memo-detail-title">メモ詳細</div>
        <div data-testid="memo-editor-memo-id">{memo?.id}</div>
        <div data-testid="memo-editor-edit-mode">{editMode ? 'edit' : 'view'}</div>
        <button onClick={onClose} data-testid="memo-close-button">閉じる</button>
        <button onClick={onUpdate} data-testid="memo-update-button">更新</button>
        <button onClick={onDelete} data-testid="memo-delete-button">削除</button>
      </div>
    );
  };
});

// MemoCardコンポーネントをモック
jest.mock('./MemoCard', () => {
  return function MockMemoCard({ memo, onEdit, onDelete, onClick }) {
    return (
      <div data-testid={`memo-card-${memo.id}`}>
        <div data-testid={`memo-text-${memo.id}`}>{memo.text}</div>
        <button onClick={() => onEdit(memo, true)} data-testid={`memo-edit-button-${memo.id}`}>編集</button>
        <button onClick={() => onDelete(memo.id)} data-testid={`memo-delete-button-${memo.id}`}>削除</button>
        <button onClick={() => onClick(memo)} data-testid={`memo-click-${memo.id}`}>クリック</button>
      </div>
    );
  };
});

describe('MemoList', () => {
  const mockUseMemo = require('../hooks/useMemo').useMemo;
  const mockMemos = [
    {
      id: 'memo1',
      text: 'テストメモ1',
      comment: 'テストコメント1',
      page: 123,
      tags: ['テスト', 'サンプル'],
      createdAt: { toDate: () => new Date('2024-01-01') }
    },
    {
      id: 'memo2',
      text: 'テストメモ2',
      comment: 'テストコメント2',
      page: 456,
      tags: ['テスト'],
      createdAt: { toDate: () => new Date('2024-01-02') }
    }
  ];

  const mockOnMemoUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: メモ一覧の表示
   * 
   * 目的: メモ一覧が正しく表示されることを確認
   * 
   * テストステップ:
   * 1. メモデータでMemoListをレンダリング
   * 2. メモカードが正しく表示されることを確認
   */
  it('renders memo list correctly', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // メモカードが表示されることを確認
    expect(screen.getByTestId('memo-card-memo1')).toBeInTheDocument();
    expect(screen.getByTestId('memo-card-memo2')).toBeInTheDocument();
    expect(screen.getByTestId('memo-text-memo1')).toHaveTextContent('テストメモ1');
    expect(screen.getByTestId('memo-text-memo2')).toHaveTextContent('テストメモ2');
  });

  /**
   * テストケース: ローディング状態の表示
   * 
   * 目的: ローディング中に適切なメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. loading: trueの状態でMemoListをレンダリング
   * 2. ローディングメッセージが表示されることを確認
   */
  it('shows loading state', () => {
    mockUseMemo.mockReturnValue({
      memos: [],
      loading: true,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    expect(screen.getByText('メモを読み込み中...')).toBeInTheDocument();
  });

  /**
   * テストケース: メモが0件の場合の表示
   * 
   * 目的: メモが0件の場合に適切なメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. メモが0件の状態でMemoListをレンダリング
   * 2. 0件メッセージが表示されることを確認
   */
  it('shows empty state when no memos', () => {
    mockUseMemo.mockReturnValue({
      memos: [],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    expect(screen.getByText('まだメモはありません。')).toBeInTheDocument();
  });

  /**
   * テストケース: メモカードのクリックで詳細ダイアログが開く（viewモード）
   * 
   * 目的: メモカードをクリックした時にMemoEditorがviewモードで開くことを確認
   * 
   * テストステップ:
   * 1. メモカードをクリック
   * 2. MemoEditorがviewモードで開くことを確認
   */
  it('opens memo editor in view mode when memo card is clicked', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // メモカードをクリック
    const memoCard = screen.getByTestId('memo-click-memo1');
    fireEvent.click(memoCard);

    // MemoEditorがviewモードで開くことを確認
    expect(screen.getByTestId('memo-detail-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('memo-editor-memo-id')).toHaveTextContent('memo1');
    expect(screen.getByTestId('memo-editor-edit-mode')).toHaveTextContent('view');
  });

  /**
   * テストケース: メモの編集機能（editモード）
   * 
   * 目的: 編集ボタンをクリックした時にMemoEditorがeditモードで開くことを確認
   * 
   * テストステップ:
   * 1. 編集ボタンをクリック
   * 2. MemoEditorがeditモードで開くことを確認
   */
  it('opens memo editor in edit mode when edit button is clicked', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // 編集ボタンをクリック
    const editButton = screen.getByTestId('memo-edit-button-memo1');
    fireEvent.click(editButton);

    // MemoEditorがeditモードで開くことを確認
    expect(screen.getByTestId('memo-detail-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('memo-editor-memo-id')).toHaveTextContent('memo1');
    expect(screen.getByTestId('memo-editor-edit-mode')).toHaveTextContent('edit');
  });

  /**
   * テストケース: メモの削除機能
   * 
   * 目的: 削除ボタンをクリックした時に削除確認ダイアログが開くことを確認
   * 
   * テストステップ:
   * 1. 削除ボタンをクリック
   * 2. 削除確認ダイアログが開くことを確認
   */
  it('opens delete confirmation dialog when delete button is clicked', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button-memo1');
    fireEvent.click(deleteButton);

    // 削除確認ダイアログが開くことを確認
    expect(screen.getByTestId('memo-delete-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('memo-delete-confirm-title')).toHaveTextContent('本当に削除しますか？');
  });

  /**
   * テストケース: 削除確認ダイアログのキャンセル
   * 
   * 目的: 削除確認ダイアログでキャンセルボタンをクリックした時にダイアログが閉じることを確認
   * 
   * テストステップ:
   * 1. 削除ボタンをクリックしてダイアログを開く
   * 2. キャンセルボタンをクリック
   * 3. ダイアログが閉じることを確認
   */
  it('closes delete dialog when cancel button is clicked', async () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button-memo1');
    fireEvent.click(deleteButton);

    // キャンセルボタンをクリック
    const cancelButton = screen.getByTestId('memo-delete-cancel-button');
    fireEvent.click(cancelButton);

    // ダイアログが閉じることを確認（アニメーションを考慮）
    await waitFor(() => {
      expect(screen.queryByTestId('memo-delete-dialog')).not.toBeInTheDocument();
    });
  });

  /**
   * テストケース: 削除確認ダイアログの削除実行
   * 
   * 目的: 削除確認ダイアログで削除ボタンをクリックした時に削除が実行されることを確認
   * 
   * テストステップ:
   * 1. 削除ボタンをクリックしてダイアログを開く
   * 2. 削除確認ボタンをクリック
   * 3. deleteMemoが呼ばれることを確認
   */
  it('executes delete when confirm button is clicked', async () => {
    const mockDeleteMemo = jest.fn().mockResolvedValue(undefined);
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: mockDeleteMemo
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button-memo1');
    fireEvent.click(deleteButton);

    // 削除確認ボタンをクリック
    const confirmButton = screen.getByTestId('memo-delete-confirm-button');
    fireEvent.click(confirmButton);

    // deleteMemoが呼ばれることを確認
    await waitFor(() => {
      expect(mockDeleteMemo).toHaveBeenCalledWith('memo1');
    });
  });

  /**
   * テストケース: MemoEditorの更新機能
   * 
   * 目的: MemoEditorで更新が実行された時にonMemoUpdatedが呼ばれることを確認
   * 
   * テストステップ:
   * 1. メモカードをクリックしてMemoEditorを開く
   * 2. MemoEditorの更新ボタンをクリック
   * 3. onMemoUpdatedが呼ばれることを確認
   */
  it('calls onMemoUpdated when memo is updated', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // メモカードをクリック
    const memoCard = screen.getByTestId('memo-click-memo1');
    fireEvent.click(memoCard);

    // 更新ボタンをクリック
    const updateButton = screen.getByTestId('memo-update-button');
    fireEvent.click(updateButton);

    // onMemoUpdatedが呼ばれることを確認
    expect(mockOnMemoUpdated).toHaveBeenCalled();
  });

  /**
   * テストケース: MemoEditorの削除機能
   * 
   * 目的: MemoEditorで削除が実行された時にonMemoUpdatedが呼ばれることを確認
   * 
   * テストステップ:
   * 1. メモカードをクリックしてMemoEditorを開く
   * 2. MemoEditorの削除ボタンをクリック
   * 3. onMemoUpdatedが呼ばれることを確認
   */
  it('calls onMemoUpdated when memo is deleted from editor', () => {
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn()
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // メモカードをクリック
    const memoCard = screen.getByTestId('memo-click-memo1');
    fireEvent.click(memoCard);

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button');
    fireEvent.click(deleteButton);

    // onMemoUpdatedが呼ばれることを確認
    expect(mockOnMemoUpdated).toHaveBeenCalled();
  });

  /**
   * テストケース: エラーハンドリング
   * 
   * 目的: 削除時にエラーが発生した場合に適切に処理されることを確認
   * 
   * テストステップ:
   * 1. deleteMemoがエラーを投げるようにモック
   * 2. 削除を実行
   * 3. エラーが適切に処理されることを確認
   */
  it('handles delete error gracefully', async () => {
    const mockDeleteMemo = jest.fn().mockRejectedValue(new Error('Delete failed'));
    mockUseMemo.mockReturnValue({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: mockDeleteMemo
    });

    renderWithProviders(
      <MemoList bookId="test-book-id" onMemoUpdated={mockOnMemoUpdated} />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button-memo1');
    fireEvent.click(deleteButton);

    // 削除確認ボタンをクリック
    const confirmButton = screen.getByTestId('memo-delete-confirm-button');
    fireEvent.click(confirmButton);

    // deleteMemoが呼ばれることを確認
    await waitFor(() => {
      expect(mockDeleteMemo).toHaveBeenCalledWith('memo1');
    });
  });
}); 