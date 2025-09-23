import { useCallback } from 'react';
import { isValidBookStatus } from '../constants/bookStatus';

// ManualHistoryAddDialog 用のバリデーションを提供
// 返り値: validate(date, status, previousStatus, existingHistory) -> throws Error or returns void
export function useHistoryValidation() {
  const validate = useCallback((date, status, previousStatus, existingHistory = []) => {
    // 日時
    if (!date) {
      throw new Error('日時を選択してください');
    }

    // 未来日時
    const now = new Date();
    if (date > now) {
      throw new Error('未来の日時は設定できません');
    }

    // ステータス妥当性
    if (!isValidBookStatus(status)) {
      throw new Error('無効なステータスです');
    }

    // 重複チェック（1分以内を同時刻とみなす）
    const hasDuplicate = (existingHistory || []).some(h => {
      const existingDate = h?.changedAt?.toDate ? h.changedAt.toDate() : (h?.changedAt ? new Date(h.changedAt) : null);
      if (!existingDate) return false;
      return Math.abs(existingDate - date) < 60000;
    });

    if (hasDuplicate) {
      throw new Error('同じ日時の履歴が既に存在します');
    }
  }, []);

  return { validate };
}

export default useHistoryValidation;


