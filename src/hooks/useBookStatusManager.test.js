import { renderHook, act } from '@testing-library/react';
import { useBookStatusManager } from './useBookStatusManager';

/**
 * useBookStatusManager フックのユニットテスト
 */
describe('useBookStatusManager', () => {
  let mockBook;
  let mockAddManualStatusHistory;
  let mockUpdateBookStatus;

  beforeEach(() => {
    mockBook = {
      id: 'test-book-id',
      title: 'テスト本',
      status: 'reading'
    };
    
    mockAddManualStatusHistory = jest.fn();
    mockUpdateBookStatus = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAddManualHistory', () => {
    it('手動履歴を正常に追加できる', async () => {
      mockAddManualStatusHistory.mockResolvedValue('new-history-id');
      
      const { result } = renderHook(() => 
        useBookStatusManager(mockBook, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const testDate = new Date('2025-12-31T12:00:00Z');
      const existingHistory = [];

      await act(async () => {
        await result.current.handleAddManualHistory(testDate, 'finished', 'reading', existingHistory);
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(testDate, 'finished', 'reading');
      expect(mockUpdateBookStatus).toHaveBeenCalledWith('finished');
    });

    it('過去履歴追加時は書籍ステータスを更新しない', async () => {
      mockAddManualStatusHistory.mockResolvedValue('new-history-id');
      
      const { result } = renderHook(() => 
        useBookStatusManager(mockBook, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const existingHistory = [
        {
          status: 'finished',
          previousStatus: 'reading',
          changedAt: new Date('2025-12-30T12:00:00Z')
        }
      ];

      const pastDate = new Date('2025-12-29T12:00:00Z');

      await act(async () => {
        await result.current.handleAddManualHistory(pastDate, 're-reading', 'reading', existingHistory);
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(pastDate, 're-reading', 'reading');
      expect(mockUpdateBookStatus).not.toHaveBeenCalled();
    });

    it('同じステータスの場合は書籍ステータスを更新しない', async () => {
      mockAddManualStatusHistory.mockResolvedValue('new-history-id');
      
      const sameStatusBook = { ...mockBook, status: 'finished' };
      
      const { result } = renderHook(() => 
        useBookStatusManager(sameStatusBook, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const futureDate = new Date('2025-12-31T12:00:00Z');
      const existingHistory = [];

      await act(async () => {
        await result.current.handleAddManualHistory(futureDate, 'finished', 'reading', existingHistory);
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(futureDate, 'finished', 'reading');
      expect(mockUpdateBookStatus).not.toHaveBeenCalled();
    });

    it('bookがnullの場合、処理を早期終了する', async () => {
      mockAddManualStatusHistory.mockResolvedValue('new-history-id');
      
      const { result } = renderHook(() => 
        useBookStatusManager(null, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const futureDate = new Date('2025-12-31T12:00:00Z');
      const existingHistory = [];

      await act(async () => {
        await result.current.handleAddManualHistory(futureDate, 'finished', 'reading', existingHistory);
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(futureDate, 'finished', 'reading');
      expect(mockUpdateBookStatus).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、エラーを再スローする', async () => {
      const mockError = new Error('Firestore error');
      mockAddManualStatusHistory.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => 
        useBookStatusManager(mockBook, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const futureDate = new Date('2025-12-31T12:00:00Z');
      const existingHistory = [];

      await act(async () => {
        await expect(
          result.current.handleAddManualHistory(futureDate, 'finished', 'reading', existingHistory)
        ).rejects.toThrow('Firestore error');
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(futureDate, 'finished', 'reading');
      expect(mockUpdateBookStatus).not.toHaveBeenCalled();
    });

    it('複雑な履歴判定ロジックをテスト', async () => {
      mockAddManualStatusHistory.mockResolvedValue('new-history-id');
      
      const { result } = renderHook(() => 
        useBookStatusManager(mockBook, mockAddManualStatusHistory, mockUpdateBookStatus)
      );

      const existingHistory = [
        {
          status: 'reading',
          previousStatus: 'tsundoku',
          changedAt: new Date('2025-12-29T12:00:00Z')
        },
        {
          status: 'finished',
          previousStatus: 'reading',
          changedAt: new Date('2025-12-30T12:00:00Z')
        }
      ];
      
      const newerDate = new Date('2025-12-31T12:00:00Z');

      await act(async () => {
        await result.current.handleAddManualHistory(newerDate, 're-reading', 'finished', existingHistory);
      });

      expect(mockAddManualStatusHistory).toHaveBeenCalledWith(newerDate, 're-reading', 'finished');
      expect(mockUpdateBookStatus).toHaveBeenCalledWith('re-reading');
    });
  });
});
