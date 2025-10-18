import { useState, useCallback } from 'react';
import { FULL_TEXT_SEARCH_CONFIG } from '../config/fullTextSearchConfig';

/**
 * 検索のレート制限管理フック
 * 
 * 同一クエリの連続実行を制限
 * - クエリごとに最終実行時刻を記録
 * - 制限時間内の再実行を防止
 * 
 * @returns {Object} レート制限管理API
 */
export function useSearchRateLimit() {
  const { RATE_LIMIT_MS, ERROR_MESSAGES } = FULL_TEXT_SEARCH_CONFIG;
  
  // クエリごとの最終実行時刻を記録
  const [lastSearchTimes, setLastSearchTimes] = useState({});

  /**
   * 検索キーの正規化
   * @param {string} searchText - 検索テキスト
   * @returns {string} 正規化されたキー
   */
  const normalizeKey = useCallback((searchText) => {
    return searchText.toLowerCase().trim();
  }, []);

  /**
   * レート制限チェック
   * @param {string} searchText - 検索テキスト
   * @returns {Object} { allowed: boolean, remainingMs: number, error: string|null }
   */
  const checkRateLimit = useCallback((searchText) => {
    const key = normalizeKey(searchText);
    const now = Date.now();
    const lastTime = lastSearchTimes[key] || 0;
    const elapsedMs = now - lastTime;
    
    if (elapsedMs < RATE_LIMIT_MS) {
      const remainingMs = RATE_LIMIT_MS - elapsedMs;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      return {
        allowed: false,
        remainingMs,
        error: ERROR_MESSAGES.RATE_LIMITED(remainingSeconds)
      };
    }
    
    return {
      allowed: true,
      remainingMs: 0,
      error: null
    };
  }, [lastSearchTimes, normalizeKey, RATE_LIMIT_MS, ERROR_MESSAGES]);

  /**
   * 検索実行時刻を記録
   * @param {string} searchText - 検索テキスト
   */
  const recordSearch = useCallback((searchText) => {
    const key = normalizeKey(searchText);
    const now = Date.now();
    
    setLastSearchTimes(prev => ({
      ...prev,
      [key]: now
    }));
  }, [normalizeKey]);

  /**
   * レート制限をリセット
   * @param {string} [searchText] - 特定のクエリのみリセット（省略時は全クリア）
   */
  const resetRateLimit = useCallback((searchText) => {
    if (searchText) {
      const key = normalizeKey(searchText);
      setLastSearchTimes(prev => {
        const newTimes = { ...prev };
        delete newTimes[key];
        return newTimes;
      });
    } else {
      setLastSearchTimes({});
    }
  }, [normalizeKey]);

  /**
   * 残り待機時間を取得
   * @param {string} searchText - 検索テキスト
   * @returns {number} 残り待機時間（ミリ秒）、制限なしの場合は0
   */
  const getRemainingTime = useCallback((searchText) => {
    const key = normalizeKey(searchText);
    const now = Date.now();
    const lastTime = lastSearchTimes[key] || 0;
    const elapsedMs = now - lastTime;
    
    if (elapsedMs < RATE_LIMIT_MS) {
      return RATE_LIMIT_MS - elapsedMs;
    }
    
    return 0;
  }, [lastSearchTimes, normalizeKey, RATE_LIMIT_MS]);

  return {
    checkRateLimit,
    recordSearch,
    resetRateLimit,
    getRemainingTime
  };
}

