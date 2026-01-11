import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import MemoEditor from './MemoEditor';
import { renderWithProviders, resetMocks, setupCommonMocks } from '../test-utils';
import { createMockMemo, createMockFunctions } from '../test-factories';
import { MEMO_RATING } from '../constants/memoRating';

/**
 * MemoEditor コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - メモ詳細の表示（表示モード）
 * - メモ編集機能（編集モード）
 * - メモ削除機能（確認ダイアログ付き）
 * - オプションフィールドの処理（ページ番号、タグ、日付）
 * - モード切り替え（表示⇔編集）
 */

// AuthProvider モック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// useMemo モック
const mockUpdateMemo = jest.fn(() => Promise.resolve(true));
const mockDeleteMemo = jest.fn(() => Promise.resolve(true));
const mockMoveMemo = jest.fn(() => Promise.resolve('moved-memo-id'));

jest.mock('../hooks/useMemo', () => ({
  useMemo: (bookId) => ({
    memos: [],
    loading: false,
    error: null,
    addMemo: jest.fn(() => Promise.resolve('new-memo-id')),
    updateMemo: mockUpdateMemo,
    deleteMemo: mockDeleteMemo,
    moveMemo: mockMoveMemo,
    fetchMemos: jest.fn(),
  }),
}));

const mockMemoMoveDialogProps = [];
jest.mock('./MemoMoveDialog', () => {
  const React = require('react');

  return (props) => {
    mockMemoMoveDialogProps.push(props);

    if (!props.open) {
      return null;
    }

    const handleMockSubmit = async () => {
      if (props.onMove) {
        await props.onMove({
          memoId: props.memo?.id,
          targetBookId: 'book-2',
        });
      }
      props.onSuccess?.('book-2');
    };

    return (
      <div data-testid="memo-move-dialog-mock">
        <button
          type="button"
          data-testid="memo-move-dialog-mock-submit"
          onClick={handleMockSubmit}
        >
          mock move
        </button>
        <button
          type="button"
          data-testid="memo-move-dialog-mock-close"
          onClick={props.onClose}
        >
          mock close
        </button>
      </div>
    );
  };
});

describe('MemoEditor', () => {
  const { mockOnClose, mockOnUpdate, mockOnDelete } = createMockFunctions();

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    mockUpdateMemo.mockClear();
    mockDeleteMemo.mockClear();
    mockMoveMemo.mockClear();
    mockMemoMoveDialogProps.length = 0;
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  it('opens move dialog when move button is clicked', () => {
    const mockMemo = createMockMemo();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('memo-move-dialog-mock')).not.toBeInTheDocument();

    const moveButton = screen.getByTestId('memo-move-button');
    fireEvent.click(moveButton);

    expect(screen.getByTestId('memo-move-dialog-mock')).toBeInTheDocument();
  });

  it('moves memo via move dialog and triggers callbacks', async () => {
    const mockMemo = createMockMemo();
    const { mockOnClose: onClose, mockOnUpdate: onUpdate } = createMockFunctions();
    const onMove = jest.fn();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={onClose}
        onUpdate={onUpdate}
        onMove={onMove}
      />
    );

    fireEvent.click(screen.getByTestId('memo-move-button'));

    fireEvent.click(screen.getByTestId('memo-move-dialog-mock-submit'));

    await waitFor(() =>
      expect(mockMoveMemo).toHaveBeenCalledWith({
        memoId: mockMemo.id,
        targetBookId: 'book-2',
      })
    );

    expect(onMove).toHaveBeenCalledWith('book-2');

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('memo-move-dialog-mock')).not.toBeInTheDocument();
    });
  });

  /**
   * テストケース: メモがnullの場合の処理
   * 
   * 目的: メモがnullの場合、何もレンダリングされないことを確認
   */
  it('renders nothing when memo is null', () => {
    const { container } = renderWithProviders(
      <MemoEditor 
        open={true}
        memo={null}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  /**
   * テストケース: 表示モードでのメモ詳細表示
   * 
   * 目的: 表示モードでメモの詳細情報（テキスト、コメント、タグ、ページ番号、作成日）が
   * 正しく表示されることを確認
   */
  it('renders memo details in view mode', () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル'],
      createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // メモ詳細のタイトルと内容が表示されることを確認
    const title = screen.getByTestId('memo-detail-title');
    expect(title).toHaveTextContent('メモ詳細');
    const text = screen.getByTestId('memo-detail-text');
    expect(text).toHaveTextContent('テストメモの内容');
    const comment = screen.getByTestId('memo-detail-comment');
    expect(comment).toHaveTextContent('テストコメント');
    
    // タグが表示されることを確認（データ内容のため、タグコンテナ内で確認）
    const tagsContainer = screen.getByTestId('memo-detail-tags');
    expect(tagsContainer).toHaveTextContent('テスト');
    expect(tagsContainer).toHaveTextContent('サンプル');
    
    // ページ番号と作成日が表示されることを確認
    const page = screen.getByTestId('memo-detail-page');
    expect(page).toHaveTextContent('p. 123');
    const createdAt = screen.getByTestId('memo-detail-created-at');
    expect(createdAt).toHaveTextContent('2024/1/1 10:00:00');
  });

  /**
   * テストケース: 編集モードへの切り替え
   * 
   * 目的: 編集ボタンをクリックした場合、編集フォームが表示されることを確認
   */
  it('shows edit form when edit button is clicked', () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 編集ボタンをクリック
    const editButton = screen.getByTestId('memo-edit-button');
    fireEvent.click(editButton);

    // 編集フォームの入力フィールドが表示されることを確認
    expect(screen.getByText('引用・抜き書き')).toBeInTheDocument();
    expect(screen.getAllByText('感想・コメント')).toHaveLength(2); // ラベルとlegendの両方に存在
    expect(screen.getAllByText('ページ番号')).toHaveLength(2); // ラベルとlegendの両方に存在
  });

  /**
   * テストケース: 削除確認ダイアログの表示
   * 
   * 目的: 削除ボタンをクリックした場合、削除確認ダイアログが表示されることを確認
   */
  it('shows delete confirmation when delete button is clicked', () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button');
    fireEvent.click(deleteButton);

    // 削除確認ダイアログが表示されることを確認
    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument();
  });

  /**
   * テストケース: 削除機能の実行
   * 
   * 目的: 削除確認ダイアログで「削除」を選択した場合、削除処理が実行されることを確認
   */
  it('deletes memo when confirmed', async () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('memo-delete-button');
    fireEvent.click(deleteButton);

    // 削除確認ダイアログで「削除」をクリック
    const confirmDeleteButton = screen.getByTestId('memo-delete-confirm-button');
    fireEvent.click(confirmDeleteButton);

    // 削除処理が実行されることを確認
    expect(mockDeleteMemo).toHaveBeenCalledWith(mockMemo.id);
    
    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  /**
   * テストケース: 編集内容の保存
   * 
   * 目的: 編集モードで内容を変更して保存した場合、更新処理が実行されることを確認
   */
  it('saves edited memo content', async () => {
    const mockMemo = createMockMemo({
      text: '元のメモ内容',
      comment: '元のコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // 編集ボタンをクリック
    const editButton = screen.getByTestId('memo-edit-button');
    fireEvent.click(editButton);

    // テキストを変更
    const textInput = screen.getByTestId('memo-text-input');
    fireEvent.change(textInput, { target: { value: '更新されたメモ内容' } });

    // 更新ボタンをクリック
    const updateButton = screen.getByTestId('memo-update-button');
    fireEvent.click(updateButton);

    // 更新処理が実行されることを確認
    expect(mockUpdateMemo).toHaveBeenCalledWith(mockMemo.id, {
      text: '更新されたメモ内容',
      comment: '元のコメント',
      page: 123,
      tags: ['テスト', 'サンプル'],
      rating: 0 // デフォルトランク
    });
    
    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  /**
   * テストケース: ページ番号の表示と編集
   * 
   * 目的: ページ番号が正しく表示され、編集できることを確認
   */
  it('displays and allows editing page number', () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // ページ番号が表示されることを確認
    expect(screen.getByText('p. 123')).toBeInTheDocument();

    // 編集モードに切り替え
    const editButton = screen.getByTestId('memo-edit-button');
    fireEvent.click(editButton);

    // ページ番号入力フィールドが表示されることを確認
    const pageInput = screen.getByTestId('memo-page-input');
    expect(pageInput).toBeInTheDocument();
    expect(pageInput).toHaveValue(123);
  });

  /**
   * テストケース: タグの表示と編集
   * 
   * 目的: タグが正しく表示され、編集できることを確認
   */
  it('displays and allows editing tags', () => {
    const mockMemo = createMockMemo({
      text: 'テストメモの内容',
      comment: 'テストコメント',
      page: 123,
      tags: ['テスト', 'サンプル']
    });

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // タグが表示されることを確認
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('サンプル')).toBeInTheDocument();

    // 編集モードに切り替え
    const editButton = screen.getByTestId('memo-edit-button');
    fireEvent.click(editButton);

    // タグ入力フィールドが表示されることを確認
    const tagsInput = screen.getByTestId('memo-tags-input');
    expect(tagsInput).toBeInTheDocument();
  });

  // ランク機能のテスト
  test('ランクが設定されているメモでランクが表示される', () => {
    const mockMemo = createMockMemo({
      rating: MEMO_RATING.FOUR
    });
    const mockFunctions = createMockFunctions();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="test-book-id"
        onClose={mockFunctions.onClose}
        onUpdate={mockFunctions.onUpdate}
        onDelete={mockFunctions.onDelete}
      />
    );

    // ランクが表示されることを確認
    const ratingElement = screen.getByRole('img', { name: /4 Stars/i });
    expect(ratingElement).toBeInTheDocument();
  });

  test('ランクが未設定のメモでランクが表示されない', () => {
    const mockMemo = createMockMemo({
      rating: MEMO_RATING.NONE
    });
    const mockFunctions = createMockFunctions();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="test-book-id"
        onClose={mockFunctions.onClose}
        onUpdate={mockFunctions.onUpdate}
        onDelete={mockFunctions.onDelete}
      />
    );

    // ランクが表示されないことを確認
    const ratingElement = screen.queryByRole('img', { name: /Stars/i });
    expect(ratingElement).not.toBeInTheDocument();
  });

  test('編集モードでランク入力フィールドが表示される', async () => {
    const mockMemo = createMockMemo();
    const mockFunctions = createMockFunctions();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="test-book-id"
        onClose={mockFunctions.onClose}
        onUpdate={mockFunctions.onUpdate}
        onDelete={mockFunctions.onDelete}
        editMode={true}
      />
    );

    // ランク入力フィールドが表示されることを確認
    const ratingInput = screen.getByTestId('memo-rating-input');
    expect(ratingInput).toBeInTheDocument();
  });

  test('ランクを変更してメモを更新できる', async () => {
    const mockMemo = createMockMemo();
    const mockFunctions = createMockFunctions();

    renderWithProviders(
      <MemoEditor
        open={true}
        memo={mockMemo}
        bookId="test-book-id"
        onClose={mockFunctions.onClose}
        onUpdate={mockFunctions.onUpdate}
        onDelete={mockFunctions.onDelete}
        editMode={true}
      />
    );

    // ランク入力フィールドを取得（editMode=trueなので直接表示される）
    const ratingInput = screen.getByTestId('memo-rating-input');
    
    // ランクを4に変更（Ratingコンポーネントの星をクリック）
    // Ratingコンポーネント内の星ボタンを探す
    const stars = ratingInput.querySelectorAll('input[type="radio"]');
    expect(stars.length).toBeGreaterThan(0);
    
    // 4つ目の星（value=4）をクリック
    const fourthStar = Array.from(stars).find(star => star.value === '4');
    expect(fourthStar).toBeTruthy();
    fireEvent.click(fourthStar);

    // 更新ボタンをクリック
    const updateButton = screen.getByTestId('memo-update-button');
    fireEvent.click(updateButton);

    // updateMemoが正しいパラメータで呼ばれることを確認
    await waitFor(() => {
      expect(mockUpdateMemo).toHaveBeenCalledWith(
        mockMemo.id,
        expect.objectContaining({
          rating: MEMO_RATING.FOUR
        })
      );
    });
  });
}); 