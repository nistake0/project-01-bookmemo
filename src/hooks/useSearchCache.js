import { useState, useCallback } from 'react';
import { FULL_TEXT_SEARCH_CONFIG } from '../config/fullTextSearchConfig';
import { devLog } from '../utils/logger';

/**
 * 検索結果のキャッシュ管理フック
 * 
 * LocalStorageを使用してキャッシュを永続化
 * - 最大件数制限（FIFO）
 * - 有効期限チェック
 * - キャッシュヒット判定
 * 
 * @returns {Object} キャッシュ管理API
 */
export function useSearchCache() {
  const {
    CACHE_KEY,
    CACHE_MAX_ITEMS,
    CACHE_EXPIRY_MS
  } = FULL_TEXT_SEARCH_CONFIG;

  // LocalStorageからキャッシュを読み込み
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('キャッシュの読み込みに失敗しました:', error);
      return {};
    }
  }, [CACHE_KEY]);

  const [cache, setCache] = useState(loadCache);

  /**
   * キャッシュキーの正規化
   * @param {string} searchText - 検索テキスト
   * @returns {string} 正規化されたキー
   */
  const normalizeKey = useCallback((searchText) => {
    return searchText.toLowerCase().trim();
  }, []);

  /**
   * キャッシュから検索結果を取得
   * @param {string} searchText - 検索テキスト
   * @returns {Object|null} キャッシュされた結果、またはnull
   */
  const getCached = useCallback((searchText) => {
    const key = normalizeKey(searchText);
    devLog('🔍 キャッシュ検索:', { searchText, key, cacheKeys: Object.keys(cache) });
    const cachedResult = cache[key];
    
    if (!cachedResult) {
      devLog('❌ キャッシュミス:', key);
      return null;
    }
    
    // 有効期限チェック
    const now = Date.now();
    if (now - cachedResult.timestamp > CACHE_EXPIRY_MS) {
      // 期限切れ
      devLog('⏰ キャッシュ期限切れ:', key);
      return null;
    }
    
    devLog('✅ キャッシュヒット:', key);
    return cachedResult.data;
  }, [cache, normalizeKey, CACHE_EXPIRY_MS]);

  /**
   * 検索結果をキャッシュに保存
   * @param {string} searchText - 検索テキスト
   * @param {Object} results - 検索結果
   */
  const setCached = useCallback((searchText, results) => {
    const key = normalizeKey(searchText);
    const now = Date.now();
    
    devLog('💾 キャッシュ保存:', { searchText, key, resultsCount: results?.length || 0 });
    
    let newCache = { ...cache };
    
    // 最大件数チェック（FIFO方式で削除）
    if (Object.keys(newCache).length >= CACHE_MAX_ITEMS && !newCache[key]) {
      const oldestKey = Object.keys(newCache).sort((a, b) => 
        newCache[a].timestamp - newCache[b].timestamp
      )[0];
      devLog('🗑️ 古いキャッシュを削除:', oldestKey);
      delete newCache[oldestKey];
    }
    
    // キャッシュに追加
    newCache[key] = {
      data: results,
      timestamp: now
    };
    
    // 状態とLocalStorageを更新
    setCache(newCache);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      devLog('✅ キャッシュ保存成功:', { key, cacheSize: Object.keys(newCache).length });
    } catch (error) {
      console.error('キャッシュの保存に失敗しました:', error);
    }
  }, [cache, normalizeKey, CACHE_KEY, CACHE_MAX_ITEMS]);

  /**
   * キャッシュをクリア
   */
  const clearCache = useCallback(() => {
    setCache({});
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('キャッシュのクリアに失敗しました:', error);
    }
  }, [CACHE_KEY]);

  /**
   * キャッシュ統計情報を取得
   * @returns {Object} 統計情報
   */
  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const entries = Object.entries(cache);
    
    return {
      totalItems: entries.length,
      validItems: entries.filter(([, value]) => 
        now - value.timestamp <= CACHE_EXPIRY_MS
      ).length,
      maxItems: CACHE_MAX_ITEMS,
      expiryMs: CACHE_EXPIRY_MS
    };
  }, [cache, CACHE_MAX_ITEMS, CACHE_EXPIRY_MS]);

  return {
    getCached,
    setCached,
    clearCache,
    getCacheStats
  };
}

