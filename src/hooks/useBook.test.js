import { renderHook, act, waitFor } from '@testing-library/react';
import { useBook } from './useBook';
import { getDoc, updateDoc } from 'firebase/firestore';

// 依存するモジュールをモック化
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: jest.fn(),
}));
// 安定した参照を持つモックユーザーオブジェクト
const mockUser = { uid: 'test-user-id' };
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ErrorDialogContextのモック
const mockSetGlobalError = jest.fn();
const mockErrorContext = { setGlobalError: mockSetGlobalError };

jest.mock('../components/CommonErrorDialog', () => ({
  ErrorDialogContext: {
    Provider: ({ children }) => children,
  },
}));

// React.useContextをモック
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: (context) => {
    if (context === require('../components/CommonErrorDialog').ErrorDialogContext) {
      return mockErrorContext;
    }
    return jest.requireActual('react').useContext(context);
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
    console.log('=== useBook test: fetches book successfully START ===');
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

    console.log('=== useBook test: renderUseBook START ===');
    const { result } = renderUseBook('book-1');
    console.log('=== useBook test: renderUseBook END ===');

    // 初期状態
    console.log('=== useBook test: 初期状態確認 START ===');
    expect(result.current.loading).toBe(true);
    expect(result.current.book).toBe(null);
    console.log('=== useBook test: 初期状態確認 END ===');

    // 非同期処理の完了を待つ
    console.log('=== useBook test: waitFor START ===');
    await waitFor(() => {
      console.log('=== useBook test: waitFor callback START ===');
      expect(result.current.loading).toBe(false);
      console.log('=== useBook test: waitFor callback END ===');
    });
    console.log('=== useBook test: waitFor END ===');

    console.log('=== useBook test: 最終確認 START ===');
    expect(result.current.book).toEqual({
      id: 'book-1',
      userId: 'test-user-id',
      title: 'テスト書籍',
      author: 'テスト著者',
      status: 'reading',
    });
    expect(result.current.error).toBe(null);
    console.log('=== useBook test: 最終確認 END ===');
    console.log('=== useBook test: fetches book successfully END ===');
  });

  test('handles book not found', async () => {
    console.log('=== useBook test: handles book not found START ===');
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
    console.log('=== useBook test: handles book not found END ===');
  });

  test('handles access denied', async () => {
    console.log('=== useBook test: handles access denied START ===');
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
    console.log('=== useBook test: handles access denied END ===');
  });

  test('handles fetch error', async () => {
    console.log('=== useBook test: handles fetch error START ===');
    getDoc.mockRejectedValue(new Error('Network error'));

    const { result } = renderUseBook('book-1');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.book).toBe(null);
    expect(result.current.error).toBe("書籍情報の取得に失敗しました。");
    console.log('=== useBook test: handles fetch error END ===');
  });

  test('updates book status successfully', async () => {
    console.log('=== useBook test: updates book status successfully START ===');
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

    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 更新処理を実行
    await act(async () => {
      await result.current.updateBookStatus('finished');
    });

    // 更新が呼ばれたことを確認
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        status: 'finished',
        updatedAt: expect.anything(),
      }
    );
    console.log('=== useBook test: updates book status successfully END ===');
  });

  test('updates book tags successfully', async () => {
    console.log('=== useBook test: updates book tags successfully START ===');
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

    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 更新処理を実行
    await act(async () => {
      await result.current.updateBookTags(['小説', '名作']);
    });

    // 更新が呼ばれたことを確認
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        tags: ['小説', '名作'],
        updatedAt: expect.anything(),
      }
    );
    console.log('=== useBook test: updates book tags successfully END ===');
  });

  test('handles update error', async () => {
    console.log('=== useBook test: handles update error START ===');
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

    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // エラー処理をテスト
    await act(async () => {
      try {
        await result.current.updateBookStatus('finished');
      } catch (error) {
        expect(error.message).toBe('Update failed');
      }
    });
    console.log('=== useBook test: handles update error END ===');
  });

  test('returns null when no user or bookId', async () => {
    console.log('=== useBook test: returns null when no user or bookId START ===');
    const { result } = renderUseBook(null);

    expect(result.current.book).toBe(null);
    expect(result.current.loading).toBe(false); // bookIdがnullの場合は即座にfalseになる

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    console.log('=== useBook test: returns null when no user or bookId END ===');
  });
}); 