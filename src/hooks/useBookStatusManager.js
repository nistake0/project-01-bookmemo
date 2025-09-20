import { useCallback } from 'react';
import { convertToDate } from '../utils/dateUtils';

/**
 * 書籍ステータス管理フック
 * 手動履歴追加時の複雑なビジネスロジックを担当
 */
export const useBookStatusManager = (book, addManualStatusHistory, updateBookStatus) => {
  /**
   * 手動履歴追加処理
   * @param {Date} date - 履歴の日時
   * @param {string} status - 新しいステータス
   * @param {string} previousStatus - 前のステータス
   * @param {Array} existingHistory - 既存の履歴配列
   */
  const handleAddManualHistory = useCallback(async (date, status, previousStatus, existingHistory = []) => {
    try {
      // 手動履歴を追加
      await addManualStatusHistory(date, status, previousStatus);
      console.log('Manual history added successfully');

      // 追加した履歴が最新かどうかを判定
      const allHistories = [...existingHistory];
      const newHistoryEntry = {
        status,
        previousStatus,
        changedAt: date
      };
      
      // 新しい履歴を追加して日時順にソート
      allHistories.push(newHistoryEntry);
      allHistories.sort((a, b) => convertToDate(b.changedAt) - convertToDate(a.changedAt));

      // 最新の履歴が今回追加したものかどうかを判定
      const isLatestHistory = allHistories.length > 0 && 
        convertToDate(allHistories[0].changedAt).getTime() === convertToDate(date).getTime();
      
      if (!book) {
        return;
      }

      if (isLatestHistory && status !== book.status) {
        await updateBookStatus(status);
      }
    } catch (error) {
      console.error('Failed to add manual history:', error);
      throw error; // エラーを再スローしてUIで処理できるようにする
    }
  }, [book, addManualStatusHistory, updateBookStatus]);

  return {
    handleAddManualHistory
  };
};

export default useBookStatusManager;
