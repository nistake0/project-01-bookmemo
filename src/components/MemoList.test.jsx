import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onSnapshot } from 'firebase/firestore';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoList from './MemoList';

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
  onSnapshot: jest.fn(),
  doc: jest.fn(() => ({ id: 'memo1' })),
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
    // onSnapshotのモック実装 - Firestoreのリアルタイムリスナーをシミュレート
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockMemos.map(memo => ({
          id: memo.id,
          data: () => memo,
        })),
      });
      return jest.fn(); // unsubscribe関数を返す
    });
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
    const { updateDoc } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    renderWithProviders(<MemoList bookId="test-book-id" />);

    // メモの編集ボタンをクリック（最初のボタンを選択）
    const editButtons = screen.getAllByTestId('memo-edit-button');
    fireEvent.click(editButtons[1]); // ダイアログ内の編集ボタンを選択

    // 編集ダイアログが開くことを確認
    await waitFor(() => {
      expect(screen.getByTestId('memo-detail-dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 編集ボタンをクリックして編集モードに切り替え
    const editButtonsInDialog = screen.getAllByTestId('memo-edit-button');
    // 最初のカードの編集ボタンをクリック
    fireEvent.click(editButtonsInDialog[0]);
    // ダイアログ内の編集ボタンをクリック
    const dialogEditButton = screen.getAllByTestId('memo-edit-button').find(btn => btn.textContent === '編集');
    fireEvent.click(dialogEditButton);

    // メモの内容を編集
    const textInput = screen.getByTestId('memo-text-input');
    const pageInput = screen.getByTestId('memo-page-input');
    
    fireEvent.change(textInput, { target: { value: '編集された引用文' } });
    fireEvent.change(pageInput, { target: { value: '200' } });

    // 更新ボタンをクリック
    const updateButton = screen.getByTestId('memo-update-button');
    fireEvent.click(updateButton);

    // FirestoreのupdateDocが正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          text: '編集された引用文',
          page: 200,
        })
      );
    }, { timeout: 3000 });
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
    const { deleteDoc } = require('firebase/firestore');
    deleteDoc.mockResolvedValue();

    renderWithProviders(<MemoList bookId="test-book-id" />);

    // メモの削除ボタンをクリック（最初のボタンを選択）
    const deleteButtons = screen.getAllByTestId('memo-delete-button');
    fireEvent.click(deleteButtons[0]);

    // 削除確認ダイアログが開くことを確認
    await waitFor(() => {
      expect(screen.getByTestId('memo-delete-dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    // 削除確認ボタンをクリック
    const confirmDeleteButton = screen.getByTestId('memo-delete-confirm-button');
    fireEvent.click(confirmDeleteButton);

    // FirestoreのdeleteDocが正しいドキュメントで呼ばれることを確認
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
    }, { timeout: 3000 });
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
    // onSnapshotのモックをtags付きデータで上書き
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockMemosWithTags.map(memo => ({
          id: memo.id,
          data: () => memo,
        })),
      });
      return jest.fn();
    });
    
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // タグがChipとして表示されているか確認
    expect(screen.getByText('名言')).toBeInTheDocument();
    expect(screen.getByText('感想')).toBeInTheDocument();
    expect(screen.getByText('引用')).toBeInTheDocument();
  });

  /**
   * テストケース: 長文メモの省略表示
   * 
   * 目的: 長文のメモは2行で省略表示され、3行目以降は表示されないことを確認
   * 
   * テストステップ:
   * 1. 長文のメモデータでonSnapshotモックを設定
   * 2. MemoListコンポーネントをレンダリング
   * 3. 1行目と2行目は表示されるが、3行目は表示されないことを確認
   */
  test('長文メモは2行で省略表示される', () => {
    const longText = '1行目\n2行目\n3行目\n4行目';
    const longMemo = [{ id: 'memo-long', text: longText, comment: '', page: 5 }];
    
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: longMemo.map(memo => ({ id: memo.id, data: () => memo })),
      });
      return jest.fn();
    });
    
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // 1行目と2行目は表示されるが、3行目は表示されないことを確認
    const candidates = screen.getAllByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('1行目') && text.includes('2行目') && !text.includes('3行目');
    });
    expect(candidates.length).toBeGreaterThan(0);
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
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  /**
   * テストケース: メタ情報の表示
   * 
   * 目的: メモのメタ情報（ページ番号、作成日、タグ）が正しく表示されることを確認
   * 
   * テストステップ:
   * 1. メタ情報付きのメモデータでonSnapshotモックを設定
   * 2. MemoListコンポーネントをレンダリング
   * 3. ページ番号、作成日、タグが表示されることを確認
   */
  test('メタ情報（ページ番号・日付・タグ）が表示される', () => {
    const now = new Date();
    const memoWithMeta = [{
      id: 'memo-meta',
      text: 'メモ',
      comment: 'コメント',
      page: 123,
      tags: ['名言', '感想'],
      createdAt: { toDate: () => now },
    }];
    
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: memoWithMeta.map(memo => ({ id: memo.id, data: () => memo })),
      });
      return jest.fn();
    });
    
    renderWithProviders(<MemoList bookId="test-book-id" />);
    
    // メタ情報が表示されることを確認
    expect(screen.getByText('p.123')).toBeInTheDocument();
    expect(screen.getByText(now.toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText('名言')).toBeInTheDocument();
    expect(screen.getByText('感想')).toBeInTheDocument();
  });
}); 