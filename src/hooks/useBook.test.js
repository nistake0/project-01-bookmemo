import { renderHook, act, waitFor } from '@testing-library/react';
import { useBook } from './useBook';
import { getDoc, updateDoc } from 'firebase/firestore';

// 依存するモジュールをモック化
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: jest.fn(),
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));

// ErrorDialogContextのモック
const mockSetGlobalError = jest.fn();
jest.mock('../components/CommonErrorDialog', () => ({
  ErrorDialogContext: {
    Provider: ({ children }) => children,
  },
}));

// React Testing Libraryのカスタムレンダラー
const renderUseBook = (bookId) => {
  const wrapper = ({ children }) => (
    <div>
      {children}
    </div>
  );
  
  return renderHook(() => useBook(bookId), { wrapper });
};

describe('useBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches book successfully', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
      author: 'テスト著者',
      status: 'reading',
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    const { result } = renderUseBook('book-1');

    // 初期状態
    expect(result.current.loading).toBe(true);
    expect(result.current.book).toBe(null);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.book).toEqual({
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
      author: 'テスト著者',
      status: 'reading',
    });
    expect(result.current.error).toBe(null);
  });

  test('handles book not found', async () => {
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    const { result } = renderUseBook('non-existent-book');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.book).toBe(null);
    expect(result.current.error).toBe("書籍が見つからないか、アクセス権限がありません。");
  });

  test('handles access denied', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'different-user-id', // 異なるユーザー
      title: 'テスト書籍',
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.book).toBe(null);
    expect(result.current.error).toBe("書籍が見つからないか、アクセス権限がありません。");
  });

  test('handles fetch error', async () => {
    getDoc.mockRejectedValue(new Error('Network error'));

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.book).toBe(null);
    expect(result.current.error).toBe("書籍情報の取得に失敗しました。");
  });

  test('updates book status successfully', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
      status: 'reading',
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    updateDoc.mockResolvedValue();

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateBookStatus('finished');
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        status: 'finished',
        updatedAt: expect.anything(),
      }
    );
  }, 10000);

  test('updates book tags successfully', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
      tags: ['小説'],
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    updateDoc.mockResolvedValue();

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateBookTags(['小説', '名作']);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        tags: ['小説', '名作'],
        updatedAt: expect.anything(),
      }
    );
  }, 10000);

  test('handles update error', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    updateDoc.mockRejectedValue(new Error('Update failed'));

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.updateBookStatus('finished');
      } catch (error) {
        expect(error.message).toBe('Update failed');
      }
    });
  }, 10000);

  test('returns null when no user or bookId', async () => {
    const { result } = renderUseBook(null);

    expect(result.current.book).toBe(null);
    expect(result.current.loading).toBe(true);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
}); 