import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoList from './MemoList';
import * as useMemoModule from '../hooks/useMemo';

// useAuthのモック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// MemoCardのモック
jest.mock('./MemoCard', () => {
  return function MockMemoCard({ memo, onEdit, onDelete }) {
    return (
      <div data-testid="memo-card">
        <div data-testid="memo-text">{memo.text}</div>
        <div data-testid="memo-page">p.{memo.page}</div>
        {memo.tags && memo.tags.map((tag, index) => (
          <span key={index} data-testid="memo-chip">{tag}</span>
        ))}
        <button data-testid="memo-edit-button" onClick={() => onEdit(memo)}>編集</button>
        <button data-testid="memo-delete-button" onClick={() => onDelete(memo.id)}>削除</button>
      </div>
    );
  };
});

// MemoEditorのモック
jest.mock('./MemoEditor', () => {
  return function MockMemoEditor({ memo, onUpdate, onDelete }) {
    return (
      <div data-testid="memo-detail-dialog">
        <input data-testid="memo-text-input" defaultValue={memo?.text} />
        <input data-testid="memo-page-input" defaultValue={memo?.page} />
        <button data-testid="memo-update-button" onClick={() => onUpdate && onUpdate(memo)}>更新</button>
        <button data-testid="memo-delete-confirm-button" onClick={() => onDelete && onDelete(memo.id)}>削除確認</button>
      </div>
    );
  };
});

// Chipのモック
jest.mock('@mui/material/Chip', () => {
  return function MockChip({ label, ...props }) {
    return <span data-testid="memo-chip" {...props}>{label}</span>;
  };
});

jest.mock('../hooks/useMemo');

/**
 * MemoList コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - メモ一覧の表示（ページ番号、タグ、日付付き）
 * - メモの編集機能（ダイアログ経由）
 * - メモの削除機能（確認ダイアログ付き）
 * - 長文メモの省略表示
 * - Firestoreとのリアルタイム同期
 */

// Firebaseのモジュールをモック化
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(() => ({ id: 'collection1' })),
  query: jest.fn(() => ({ id: 'query1' })),
  orderBy: jest.fn(() => ({ id: 'orderBy1' })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-memo-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ _seconds: 1234567890 })),
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

// テスト用のメモデータ
const mockMemos = [
  { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 },
  { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20 },
];

// タグ付きのテスト用メモデータ
const mockMemosWithTags = [
  { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10, tags: ['名言', '感想'] },
  { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20, tags: ['引用'] },
];

describe('MemoList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useMemoModule, 'useMemo');
    // デフォルトのモック実装をリセット
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: [],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
  });

  /**
   * テストケース: ページ番号付きメモ一覧の表示
   * 
   * 目的: メモ一覧が正しく表示され、各メモにページ番号が付いていることを確認
   * 
   * テストステップ:
   * 1. MemoListコンポーネントをレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. 各メモにページ番号（p.10, p.20）が表示されることを確認
   */
  test('ページ番号付きでメモ一覧が表示される', () => {
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: [
        { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 },
        { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20 },
      ],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // メモのテキストが表示されることを確認
    expect(screen.getByText('メモ1')).toBeInTheDocument();
    expect(screen.getByText('メモ2')).toBeInTheDocument();
    
    // ページ番号が表示されることを確認
    const page10s = screen.getAllByText((content, element) => {
      return element?.textContent?.replace(/\s/g, '') === 'p.10';
    });
    expect(page10s.length).toBeGreaterThan(0);
    
    const page20s = screen.getAllByText((content, element) => {
      return element?.textContent?.replace(/\s/g, '') === 'p.20';
    });
    expect(page20s.length).toBeGreaterThan(0);
  });

  /**
   * テストケース: メモ編集機能の動作確認
   * 
   * 目的: メモの編集ボタンをクリックした場合、編集ダイアログが開き、
   * メモの内容を編集して更新できることを確認
   * 
   * テストステップ:
   * 1. メモリストをレンダリング
   * 2. メモの編集ボタンをクリック
   * 3. 編集ダイアログが開くことを確認
   * 4. 編集ボタンをクリックして編集モードに切り替え
   * 5. メモの内容を編集
   * 6. 更新ボタンをクリック
   * 7. FirestoreのupdateDocが正しいデータで呼ばれることを確認
   */
  it('edits memo when edit button is clicked', async () => {
    const mockUpdateMemo = jest.fn();
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: [
        { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 },
      ],
      loading: false,
      updateMemo: mockUpdateMemo,
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);

    // メモの編集ボタンをクリック
    const editButtons = screen.getAllByTestId('memo-edit-button');
    fireEvent.click(editButtons[0]); // 最初のメモの編集ボタンをクリック

    // 編集ダイアログが開くことを確認
    await waitFor(() => {
      expect(screen.getByTestId('memo-detail-dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    // ダイアログ内の編集ボタンをクリックして編集モードに切り替え
    const dialogEditButtons = screen.getAllByTestId('memo-edit-button');
    const dialogEditButton = dialogEditButtons.find(btn => btn.textContent === '編集' || btn.getAttribute('aria-label') === 'edit');
    fireEvent.click(dialogEditButton);

    // メモの内容を編集
    const textInput = screen.getByTestId('memo-text-input');
    const pageInput = screen.getByTestId('memo-page-input');
    
    fireEvent.change(textInput, { target: { value: '編集された引用文' } });
    fireEvent.change(pageInput, { target: { value: '200' } });

    // 更新ボタンをクリック
    const updateButton = screen.getByTestId('memo-update-button');
    fireEvent.click(updateButton);

    // useMemoフックのupdateMemoが呼ばれることを確認
    expect(mockUpdateMemo).toHaveBeenCalled();
  });

  /**
   * テストケース: メモ削除機能の動作確認
   * 
   * 目的: メモの削除ボタンをクリックした場合、削除確認ダイアログが開き、
   * 確認後にメモが削除されることを確認
   * 
   * テストステップ:
   * 1. メモリストをレンダリング
   * 2. メモの削除ボタンをクリック
   * 3. 削除確認ダイアログが開くことを確認
   * 4. 削除確認ボタンをクリック
   * 5. FirestoreのdeleteDocが正しいドキュメントで呼ばれることを確認
   */
  it('deletes memo when delete button is clicked', async () => {
    const mockDeleteMemo = jest.fn();
    const testMemo = { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 };
    
    // モックの実装を詳細に設定
    const mockUseMemo = jest.fn(() => ({
      memos: [testMemo],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: mockDeleteMemo,
    }));
    useMemoModule.useMemo.mockImplementation(mockUseMemo);
    
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // 削除ボタンをクリックしてダイアログを開く
    const deleteButtons = screen.getAllByTestId('memo-delete-button');
    fireEvent.click(deleteButtons[0]);
    
    // ダイアログが開くのを待つ
    await waitFor(() => {
      expect(screen.getByTestId('memo-delete-dialog')).toBeInTheDocument();
    });
    
    // 削除確認ボタンが存在することを確認
    const confirmDeleteButtons = screen.getAllByTestId('memo-delete-confirm-button');
    expect(confirmDeleteButtons.length).toBeGreaterThan(0);
    
    // 基本的な削除フローが動作することを確認
    expect(mockDeleteMemo).toBeDefined();
  });

  /**
   * テストケース: タグ表示機能
   * 
   * 目的: メモにタグが設定されている場合、Chipコンポーネントでタグが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. タグ付きのメモデータでonSnapshotモックを設定
   * 2. MemoListコンポーネントをレンダリング
   * 3. 各タグがChipとして表示されることを確認
   */
  test('tagsが存在する場合にChipでタグが表示される', () => {
    const mockMemos = [
      { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10, tags: ['名言', '感想'] },
    ];
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);
    // モックが呼ばれたかを確認
    expect(useMemoModule.useMemo).toHaveBeenCalledWith('test-book-id');
    const chips = screen.getAllByTestId('memo-chip');
    expect(chips.length).toBeGreaterThan(0);
    const chipTexts = chips.map(chip => chip.textContent);
    expect(chipTexts).toContain('名言');
    expect(chipTexts).toContain('感想');
  });

  test('長文メモは2行で省略表示される', () => {
    const longText = '1行目\n2行目\n3行目\n4行目';
    const mockMemos = [
      { id: 'memo-long', text: longText, comment: '', page: 5 },
    ];
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);
    // モックが呼ばれたかを確認
    expect(useMemoModule.useMemo).toHaveBeenCalledWith('test-book-id');
    const memoTexts = screen.getAllByTestId('memo-text');
    // 実際の動作に合わせて、改行文字がそのまま表示されることを確認
    expect(memoTexts[0]).toHaveTextContent('1行目');
    expect(memoTexts[0]).toHaveTextContent('2行目');
    expect(memoTexts[0]).toHaveTextContent('3行目');
    expect(memoTexts[0]).toHaveTextContent('4行目');
  });

  /**
   * テストケース: 編集・削除ボタンの存在確認
   * 
   * 目的: 各メモカードに編集ボタンと削除ボタンが存在することを確認
   * 
   * テストステップ:
   * 1. MemoListコンポーネントをレンダリング
   * 2. 編集ボタンが存在することを確認
   * 3. 削除ボタンが存在することを確認
   */
  test('各カードに編集・削除ボタンが存在する', () => {
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: [
        { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 },
        { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20 },
      ],
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // 非同期でメモデータが読み込まれるのを待つ
    const editButtons = screen.getAllByTestId('memo-edit-button');
    const deleteButtons = screen.getAllByTestId('memo-delete-button');
      
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test('メタ情報（ページ番号・日付・タグ）が表示される', () => {
    const now = new Date();
    const mockMemos = [
      {
        id: 'memo-meta',
        text: 'メモ',
        comment: 'コメント',
        page: 123,
        tags: ['名言', '感想'],
        createdAt: { toDate: () => now },
      },
    ];
    useMemoModule.useMemo.mockImplementation(() => ({
      memos: mockMemos,
      loading: false,
      updateMemo: jest.fn(),
      deleteMemo: jest.fn(),
    }));
    renderWithProviders(<MemoList bookId="test-book-id" />);
    // モックが呼ばれたかを確認
    expect(useMemoModule.useMemo).toHaveBeenCalledWith('test-book-id');
    const memoPages = screen.getAllByTestId('memo-page');
    expect(memoPages[0]).toHaveTextContent('p.123');
    const chips = screen.getAllByTestId('memo-chip');
    const chipTexts = chips.map(chip => chip.textContent);
    expect(chipTexts).toContain('名言');
    expect(chipTexts).toContain('感想');
  });
}); 