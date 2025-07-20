import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookTagEditor from './BookTagEditor';
import { ErrorDialogContext } from './CommonErrorDialog';

/**
 * BookTagEditor コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - タグ表示
 * - タグ編集ダイアログ
 * - Firestoreへのタグ更新
 * - タグ履歴の取得と保存
 */

// Auth モック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
  }),
}));

const mockSetGlobalError = jest.fn();

/**
 * テスト用のレンダリング関数
 * ErrorDialogContextとBrowserRouterでコンポーネントをラップ
 */
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
  );
};

describe('BookTagEditor', () => {
  const mockBook = {
    id: 'test-book-id',
    title: 'テスト本',
    tags: ['小説', '名作'],
  };
  const mockBookId = 'test-book-id';
  const mockOnTagsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: タグの表示確認
   * 
   * 目的: 書籍のタグが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. BookTagEditorコンポーネントをレンダリング
   * 2. 書籍のタグがChipコンポーネントで表示されることを確認
   * 3. 編集ボタンが存在することを確認
   */
  it('renders book tags', async () => {
    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('小説')).toBeInTheDocument();
    }, { timeout: 10000 });

    // タグが表示されることを確認
    expect(screen.getByText('名作')).toBeInTheDocument();
    
    // 編集ボタンが存在することを確認
    expect(screen.getByRole('button')).toBeInTheDocument();
  }, 10000);

  /**
   * テストケース: タグが空の場合の表示
   * 
   * 目的: タグが設定されていない場合、適切なメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. タグが空の書籍データでBookTagEditorコンポーネントをレンダリング
   * 2. 「タグが設定されていません」メッセージが表示されることを確認
   */
  it('shows message when no tags are set', async () => {
    const bookWithoutTags = { ...mockBook, tags: [] };
    
    renderWithProviders(
      <BookTagEditor book={bookWithoutTags} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('タグが設定されていません')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 10000);

  /**
   * テストケース: タグ編集ダイアログの表示
   * 
   * 目的: 編集ボタンをクリックした場合、タグ編集ダイアログが表示されることを確認
   * 
   * テストステップ:
   * 1. BookTagEditorコンポーネントをレンダリング
   * 2. 編集ボタンをクリック
   * 3. タグ編集ダイアログが表示されることを確認
   */
  it('opens edit dialog when edit button is clicked', async () => {
    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 編集ボタンをクリック
    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);

    // ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('タグを編集')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  /**
   * テストケース: タグの保存
   * 
   * 目的: タグを編集して保存した場合、Firestoreに正しく保存されることを確認
   * 
   * テストステップ:
   * 1. FirestoreのupdateDocモックを設定
   * 2. 編集ダイアログを開く
   * 3. タグを編集
   * 4. 保存ボタンをクリック
   * 5. Firestoreに正しいデータが保存されることを確認
   */
  it('saves tags to Firestore', async () => {
    const { updateDoc } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 編集ダイアログを開く
    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);

    // 保存ボタンをクリック
    await waitFor(() => {
      expect(screen.getByText('保存')).toBeInTheDocument();
    }, { timeout: 10000 });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    // Firestoreへの保存を確認
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { id: 'test-doc-id' },
        expect.objectContaining({
          tags: ['小説', '名作'],
          updatedAt: 'mock-timestamp',
        })
      );
    }, { timeout: 10000 });
  }, 15000);
}); 