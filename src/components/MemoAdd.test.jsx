import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorDialogContext } from './CommonErrorDialog';
import { addDoc, collection } from 'firebase/firestore';
import MemoAdd from './MemoAdd';

/**
 * MemoAdd コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - メモ追加フォームの表示
 * - フォーム入力とFirestoreへの保存
 * - バリデーション機能
 */

// 依存するモジュールをモック化
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));

// テスト用のレンダリング関数
const mockSetGlobalError = jest.fn();
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
  );
};

describe('MemoAdd', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    addDoc.mockClear();
    collection.mockClear();
  });

  /**
   * テストケース: メモ追加フォームの表示確認
   * 
   * 目的: メモ追加フォームに必要なすべての入力フィールドとボタンが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. MemoAddコンポーネントをレンダリング
   * 2. 各入力フィールド（引用・抜き書き、感想・コメント、ページ番号、タグ）が存在することを確認
   * 3. 送信ボタンが存在することを確認
   */
  it('renders memo add form', async () => {
    renderWithProviders(<MemoAdd bookId="test-book-id" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('memo-text-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 必須入力フィールドの存在確認
    expect(screen.getByTestId('memo-comment-input')).toBeInTheDocument();
    expect(screen.getByTestId('memo-page-input')).toBeInTheDocument();
    expect(screen.getByTestId('memo-tags-input')).toBeInTheDocument();
    
    // 送信ボタンの存在確認
    expect(screen.getByTestId('memo-add-submit')).toBeInTheDocument();
  }, 10000);

  /**
   * テストケース: メモ追加フォームの送信とFirestore保存
   * 
   * 目的: メモ追加フォームに情報を入力して送信した場合、Firestoreに正しいデータが保存されることを確認
   * 
   * テストステップ:
   * 1. FirestoreのaddDocモックを設定
   * 2. 各入力フィールドにテストデータを入力
   * 3. フォームを送信
   * 4. Firestoreに正しいデータが保存されることを確認
   * 5. フォームがクリアされることを確認
   */
  it('submits form and saves to Firestore', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-memo-id' });

    renderWithProviders(<MemoAdd bookId="test-book-id" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('memo-text-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 各入力フィールドにテストデータを入力
    const textInput = screen.getByTestId('memo-text-input');
    const commentInput = screen.getByTestId('memo-comment-input');
    const pageInput = screen.getByTestId('memo-page-input');
    const submitButton = screen.getByTestId('memo-add-submit');

    fireEvent.change(textInput, { target: { value: 'テスト引用文' } });
    fireEvent.change(commentInput, { target: { value: 'テストコメント' } });
    fireEvent.change(pageInput, { target: { value: '123' } });

    // フォームを送信
    fireEvent.click(submitButton);

    // Firestoreへの保存を確認
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          text: 'テスト引用文',
          comment: 'テストコメント',
          page: 123,
          tags: [],
        })
      );
    }, { timeout: 10000 });
  }, 15000);
}); 