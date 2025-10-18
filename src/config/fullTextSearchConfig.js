/**
 * 全文検索機能の設定定数
 * 
 * 調整可能なパラメータを集約管理
 */

export const FULL_TEXT_SEARCH_CONFIG = {
  // 検索バリデーション
  MIN_SEARCH_LENGTH: 2, // 最小検索文字数
  
  // キャッシュ設定
  CACHE_KEY: 'fullTextSearchCache', // LocalStorageキー
  CACHE_MAX_ITEMS: 100, // 最大キャッシュ件数
  CACHE_EXPIRY_MS: 24 * 60 * 60 * 1000, // キャッシュ有効期限（24時間）
  
  // レート制限設定
  RATE_LIMIT_MS: 5000, // 同一クエリの再実行制限時間（5秒）
  
  // エラーメッセージ
  ERROR_MESSAGES: {
    TOO_SHORT: (min) => `${min}文字以上入力してください`,
    RATE_LIMITED: (seconds) => `検索間隔が短すぎます。${seconds}秒後に再試行してください。`,
    SEARCH_FAILED: '検索に失敗しました。もう一度お試しください。'
  },
  
  // UI設定
  PLACEHOLDER: '書籍タイトル・著者・メモ内容・タグから検索',
  DESCRIPTION: '書籍タイトル・著者・メモ内容・タグから検索します（最小2文字）'
};

/**
 * 設定値のバリデーション
 * 開発時に不適切な設定値を早期発見するため
 */
export function validateConfig() {
  const { MIN_SEARCH_LENGTH, CACHE_MAX_ITEMS, RATE_LIMIT_MS } = FULL_TEXT_SEARCH_CONFIG;
  
  if (MIN_SEARCH_LENGTH < 1) {
    throw new Error('MIN_SEARCH_LENGTH must be at least 1');
  }
  
  if (CACHE_MAX_ITEMS < 1) {
    throw new Error('CACHE_MAX_ITEMS must be at least 1');
  }
  
  if (RATE_LIMIT_MS < 0) {
    throw new Error('RATE_LIMIT_MS must be non-negative');
  }
  
  return true;
}

// 開発環境での設定バリデーション
if (process.env.NODE_ENV === 'development') {
  validateConfig();
}

