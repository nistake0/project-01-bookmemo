import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockSetGlobalError, resetMocks } from '../test-utils';
import MemoAdd from './MemoAdd';

/**
 * MemoAdd コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - メモ追加フォームの表示
 * - フォーム入力とFirestoreへの保存
 * - バリデーション機能
 */

// AuthProviderのモックを共通化
describe('MemoAdd', () => {
  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  it('renders memo add form', async () => {
    renderWithProviders(<MemoAdd bookId="test-book-id" />);
    await waitFor(() => {
      expect(screen.getByTestId('memo-text-input')).toBeInTheDocument();
    }, { timeout: 10000 });
    expect(screen.getByTestId('memo-comment-input')).toBeInTheDocument();
    expect(screen.getByTestId('memo-page-input')).toBeInTheDocument();
    expect(screen.getByTestId('memo-tags-input')).toBeInTheDocument();
    expect(screen.getByTestId('memo-add-submit')).toBeInTheDocument();
  }, 10000);

  it('submits form and saves to Firestore', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-memo-id' });
    renderWithProviders(<MemoAdd bookId="test-book-id" />);
    await waitFor(() => {
      expect(screen.getByTestId('memo-text-input')).toBeInTheDocument();
    }, { timeout: 10000 });
    const textInput = screen.getByTestId('memo-text-input');
    const commentInput = screen.getByTestId('memo-comment-input');
    const pageInput = screen.getByTestId('memo-page-input');
    const submitButton = screen.getByTestId('memo-add-submit');
    fireEvent.change(textInput, { target: { value: 'テスト引用文' } });
    fireEvent.change(commentInput, { target: { value: 'テストコメント' } });
    fireEvent.change(pageInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
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