/**
 * 書籍ステータス定数定義
 * 一貫性のあるステータス管理のため、すべてのステータス関連ロジックを集約
 */

// ステータス定数
export const BOOK_STATUS = {
  TSUNDOKU: 'tsundoku',      // 積読
  READING: 'reading',        // 読書中
  RE_READING: 're-reading',  // 再読中
  FINISHED: 'finished'       // 読了
};

// ステータス表示名
export const BOOK_STATUS_LABELS = {
  [BOOK_STATUS.TSUNDOKU]: '積読',
  [BOOK_STATUS.READING]: '読書中',
  [BOOK_STATUS.RE_READING]: '再読中',
  [BOOK_STATUS.FINISHED]: '読了'
};

// ステータス色設定（Material-UIのcolor prop）
export const BOOK_STATUS_COLORS = {
  [BOOK_STATUS.TSUNDOKU]: 'default',
  [BOOK_STATUS.READING]: 'primary',
  [BOOK_STATUS.RE_READING]: 'secondary',
  [BOOK_STATUS.FINISHED]: 'success'
};

// デフォルトステータス
export const DEFAULT_BOOK_STATUS = BOOK_STATUS.READING;

// 全ステータス配列
export const ALL_BOOK_STATUSES = [
  BOOK_STATUS.TSUNDOKU,
  BOOK_STATUS.READING,
  BOOK_STATUS.RE_READING,
  BOOK_STATUS.FINISHED
];

// フィルター用ステータス（統計表示用）
export const FILTER_STATUSES = {
  ALL: 'all',
  TSUNDOKU: BOOK_STATUS.TSUNDOKU,
  READING: BOOK_STATUS.READING,
  RE_READING: BOOK_STATUS.RE_READING,
  FINISHED: BOOK_STATUS.FINISHED
};

// フィルター表示名
export const FILTER_LABELS = {
  [FILTER_STATUSES.ALL]: 'すべて',
  [FILTER_STATUSES.TSUNDOKU]: '積読',
  [FILTER_STATUSES.READING]: '読書中',
  [FILTER_STATUSES.RE_READING]: '再読中',
  [FILTER_STATUSES.FINISHED]: '読了'
};

/**
 * ステータスが有効かチェック
 * @param {string} status - チェックするステータス
 * @returns {boolean} 有効なステータスかどうか
 */
export const isValidBookStatus = (status) => {
  return ALL_BOOK_STATUSES.includes(status);
};

/**
 * ステータスの表示名を取得
 * @param {string} status - ステータス
 * @returns {string} 表示名
 */
export const getBookStatusLabel = (status) => {
  return BOOK_STATUS_LABELS[status] || BOOK_STATUS_LABELS[DEFAULT_BOOK_STATUS];
};

/**
 * ステータスの色を取得
 * @param {string} status - ステータス
 * @returns {string} Material-UIのcolor値
 */
export const getBookStatusColor = (status) => {
  return BOOK_STATUS_COLORS[status] || BOOK_STATUS_COLORS[DEFAULT_BOOK_STATUS];
};

/**
 * 次のステータスを取得（循環）
 * @param {string} currentStatus - 現在のステータス
 * @returns {string} 次のステータス
 */
export const getNextBookStatus = (currentStatus) => {
  const currentIndex = ALL_BOOK_STATUSES.indexOf(currentStatus);
  if (currentIndex === -1) return DEFAULT_BOOK_STATUS;
  
  const nextIndex = (currentIndex + 1) % ALL_BOOK_STATUSES.length;
  return ALL_BOOK_STATUSES[nextIndex];
};

/**
 * ステータス変更ボタンのテキストを取得
 * @param {string} currentStatus - 現在のステータス
 * @returns {string} ボタンテキスト
 */
export const getStatusChangeButtonText = (currentStatus) => {
  const currentLabel = getBookStatusLabel(currentStatus);
  const nextStatus = getNextBookStatus(currentStatus);
  const nextLabel = getBookStatusLabel(nextStatus);
  
  return `${nextLabel}にする`;
};
