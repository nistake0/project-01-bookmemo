/**
 * メモランク定数定義
 * 一貫性のあるランク管理のため、すべてのランク関連ロジックを集約
 */

// ランク定数
export const MEMO_RATING = {
  NONE: 0,      // 未評価
  ONE: 1,       // ★☆☆☆☆
  TWO: 2,       // ★★☆☆☆
  THREE: 3,     // ★★★☆☆
  FOUR: 4,      // ★★★★☆
  FIVE: 5       // ★★★★★
};

// ランク表示名
export const MEMO_RATING_LABELS = {
  [MEMO_RATING.NONE]: '未評価',
  [MEMO_RATING.ONE]: '★☆☆☆☆',
  [MEMO_RATING.TWO]: '★★☆☆☆',
  [MEMO_RATING.THREE]: '★★★☆☆',
  [MEMO_RATING.FOUR]: '★★★★☆',
  [MEMO_RATING.FIVE]: '★★★★★'
};

// ランクの色設定（Material-UIのcolor prop）
export const MEMO_RATING_COLORS = {
  [MEMO_RATING.NONE]: 'default',
  [MEMO_RATING.ONE]: 'error',
  [MEMO_RATING.TWO]: 'warning',
  [MEMO_RATING.THREE]: 'info',
  [MEMO_RATING.FOUR]: 'primary',
  [MEMO_RATING.FIVE]: 'success'
};

// デフォルトランク
export const DEFAULT_MEMO_RATING = MEMO_RATING.NONE;

// 全ランク配列
export const ALL_MEMO_RATINGS = [
  MEMO_RATING.ONE,
  MEMO_RATING.TWO,
  MEMO_RATING.THREE,
  MEMO_RATING.FOUR,
  MEMO_RATING.FIVE
];

// 有効なランク配列（未評価を除く）
export const VALID_MEMO_RATINGS = [
  MEMO_RATING.NONE,
  ...ALL_MEMO_RATINGS
];

/**
 * ランクが有効かチェック
 * @param {number} rating - チェックするランク
 * @returns {boolean} 有効なランクかどうか
 */
export const isValidMemoRating = (rating) => {
  return VALID_MEMO_RATINGS.includes(rating);
};

/**
 * ランクの表示名を取得
 * @param {number} rating - ランク
 * @returns {string} 表示名
 */
export const getMemoRatingLabel = (rating) => {
  return MEMO_RATING_LABELS[rating] || MEMO_RATING_LABELS[DEFAULT_MEMO_RATING];
};

/**
 * ランクの色を取得
 * @param {number} rating - ランク
 * @returns {string} Material-UIのcolor値
 */
export const getMemoRatingColor = (rating) => {
  return MEMO_RATING_COLORS[rating] || MEMO_RATING_COLORS[DEFAULT_MEMO_RATING];
};

/**
 * ランクが設定されているかチェック
 * @param {number} rating - ランク
 * @returns {boolean} ランクが設定されているか
 */
export const isMemoRated = (rating) => {
  return rating != null && rating > MEMO_RATING.NONE;
};

/**
 * ランクの数値を取得（後方互換性対応）
 * @param {Object} memo - メモオブジェクト
 * @returns {number} ランク値（デフォルト: 0）
 */
export const getMemoRatingValue = (memo) => {
  return memo?.rating || DEFAULT_MEMO_RATING;
};

/**
 * ランクによるソート順序を取得
 * @param {number} rating - ランク
 * @returns {number} ソート用の数値（高いランクが先に来る）
 */
export const getMemoRatingSortOrder = (rating) => {
  if (!isMemoRated(rating)) return 0;
  return rating;
};

/**
 * ランクの説明文を取得
 * @param {number} rating - ランク
 * @returns {string} 説明文
 */
export const getMemoRatingDescription = (rating) => {
  const descriptions = {
    [MEMO_RATING.NONE]: 'ふつう',
    [MEMO_RATING.ONE]: '少し面白かった',
    [MEMO_RATING.TWO]: 'まあまあ面白かった',
    [MEMO_RATING.THREE]: '面白かった',
    [MEMO_RATING.FOUR]: 'とても面白かった',
    [MEMO_RATING.FIVE]: '神がかり的に面白い'
  };
  
  return descriptions[rating] || descriptions[DEFAULT_MEMO_RATING];
};
