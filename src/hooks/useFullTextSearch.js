import { useState, useCallback, useEffect, useRef } from 'react';
import { FULL_TEXT_SEARCH_CONFIG } from '../config/fullTextSearchConfig';
import { useSearchCache } from './useSearchCache';
import { useSearchRateLimit } from './useSearchRateLimit';
import { useSearch } from './useSearch';
import { devLog } from '../utils/logger';

/**
 * 全文検索のメインロジックフック
 * 
 * キャッシュ・レート制限・検索実行を統合管理
 * 
 * @returns {Object} 全文検索API
 */
export function useFullTextSearch() {
  const { MIN_SEARCH_LENGTH, ERROR_MESSAGES } = FULL_TEXT_SEARCH_CONFIG;
  
  // 検索テキスト
  const [searchText, setSearchText] = useState('');
  
  // エラー状態
  const [error, setError] = useState('');
  
  // 依存フックの初期化
  const { getCached, setCached, clearCache, getCacheStats } = useSearchCache();
  const { checkRateLimit, recordSearch, resetRateLimit } = useSearchRateLimit();
  const { executeSearch: executeFirebaseSearch, results, loading } = useSearch();
  
  // ローカル結果状態（キャッシュヒット時用）
  const [localResults, setLocalResults] = useState(null);
  
  // Firebase検索実行中フラグ（キャッシュと区別するため）
  const isFirebaseSearchRef = useRef(false);
  
  // 最後に検索したテキスト（重複検索を防ぐため）
  const lastSearchTextRef = useRef('');

  /**
   * 検索テキストのバリデーション
   * @param {string} text - 検索テキスト
   * @returns {Object} { valid: boolean, error: string|null }
   */
  const validateSearchText = useCallback((text) => {
    const trimmedText = text.trim();
    
    if (trimmedText.length < MIN_SEARCH_LENGTH) {
      return {
        valid: false,
        error: ERROR_MESSAGES.TOO_SHORT(MIN_SEARCH_LENGTH)
      };
    }
    
    return { valid: true, error: null };
  }, [MIN_SEARCH_LENGTH, ERROR_MESSAGES]);

  /**
   * 検索実行
   */
  const handleSearch = useCallback(async () => {
    // 1. バリデーション
    const validation = validateSearchText(searchText);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    // エラーをクリア
    setError('');
    
    // 2. キャッシュチェック（レート制限より先に確認）
    const cachedResults = getCached(searchText);
    if (cachedResults) {
      devLog('🎯 キャッシュヒット:', searchText);
      setLocalResults(cachedResults);
      return;
    }
    
    // 3. レート制限チェック（キャッシュミス時のみ）
    const rateLimitCheck = checkRateLimit(searchText);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.error);
      return;
    }
    
    try {
      // 4. Firebase検索実行
      devLog('🔍 Firebase検索実行:', searchText);
      isFirebaseSearchRef.current = true;
      lastSearchTextRef.current = searchText;
      setLocalResults(null); // キャッシュ結果をクリア
      
      await executeFirebaseSearch({
        text: searchText,
        status: 'all',
        dateRange: { type: 'none' },
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      
      // 注意: executeFirebaseSearchは戻り値を返さず、useSearchのresults状態を更新する
      // 結果のキャッシュ保存とレート制限記録はuseEffectで行う
      
    } catch (err) {
      console.error('検索エラー:', err);
      setError(ERROR_MESSAGES.SEARCH_FAILED);
      isFirebaseSearchRef.current = false;
    }
  }, [
    searchText,
    validateSearchText,
    checkRateLimit,
    getCached,
    executeFirebaseSearch,
    setCached,
    recordSearch,
    ERROR_MESSAGES
  ]);

  /**
   * 検索テキスト変更ハンドラー
   * @param {string} text - 新しい検索テキスト
   */
  const handleSearchTextChange = useCallback((text) => {
    setSearchText(text);
    // テキスト変更時はエラーをクリア
    if (error) {
      setError('');
    }
  }, [error]);

  /**
   * 検索結果のクリア
   */
  const clearResults = useCallback(() => {
    setLocalResults(null);
    setSearchText('');
    setError('');
  }, []);

  /**
   * キャッシュのクリア
   */
  const handleClearCache = useCallback(() => {
    clearCache();
    setLocalResults(null);
  }, [clearCache]);

  /**
   * Firebase検索完了時の処理
   * useSearchのresultsが更新されたらキャッシュに保存
   */
  useEffect(() => {
    if (isFirebaseSearchRef.current && results && results.length >= 0 && !loading) {
      const searchTextToCache = lastSearchTextRef.current;
      devLog('📦 Firebase検索完了、キャッシュに保存:', searchTextToCache, 'resultsCount:', results.length);
      
      // キャッシュに保存
      setCached(searchTextToCache, results);
      
      // レート制限を記録
      recordSearch(searchTextToCache);
      
      // フラグをリセット
      isFirebaseSearchRef.current = false;
    }
  }, [results, loading, setCached, recordSearch]);

  /**
   * 現在の検索結果を取得
   * キャッシュヒット時はlocalResults、Firebase検索時はresultsを返す
   */
  const currentResults = localResults || results;

  return {
    // 状態
    searchText,
    error,
    loading,
    results: currentResults,
    
    // アクション
    handleSearch,
    handleSearchTextChange,
    clearResults,
    clearCache: handleClearCache,
    
    // ユーティリティ
    validateSearchText,
    getCacheStats,
    resetRateLimit,
    
    // 検索可否判定
    canSearch: searchText.trim().length >= MIN_SEARCH_LENGTH && !loading
  };
}

