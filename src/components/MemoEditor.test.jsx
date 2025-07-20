import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoEditor from './MemoEditor';

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

// Auth モック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
  }),
}));

// Firebaseのモック
jest.mock('../firebase', () => ({
  db: {},
}));

// Firestoreのモック
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'memo1' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ _seconds: 1234567890 })),
  collection: jest.fn(() => ({ id: 'collection1' })),
  query: jest.fn(() => ({ id: 'query1' })),
  orderBy: jest.fn(() => ({ id: 'orderBy1' })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
}));

// useTagHistoryフックのモック
jest.mock('../hooks/useTagHistory', () => ({
  useTagHistory: () => ({
    tagOptions: ['テスト', 'サンプル', 'メモ'],
    loading: false,
    fetchTagHistory: jest.fn(),
    saveTagsToHistory: jest.fn(),
  }),
}));

const theme = createTheme();

/**
 * テスト用のレンダリング関数
 * ThemeProviderとErrorDialogProviderでコンポーネントをラップ
 */
const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <ErrorDialogProvider>
        {component}
      </ErrorDialogProvider>
    </ThemeProvider>
  );
};

describe('MemoEditor', () => {
  // テスト用のメモデータ（全フィールド付き）
  const mockMemo = {
    id: 'memo1',
    text: 'テストメモの内容',
    comment: 'テストコメント',
    page: 123,
    tags: ['テスト', 'サンプル'],
    createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
  };

  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: メモがnullの場合の処理
   * 
   * 目的: メモがnullの場合、何もレンダリングされないことを確認
   * 
   * テストステップ:
   * 1. memo={null}でMemoEditorをレンダリング
   * 2. コンテナのfirstChildがnullであることを確認
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
   * 
   * テストステップ:
   * 1. 全フィールド付きのメモデータでMemoEditorをレンダリング
   * 2. メモ詳細のタイトルが表示されることを確認
   * 3. メモのテキスト、コメント、タグ、ページ番号、作成日が表示されることを確認
   */
  it('renders memo details in view mode', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // メモ詳細のタイトルと内容が表示されることを確認
    expect(screen.getByText('メモ詳細')).toBeInTheDocument();
    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.getByText('テストコメント')).toBeInTheDocument();
    
    // タグが表示されることを確認
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('サンプル')).toBeInTheDocument();
    
    // ページ番号と作成日が表示されることを確認
    expect(screen.getByText('p. 123')).toBeInTheDocument();
    expect(screen.getByText('2024/1/1 10:00:00')).toBeInTheDocument();
  });

  /**
   * テストケース: 編集モードへの切り替え
   * 
   * 目的: 編集ボタンをクリックした場合、編集フォームが表示されることを確認
   * 
   * テストステップ:
   * 1. 表示モードでMemoEditorをレンダリング
   * 2. 編集ボタンをクリック
   * 3. 編集フォームの入力フィールド（引用・抜き書き、感想・コメント、ページ番号）が表示されることを確認
   */
  it('shows edit form when edit button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 編集ボタンをクリック
    const editButton = screen.getByText('編集');
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
   * 
   * テストステップ:
   * 1. 表示モードでMemoEditorをレンダリング
   * 2. 削除ボタンをクリック
   * 3. 削除確認ダイアログのタイトルとメッセージが表示されることを確認
   */
  it('shows delete confirmation when delete button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 削除ボタンをクリック
    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    // 削除確認ダイアログが表示されることを確認
    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('このメモを削除すると、元に戻すことはできません。')).toBeInTheDocument();
  });

  /**
   * テストケース: 閉じるボタンの動作
   * 
   * 目的: 閉じるボタンをクリックした場合、onCloseコールバックが呼ばれることを確認
   * 
   * テストステップ:
   * 1. MemoEditorをレンダリング
   * 2. 閉じるボタンをクリック
   * 3. mockOnCloseが呼ばれることを確認
   */
  it('calls onClose when close button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 閉じるボタンをクリック（最初の閉じるボタンを選択）
    const closeButtons = screen.getAllByText('閉じる');
    const closeButton = closeButtons[0]; // 最初の閉じるボタンを選択
    fireEvent.click(closeButton);

    // onCloseコールバックが呼ばれることを確認
    expect(mockOnClose).toHaveBeenCalled();
  });

  /**
   * テストケース: オプションフィールドなしのメモ処理
   * 
   * 目的: コメント、ページ番号、タグなどのオプションフィールドがないメモでも
   * 正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 最小限のフィールド（id, text, createdAt）のみのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. オプションフィールド（ページ番号、タグ）が表示されないことを確認
   */
  it('handles memo without optional fields', () => {
    const minimalMemo = {
      id: 'memo2',
      text: '最小限のメモ',
      createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={minimalMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('最小限のメモ')).toBeInTheDocument();
    
    // オプションフィールドが表示されないことを確認
    expect(screen.queryByText('p.')).not.toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 作成日がnullの場合の処理
   * 
   * 目的: createdAtがnullの場合でもエラーが発生せず、適切に処理されることを確認
   * 
   * テストステップ:
   * 1. createdAtがnullのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. 作成日が表示されないことを確認
   */
  it('handles memo with null createdAt', () => {
    const memoWithoutDate = {
      id: 'memo3',
      text: '日付なしメモ',
      createdAt: null
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={memoWithoutDate}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('日付なしメモ')).toBeInTheDocument();
    
    // 作成日が表示されないことを確認
    expect(screen.queryByText('1/1/2024')).not.toBeInTheDocument();
  });

  /**
   * テストケース: タグがnullの場合の処理
   * 
   * 目的: tagsがnullの場合でもエラーが発生せず、適切に処理されることを確認
   * 
   * テストステップ:
   * 1. tagsがnullのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. タグが表示されないことを確認
   */
  it('handles memo with null tags', () => {
    const memoWithNullTags = {
      id: 'memo4',
      text: 'タグなしメモ',
      tags: null,
      createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={memoWithNullTags}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('タグなしメモ')).toBeInTheDocument();
    
    // タグが表示されないことを確認
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 編集モードのキャンセル機能
   * 
   * 目的: 編集モードでキャンセルボタンをクリックした場合、表示モードに戻ることを確認
   * 
   * テストステップ:
   * 1. 表示モードでMemoEditorをレンダリング
   * 2. 編集ボタンをクリックして編集モードに切り替え
   * 3. キャンセルボタンをクリック
   * 4. 表示モードに戻り、編集フォームが非表示になることを確認
   */
  it('cancels edit mode when cancel button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 編集モードに切り替え
    const editButton = screen.getByText('編集');
    fireEvent.click(editButton);

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    // 詳細表示モードに戻ることを確認
    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.queryByLabelText('引用・抜き書き')).not.toBeInTheDocument();
  });
}); 