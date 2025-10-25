/**
 * 検索結果のsessionStorage管理ユーティリティ
 */

const SESSION_STORAGE_KEY = 'lastSearchResults';
const SESSION_STORAGE_TIMESTAMP_KEY = 'lastSearchTimestamp';
const STORAGE_TTL = 30 * 60 * 1000; // 30分

/**
 * 検索結果をsessionStorageに保存
 * @param {Array} results - 検索結果配列
 */
export const saveSearchResults = (results) => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(results));
    sessionStorage.setItem(SESSION_STORAGE_TIMESTAMP_KEY, Date.now().toString());
    console.log('[searchStorage] Saved search results to sessionStorage:', results.length);
  } catch (error) {
    console.warn('[searchStorage] Failed to save search results to sessionStorage:', error);
  }
};

/**
 * sessionStorageから検索結果を復元
 * @returns {Array|null} 検索結果配列、またはnull（見つからない場合）
 */
export const restoreSearchResults = () => {
  try {
    const savedResults = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const savedTimestamp = sessionStorage.getItem(SESSION_STORAGE_TIMESTAMP_KEY);
    
    if (!savedResults || !savedTimestamp) {
      return null;
    }
    
    // 30分以内のデータのみ復元
    const now = Date.now();
    const elapsed = now - parseInt(savedTimestamp, 10);
    
    if (elapsed >= STORAGE_TTL) {
      // 古いデータは削除してnullを返す
      clearSearchResults();
      console.log('[searchStorage] Expired search results removed');
      return null;
    }
    
    const parsedResults = JSON.parse(savedResults);
    console.log('[searchStorage] Restored search results from sessionStorage:', parsedResults.length);
    return parsedResults;
  } catch (error) {
    console.warn('[searchStorage] Failed to restore search results from sessionStorage:', error);
    return null;
  }
};

/**
 * sessionStorageから検索結果をクリア
 */
export const clearSearchResults = () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_TIMESTAMP_KEY);
};
