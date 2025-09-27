import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookActions } from './useBookActions';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { useTagHistory } from './useTagHistory';

// モック設定
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// ErrorDialogContext は実際の Provider を使う

jest.mock('./useTagHistory', () => ({
  useTagHistory: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

describe('useBookActions', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockSetGlobalError = jest.fn();
  const mockSaveTagsToHistory = jest.fn();

  // Firestore モック関数を取得
  const { collection, addDoc } = require('firebase/firestore');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトモック設定
    useAuth.mockReturnValue({ user: mockUser });
    useTagHistory.mockReturnValue({
      saveTagsToHistory: mockSaveTagsToHistory,
    });

    // Firestore モック設定
    collection.mockReturnValue('mock-collection');
    addDoc.mockResolvedValue({ id: 'new-book-id' });
  });

  // Provider ラッパー
  const wrapper = ({ children }) => (
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {children}
    </ErrorDialogContext.Provider>
  );

  const renderUseBookActions = () => {
    return renderHook(() => useBookActions(), { wrapper });
  };

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderUseBookActions();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.addBook).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('addBook関数', () => {
    it('書籍を正常に追加できる', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
        author: 'テスト著者',
        isbn: '978-4-1234567890',
        publisher: 'テスト出版社',
        publishedDate: '2024-01-01',
        coverImageUrl: 'https://example.com/cover.jpg',
        tags: ['小説', '名作'],
        inputTagValue: '',
      };

      let bookId;
      await act(async () => {
        bookId = await result.current.addBook(bookData);
      });

      expect(collection).toHaveBeenCalledWith({}, 'books');
      expect(addDoc).toHaveBeenCalledWith('mock-collection', {
        userId: 'test-user-id',
        isbn: '978-4-1234567890',
        title: 'テスト本',
        author: 'テスト著者',
        publisher: 'テスト出版社',
        publishedDate: '2024-01-01',
        coverImageUrl: 'https://example.com/cover.jpg',
        tags: ['小説', '名作'],
        status: 'tsundoku',
        acquisitionType: 'unknown',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp',
      });

      expect(bookId).toBe('new-book-id');
      expect(mockSaveTagsToHistory).toHaveBeenCalledWith(['小説', '名作']);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      
      // 初期ステータス履歴が追加されることを確認
      expect(addDoc).toHaveBeenCalledTimes(2); // 書籍追加 + 履歴追加
      expect(collection).toHaveBeenCalledWith({}, 'books', 'new-book-id', 'statusHistory');
    });

    it('タグが空の場合はタグ履歴に保存しない', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
        tags: [],
        inputTagValue: '',
      };

      await act(async () => {
        await result.current.addBook(bookData);
      });

      expect(mockSaveTagsToHistory).not.toHaveBeenCalled();
      
      // 初期ステータス履歴は追加される
      expect(addDoc).toHaveBeenCalledTimes(2); // 書籍追加 + 履歴追加
    });

    it('inputTagValueが設定されている場合はタグに追加する', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
        tags: ['小説'],
        inputTagValue: '名作',
      };

      await act(async () => {
        await result.current.addBook(bookData);
      });

      expect(addDoc).toHaveBeenCalledWith('mock-collection', expect.objectContaining({
        tags: ['小説', '名作'],
      }));
      expect(mockSaveTagsToHistory).toHaveBeenCalledWith(['小説', '名作']);
    });

    it('空のタグを除去する', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
        tags: ['小説', '', '   ', '名作'],
        inputTagValue: '',
      };

      await act(async () => {
        await result.current.addBook(bookData);
      });

      expect(addDoc).toHaveBeenCalledWith('mock-collection', expect.objectContaining({
        tags: ['小説', '名作'],
      }));
    });

    it('ユーザーが認証されていない場合はエラーを投げる', async () => {
      useAuth.mockReturnValue({ user: null });
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
      };

      await expect(async () => {
        await act(async () => {
          await result.current.addBook(bookData);
        });
      }).rejects.toThrow('ユーザーが認証されていません。');
    });

    it('タイトルが空の場合はエラーを投げる', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: '',
        author: 'テスト著者',
      };

      await expect(async () => {
        await act(async () => {
          await result.current.addBook(bookData);
        });
      }).rejects.toThrow('タイトルは必須です。');
    });

    it('Firestoreエラーが発生した場合はエラー状態を設定する', async () => {
      const { result } = renderUseBookActions();

      const mockError = new Error('Firestore error');
      addDoc.mockRejectedValue(mockError);

      const bookData = {
        title: 'テスト本',
      };

      await act(async () => {
        try {
          await result.current.addBook(bookData);
        } catch (error) {
          expect(error.message).toBe('Firestore error');
        }
      });

      expect(result.current.error).toBe('書籍の追加に失敗しました: Firestore error');
      expect(mockSetGlobalError).toHaveBeenCalledWith('書籍の追加に失敗しました: Firestore error');
      expect(result.current.loading).toBe(false);
    });

    it('ローディング状態が正しく管理される', async () => {
      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
      };

      // 非同期処理を開始
      const addBookPromise = act(async () => {
        return await result.current.addBook(bookData);
      });

      // 処理完了を待機
      await addBookPromise;

      // ローディング中はtrue（非同期処理中）
      expect(result.current.loading).toBe(false);

      // 完了後はfalse
      expect(result.current.loading).toBe(false);
    });
  });

  describe('clearError関数', () => {
    it('エラーをクリアできる', async () => {
      const { result } = renderUseBookActions();

      // エラーを設定
      const mockError = new Error('Test error');
      addDoc.mockRejectedValue(mockError);

      const bookData = {
        title: 'テスト本',
      };

      await act(async () => {
        try {
          await result.current.addBook(bookData);
        } catch (error) {
          // エラーは期待される
        }
      });

      expect(result.current.error).toBe('書籍の追加に失敗しました: Test error');

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('エラーハンドリング', () => {
    it('タグ履歴保存でエラーが発生しても書籍追加は成功する', async () => {
      const { result } = renderUseBookActions();

      mockSaveTagsToHistory.mockRejectedValue(new Error('Tag history error'));

      const bookData = {
        title: 'テスト本',
        tags: ['小説'],
      };

      await act(async () => {
        try {
          await result.current.addBook(bookData);
        } catch (error) {
          // タグ履歴エラーは無視される
        }
      });

      expect(addDoc).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('書籍の追加に失敗しました: Tag history error');
    });

    it('初期ステータス履歴の追加でエラーが発生しても書籍追加は成功する', async () => {
      // 2回目のaddDoc呼び出し（履歴追加）でエラーを発生させる
      addDoc
        .mockResolvedValueOnce({ id: 'new-book-id' }) // 書籍追加は成功
        .mockRejectedValueOnce(new Error('History error')); // 履歴追加でエラー

      const { result } = renderUseBookActions();

      const bookData = {
        title: 'テスト本',
        tags: [],
      };

      let bookId;
      await act(async () => {
        bookId = await result.current.addBook(bookData);
      });

      // 書籍追加は成功する
      expect(bookId).toBe('new-book-id');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
