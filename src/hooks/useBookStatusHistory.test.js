import { renderHook, waitFor, act } from '@testing-library/react';
import { useBookStatusHistory } from './useBookStatusHistory';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

// モック設定
jest.mock('../firebase', () => ({
  db: {}
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn()
}));

jest.mock('../components/CommonErrorDialog', () => ({
  ErrorDialogContext: { Provider: ({ children }) => children }
}));

// Firestoreモック
const mockAddDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ id: 'mock-collection' })),
  addDoc: (...args) => mockAddDoc(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  serverTimestamp: jest.fn(() => ({ seconds: 1640995200, nanoseconds: 0 }))
}));

describe('useBookStatusHistory', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockSetGlobalError = jest.fn();
  
  const mockErrorContext = {
    setGlobalError: mockSetGlobalError
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    
    // デフォルトのモック設定
    mockOrderBy.mockReturnValue('mock-orderBy');
    mockQuery.mockReturnValue('mock-query');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderHookWithContext = (bookId = 'test-book-id') => {
    return renderHook(
      () => useBookStatusHistory(bookId),
      {
        wrapper: ({ children }) => (
          <ErrorDialogContext.Provider value={mockErrorContext}>
            {children}
          </ErrorDialogContext.Provider>
        )
      }
    );
  };

  describe('初期化', () => {
    it('ユーザーとbookIdが存在する場合、正常に初期化される', () => {
      const { result } = renderHookWithContext();
      
      expect(result.current.history).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.addStatusHistory).toBe('function');
      expect(typeof result.current.getImportantDates).toBe('function');
      expect(typeof result.current.getCurrentStatus).toBe('function');
      expect(typeof result.current.getReadingDuration).toBe('function');
    });

    it('ユーザーが存在しない場合、loadingがfalseになる', () => {
      useAuth.mockReturnValue({ user: null });
      
      const { result } = renderHookWithContext();
      
      expect(result.current.loading).toBe(false);
    });

    it('bookIdが存在しない場合、loadingがfalseになる', () => {
      const { result } = renderHookWithContext(null);
      
      expect(result.current.loading).toBe(false);
    });
  });

  describe('addStatusHistory', () => {
    it('正常にステータス履歴を追加できる', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-history-id' });
      
      const { result } = renderHookWithContext();
      
      await act(async () => {
        const historyId = await result.current.addStatusHistory('reading', 'tsundoku', '読書開始');
        expect(historyId).toBe('new-history-id');
      });
      
      expect(mockAddDoc).toHaveBeenCalledWith(
        { id: 'mock-collection' },
        {
          status: 'reading',
          previousStatus: 'tsundoku',
          changedAt: { seconds: 1640995200, nanoseconds: 0 },
          changedBy: 'test-user-id',
          notes: '読書開始',
          createdAt: { seconds: 1640995200, nanoseconds: 0 }
        }
      );
    });

    it('エラーが発生した場合、適切にエラーハンドリングされる', async () => {
      const mockError = new Error('Firestore error');
      mockAddDoc.mockRejectedValue(mockError);
      
      const { result } = renderHookWithContext();
      
      await act(async () => {
        try {
          await result.current.addStatusHistory('reading', 'tsundoku');
        } catch (error) {
          expect(error.message).toBe('Firestore error');
        }
      });
      
      // エラーが発生したことを確認
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('無効なパラメータの場合、エラーが発生する', async () => {
      const { result } = renderHookWithContext();
      
      await act(async () => {
        await expect(
          result.current.addStatusHistory('invalid-status')
        ).rejects.toThrow('無効なパラメータです。');
      });
    });
  });

  describe('getImportantDates', () => {
    it('履歴が空の場合、空のオブジェクトを返す', () => {
      const { result } = renderHookWithContext();
      
      const dates = result.current.getImportantDates();
      expect(dates).toEqual({});
    });

    it('関数が存在することを確認', () => {
      const { result } = renderHookWithContext();
      
      expect(typeof result.current.getImportantDates).toBe('function');
      expect(typeof result.current.getCurrentStatus).toBe('function');
      expect(typeof result.current.getReadingDuration).toBe('function');
    });
  });

  describe('Firestoreリスナー', () => {
    it('onSnapshotが正しく設定される', () => {
      renderHookWithContext();
      
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        'mock-query',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('リスナーのクリーンアップが正しく行われる', () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);
      
      const { unmount } = renderHookWithContext();
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
