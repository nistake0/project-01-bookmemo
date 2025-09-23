// ステータス履歴に関する純粋ロジック群（副作用なし）
import { BOOK_STATUS } from '../constants/bookStatus';

// Firestore Timestamp互換をDateに変換
function toJsDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  try {
    return new Date(value);
  } catch {
    return null;
  }
}

// 履歴配列から重要日付を抽出
export function extractImportantDates(history) {
  if (!Array.isArray(history) || history.length === 0) return {};

  const readingStart = history.find(
    (h) => h?.status === BOOK_STATUS.READING || h?.status === BOOK_STATUS.RE_READING
  );
  const finished = history.find((h) => h?.status === BOOK_STATUS.FINISHED);
  const reReadingStart = history.find((h) => h?.status === BOOK_STATUS.RE_READING);

  const dates = {};
  if (readingStart?.changedAt) dates.readingStartedAt = readingStart.changedAt;
  if (finished?.changedAt) dates.finishedAt = finished.changedAt;
  if (reReadingStart?.changedAt) dates.reReadingStartedAt = reReadingStart.changedAt;
  return dates;
}

// 履歴から現在のステータスを取得（配列が降順想定）
export function getCurrentStatusFromHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return null;
  return history[0]?.status ?? null;
}

// 読書期間（日数）を計算
export function calculateReadingDuration(importantDates) {
  if (!importantDates) return null;
  const { readingStartedAt, finishedAt } = importantDates;
  if (!readingStartedAt || !finishedAt) return null;

  const start = toJsDate(readingStartedAt);
  const end = toJsDate(finishedAt);
  if (!start || !end) return null;

  const diffMs = Math.abs(end - start);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default {
  extractImportantDates,
  getCurrentStatusFromHistory,
  calculateReadingDuration,
};


