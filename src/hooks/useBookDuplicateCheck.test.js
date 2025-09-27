import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useBookDuplicateCheck } from './useBookDuplicateCheck';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

// モック設定
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('useBookDuplicateCheck', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockSetGlobalError = jest.fn();

  // Firestore モック関数を取得
  const { collection, query, where, getDocs } = require('firebase/firestore');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトモック設定
    useAuth.mockReturnValue({ user: mockUser });
    
    // Firestore モック設定
    collection.mockReturnValue('mock-collection');
    query.mockReturnValue('mock-query');
    where.mockReturnValue('mock-where');
  });

  // Provider ラッパー
  const wrapper = ({ children }) => (
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {children}
    </ErrorDialogContext.Provider>
  );

  const renderUseBookDuplicateCheck = () => {
    return renderHook(() => useBookDuplicateCheck(), { wrapper });
  };

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderUseBookDuplicateCheck();

      expect(result.current.isChecking).toBe(false);
      expect(result.current.duplicateBook).toBe(null);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.checkDuplicate).toBe('function');
      expect(typeof result.current.resetDuplicateCheck).toBe('function');
    });
  });

  describe('checkDuplicate関数', () => {
    it('ISBNが空の場合はnullを返す', async () => {
      const { result } = renderUseBookDuplicateCheck();

      let duplicateBook;
      await act(async () => {
        duplicateBook = await result.current.checkDuplicate('');
      });

      expect(duplicateBook).toBe(null);
      expect(result.current.duplicateBook).toBe(null);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('ユーザーが認証されていない場合はnullを返す', async () => {
      useAuth.mockReturnValue({ user: null });
      const { result } = renderUseBookDuplicateCheck();

      let duplicateBook;
      await act(async () => {
        duplicateBook = await result.current.checkDuplicate('9784873119485');
      });

      expect(duplicateBook).toBe(null);
      expect(result.current.duplicateBook).toBe(null);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('重複する書籍が見つかった場合、書籍データを返す', async () => {
      const mockDuplicateBook = {
        id: 'duplicate-book-id',
        title: '重複テスト本',
        author: '重複テスト著者',
        isbn: '9784873119485',
        userId: 'test-user-id'
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'duplicate-book-id',
          data: () => mockDuplicateBook
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderUseBookDuplicateCheck();

      let duplicateBook;
      await act(async () => {
        duplicateBook = await result.current.checkDuplicate('9784873119485');
      });

      expect(duplicateBook).toEqual({
        id: 'duplicate-book-id',
        ...mockDuplicateBook
      });
      expect(result.current.duplicateBook).toEqual({
        id: 'duplicate-book-id',
        ...mockDuplicateBook
      });
      expect(result.current.isChecking).toBe(false);

      // Firestoreクエリが正しく構築されることを確認
      expect(collection).toHaveBeenCalledWith({}, 'books');
      expect(where).toHaveBeenCalledWith('userId', '==', 'test-user-id');
      expect(where).toHaveBeenCalledWith('isbn', '==', '9784873119485');
    });

    it('重複する書籍が見つからない場合、nullを返す', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      const { result } = renderUseBookDuplicateCheck();

      let duplicateBook;
      await act(async () => {
        duplicateBook = await result.current.checkDuplicate('9784873119485');
      });

      expect(duplicateBook).toBe(null);
      expect(result.current.duplicateBook).toBe(null);
      expect(result.current.isChecking).toBe(false);
    });

    it('Firestoreエラーが発生した場合、エラー状態を設定する', async () => {
      const mockError = new Error('Firestore error');
      getDocs.mockRejectedValue(mockError);

      const { result } = renderUseBookDuplicateCheck();

      let duplicateBook;
      await act(async () => {
        duplicateBook = await result.current.checkDuplicate('9784873119485');
      });

      expect(duplicateBook).toBe(null);
      expect(result.current.duplicateBook).toBe(null);
      expect(result.current.error).toBe('書籍の重複チェックに失敗しました: Firestore error');
      expect(result.current.isChecking).toBe(false);
      expect(mockSetGlobalError).toHaveBeenCalledWith('書籍の重複チェックに失敗しました: Firestore error');
    });
  });

  describe('resetDuplicateCheck関数', () => {
    it('重複チェック状態をリセットできる', async () => {
      const { result } = renderUseBookDuplicateCheck();

      // まず重複チェックを実行して状態を設定
      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: 'duplicate-book-id',
          data: () => ({
            title: '重複テスト本',
            isbn: '9784873119485'
          })
        }]
      };

      getDocs.mockResolvedValue(mockQuerySnapshot);

      await act(async () => {
        await result.current.checkDuplicate('9784873119485');
      });

      expect(result.current.duplicateBook).not.toBe(null);

      // リセットを実行
      act(() => {
        result.current.resetDuplicateCheck();
      });

      expect(result.current.duplicateBook).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isChecking).toBe(false);
    });
  });
});
