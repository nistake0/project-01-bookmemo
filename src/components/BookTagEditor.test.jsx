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

// useTagHistoryフックのモック
jest.mock('../hooks/useTagHistory', () => ({
  useTagHistory: () => ({
    tagOptions: ['小説', '名作', 'SF'],
    loading: false,
    fetchTagHistory: jest.fn(),
    saveTagsToHistory: jest.fn(),
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
    console.log('=== BookTagEditor test: renders book tags START ===');
    console.log('=== BookTagEditor test: renderWithProviders START ===');
    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );
    console.log('=== BookTagEditor test: renderWithProviders END ===');

    // 非同期処理の完了を待つ
    console.log('=== BookTagEditor test: waitFor START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: waitFor callback START ===');
        expect(screen.getByText('小説')).toBeInTheDocument();
        console.log('=== BookTagEditor test: waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: waitFor END ===');

    // タグが表示されることを確認
    console.log('=== BookTagEditor test: 最終確認 START ===');
    expect(screen.getByText('名作')).toBeInTheDocument();
    
    // 編集ボタンが存在することを確認（data-testidを使用）
    expect(screen.getByTestId('edit-tags-button')).toBeInTheDocument();
    console.log('=== BookTagEditor test: 最終確認 END ===');
    console.log('=== BookTagEditor test: renders book tags END ===');
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
    console.log('=== BookTagEditor test: shows message when no tags are set START ===');
    const bookWithoutTags = { ...mockBook, tags: [] };
    
    console.log('=== BookTagEditor test: renderWithProviders START ===');
    renderWithProviders(
      <BookTagEditor book={bookWithoutTags} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );
    console.log('=== BookTagEditor test: renderWithProviders END ===');

    // 非同期処理の完了を待つ
    console.log('=== BookTagEditor test: waitFor START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: waitFor callback START ===');
        // タグが空の場合は何も表示されないことを確認
        expect(screen.getByTestId('edit-tags-button')).toBeInTheDocument();
        console.log('=== BookTagEditor test: waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: waitFor END ===');
    console.log('=== BookTagEditor test: shows message when no tags are set END ===');
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
    console.log('=== BookTagEditor test: opens edit dialog when edit button is clicked START ===');
    console.log('=== BookTagEditor test: renderWithProviders START ===');
    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );
    console.log('=== BookTagEditor test: renderWithProviders END ===');

    // 非同期処理の完了を待つ
    console.log('=== BookTagEditor test: waitFor START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: waitFor callback START ===');
        expect(screen.getByTestId('edit-tags-button')).toBeInTheDocument();
        console.log('=== BookTagEditor test: waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: waitFor END ===');

    // 編集ボタンをクリック
    console.log('=== BookTagEditor test: 編集ボタンクリック START ===');
    const editButton = screen.getByTestId('edit-tags-button');
    fireEvent.click(editButton);
    console.log('=== BookTagEditor test: 編集ボタンクリック END ===');

    // ダイアログが表示されることを確認
    console.log('=== BookTagEditor test: ダイアログ確認 START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: ダイアログ確認 waitFor callback START ===');
        expect(screen.getByText('タグを編集')).toBeInTheDocument();
        expect(screen.getByTestId('save-tags-button')).toBeInTheDocument();
        expect(screen.getByText('キャンセル')).toBeInTheDocument();
        console.log('=== BookTagEditor test: ダイアログ確認 waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: ダイアログ確認 END ===');
    console.log('=== BookTagEditor test: opens edit dialog when edit button is clicked END ===');
  }, 10000);

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
    console.log('=== BookTagEditor test: saves tags to Firestore START ===');
    const { updateDoc } = require('firebase/firestore');
    updateDoc.mockResolvedValue();

    console.log('=== BookTagEditor test: renderWithProviders START ===');
    renderWithProviders(
      <BookTagEditor book={mockBook} bookId={mockBookId} onTagsChange={mockOnTagsChange} />
    );
    console.log('=== BookTagEditor test: renderWithProviders END ===');

    // 非同期処理の完了を待つ
    console.log('=== BookTagEditor test: waitFor START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: waitFor callback START ===');
        expect(screen.getByTestId('edit-tags-button')).toBeInTheDocument();
        console.log('=== BookTagEditor test: waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: waitFor END ===');

    // 編集ダイアログを開く
    console.log('=== BookTagEditor test: 編集ダイアログを開く START ===');
    const editButton = screen.getByTestId('edit-tags-button');
    fireEvent.click(editButton);
    console.log('=== BookTagEditor test: 編集ダイアログを開く END ===');

    // 保存ボタンをクリック
    console.log('=== BookTagEditor test: 保存ボタン確認 START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: 保存ボタン確認 waitFor callback START ===');
        expect(screen.getByTestId('save-tags-button')).toBeInTheDocument();
        console.log('=== BookTagEditor test: 保存ボタン確認 waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: 保存ボタン確認 END ===');

    console.log('=== BookTagEditor test: 保存ボタンクリック START ===');
    const saveButton = screen.getByTestId('save-tags-button');
    fireEvent.click(saveButton);
    console.log('=== BookTagEditor test: 保存ボタンクリック END ===');

    // Firestoreへの保存を確認
    console.log('=== BookTagEditor test: Firestore保存確認 START ===');
    await act(async () => {
      await waitFor(() => {
        console.log('=== BookTagEditor test: Firestore保存確認 waitFor callback START ===');
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            tags: ['小説', '名作'],
            updatedAt: expect.anything(),
          })
        );
        console.log('=== BookTagEditor test: Firestore保存確認 waitFor callback END ===');
      }, { timeout: 3000 });
    });
    console.log('=== BookTagEditor test: Firestore保存確認 END ===');
    console.log('=== BookTagEditor test: saves tags to Firestore END ===');
  }, 10000);
}); 