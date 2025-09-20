import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockSetGlobalError, resetMocks } from '../test-utils';
import MemoAdd from './MemoAdd';
import { MEMO_RATING } from '../constants/memoRating';

// useMemoフックのモック
jest.mock('../hooks/useMemo', () => ({
  useMemo: jest.fn()
}));

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
  let mockAddMemo;

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    
    // mockAddMemoの定義
    mockAddMemo = jest.fn();
    const { useMemo } = require('../hooks/useMemo');
    useMemo.mockReturnValue({
      addMemo: mockAddMemo,
      memos: [],
      loading: false,
      error: null
    });
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
    mockAddMemo.mockResolvedValue('test-memo-id');
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
      expect(mockAddMemo).toHaveBeenCalledWith({
        text: 'テスト引用文',
        comment: 'テストコメント',
        page: 123,
        tags: [],
        rating: MEMO_RATING.NONE,
      });
    }, { timeout: 10000 });
  }, 15000);

  it('renders in dialog mode when onClose prop is provided', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(<MemoAdd bookId="test-book-id" onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('memo-add-dialog-title')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    expect(screen.getByTestId('memo-add-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('memo-add-submit')).toBeInTheDocument();
  }, 10000);

  it('calls onClose when cancel button is clicked in dialog mode', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(<MemoAdd bookId="test-book-id" onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('memo-add-cancel')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const cancelButton = screen.getByTestId('memo-add-cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  }, 10000);

  // ランク機能のテスト
  it('renders rating input field', async () => {
    renderWithProviders(<MemoAdd bookId="test-book-id" />);
    
    await waitFor(() => {
      const ratingInput = screen.getByTestId('memo-rating-input');
      expect(ratingInput).toBeInTheDocument();
    });
  });

  it('submits memo with rating', async () => {
    mockAddMemo.mockResolvedValue('test-memo-id');
    const mockOnMemoAdded = jest.fn();
    renderWithProviders(<MemoAdd bookId="test-book-id" onMemoAdded={mockOnMemoAdded} />);
    
    // テキスト入力
    const textInput = screen.getByTestId('memo-text-input');
    fireEvent.change(textInput, { target: { value: 'テストメモ' } });
    
    // ランクを5に設定（Ratingコンポーネントの星をクリック）
    const ratingInput = screen.getByTestId('memo-rating-input');
    const stars = ratingInput.querySelectorAll('input[type="radio"]');
    expect(stars.length).toBeGreaterThan(0);
    
    // 5つ目の星（value=5）をクリック
    const fifthStar = Array.from(stars).find(star => star.value === '5');
    expect(fifthStar).toBeTruthy();
    fireEvent.click(fifthStar);
    
    // 送信ボタンをクリック
    const submitButton = screen.getByTestId('memo-add-submit');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnMemoAdded).toHaveBeenCalled();
    });
  });

  it('shows rating description when rating is set', async () => {
    renderWithProviders(<MemoAdd bookId="test-book-id" />);
    
    // ランクを3に設定（Ratingコンポーネントの星をクリック）
    const ratingInput = screen.getByTestId('memo-rating-input');
    const stars = ratingInput.querySelectorAll('input[type="radio"]');
    expect(stars.length).toBeGreaterThan(0);
    
    // 3つ目の星（value=3）をクリック
    const thirdStar = Array.from(stars).find(star => star.value === '3');
    expect(thirdStar).toBeTruthy();
    fireEvent.click(thirdStar);
    
    // ランクの説明文が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('まあまあ面白かった')).toBeInTheDocument();
    });
  });

  // エラーハンドリングのテスト
  it('should handle addMemo error and show error message', async () => {
    const mockError = new Error('Firestore error');
    mockAddMemo.mockRejectedValue(mockError);

    renderWithProviders(<MemoAdd bookId="test-book-id" />);

    // フォームに入力
    const textInput = screen.getByTestId('memo-text-input');
    fireEvent.change(textInput, { target: { value: 'テスト引用文' } });

    // 送信ボタンをクリック
    const submitButton = screen.getByTestId('memo-add-submit');
    fireEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith('メモの追加に失敗しました。');
    });
  });

  it('should handle tag input with inputTagValue', async () => {
    mockAddMemo.mockResolvedValue('test-memo-id');
    
    renderWithProviders(<MemoAdd bookId="test-book-id" />);

    // タグ入力フィールドを取得
    const tagInput = screen.getByTestId('memo-tags-input');
    expect(tagInput).toBeInTheDocument();

    // タグを入力
    fireEvent.change(tagInput, { target: { value: '新規タグ' } });

    // テキスト入力
    const textInput = screen.getByTestId('memo-text-input');
    fireEvent.change(textInput, { target: { value: 'テストメモ' } });

    // 送信ボタンをクリック
    const submitButton = screen.getByTestId('memo-add-submit');
    fireEvent.click(submitButton);

    // タグが含まれてメモが追加されることを確認
    await waitFor(() => {
      expect(mockAddMemo).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining(['新規タグ'])
        })
      );
    });
  });
}); 