import { useState, useCallback } from 'react';

/**
 * 外部書籍検索フック
 * Google Books APIを使用して書籍検索を提供
 */
export const useExternalBookSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]); // 検索履歴
  const [filters, setFilters] = useState({
    author: '',
    publisher: '',
    yearFrom: '',
    yearTo: ''
  }); // フィルター条件

  /**
   * 検索履歴をローカルストレージから読み込み
   */
  const loadSearchHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('bookSearchHistory');
      if (saved) {
        const history = JSON.parse(saved);
        setSearchHistory(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      setSearchHistory([]);
    }
  }, []);

  /**
   * 検索履歴をローカルストレージに保存
   */
  const saveSearchHistory = useCallback((history) => {
    try {
      localStorage.setItem('bookSearchHistory', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, []);

  /**
   * 検索履歴に追加
   */
  const addToSearchHistory = useCallback((query, searchType) => {
    if (!query || query.trim().length < 2) return;
    
    const newEntry = {
      query: query.trim(),
      searchType,
      timestamp: Date.now()
    };
    
    setSearchHistory(prev => {
      // 重複を除去（最新のものを残す）
      const filtered = prev.filter(entry => 
        !(entry.query === newEntry.query && entry.searchType === newEntry.searchType)
      );
      
      // 新しいエントリを先頭に追加
      const updated = [newEntry, ...filtered].slice(0, 10); // 最新10件まで
      saveSearchHistory(updated);
      return updated;
    });
  }, [saveSearchHistory]);

  /**
   * 検索履歴から削除
   */
  const removeFromSearchHistory = useCallback((index) => {
    setSearchHistory(prev => {
      const updated = prev.filter((_, i) => i !== index);
      saveSearchHistory(updated);
      return updated;
    });
  }, [saveSearchHistory]);

  /**
   * 検索履歴をクリア
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    saveSearchHistory([]);
  }, [saveSearchHistory]);

  /**
   * 検索結果をフィルタリング
   */
  const applyFilters = useCallback((results) => {
    if (!results || results.length === 0) return results;
    
    return results.filter(book => {
      // 著者フィルター
      if (filters.author && book.author) {
        if (!book.author.toLowerCase().includes(filters.author.toLowerCase())) {
          return false;
        }
      }
      
      // 出版社フィルター
      if (filters.publisher && book.publisher) {
        if (!book.publisher.toLowerCase().includes(filters.publisher.toLowerCase())) {
          return false;
        }
      }
      
      // 出版年フィルター
      if (filters.yearFrom || filters.yearTo) {
        const bookYear = book.publishedDate ? parseInt(book.publishedDate.split('-')[0]) : null;
        if (bookYear) {
          if (filters.yearFrom && bookYear < parseInt(filters.yearFrom)) {
            return false;
          }
          if (filters.yearTo && bookYear > parseInt(filters.yearTo)) {
            return false;
          }
        } else {
          // 出版年が不明な場合は除外
          return false;
        }
      }
      
      return true;
    });
  }, [filters]);

  /**
   * フィルター条件を更新
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * フィルターをクリア
   */
  const clearFilters = useCallback(() => {
    setFilters({
      author: '',
      publisher: '',
      yearFrom: '',
      yearTo: ''
    });
  }, []);

  /**
   * 検索結果を正規化
   * @param {Array} results - APIからの検索結果
   * @param {string} source - APIソース（'google' | 'openbd'）
   * @returns {Array} 正規化された検索結果
   */
  const normalizeSearchResults = useCallback((results, source) => {
    if (!Array.isArray(results)) return [];

    return results.map((item, index) => ({
      id: `${source}-${index}`,
      source,
      title: item.title || '',
      author: item.author || '',
      publisher: item.publisher || '',
      publishedDate: item.publishedDate || '',
      isbn: item.isbn || '',
      coverImageUrl: item.coverImageUrl || '',
      description: item.description || '',
      // 検索結果の信頼度（Google Booksの方が一般的に信頼性が高い）
      confidence: source === 'google' ? 0.8 : 0.6
    }));
  }, []);

  /**
   * Google Books APIで検索
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ（'title' | 'author' | 'publisher'）
   * @returns {Promise<Array>} 検索結果
   */
  const searchGoogleBooks = useCallback(async (query, searchType) => {
    try {
  // 環境変数アクセス方法（ViteとJestの両方に対応）
  let apiKey;
  try {
    // Vite環境では import.meta.env を使用
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    } else if (typeof process !== 'undefined' && process.env) {
      // Jest環境では process.env を使用
      apiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY;
    } else {
      apiKey = undefined;
    }
  } catch (error) {
    // 環境変数へのアクセスでエラーが発生した場合
    apiKey = undefined;
  }
  
  if (!apiKey) {
    // APIキーがない場合は、エラーを投げずに空の結果を返す
    console.warn('Google Books API key is not configured, skipping Google Books search');
    return [];
  }

      // 検索タイプに応じてクエリを構築
      let searchQuery = query;
      if (searchType === 'author') {
        searchQuery = `inauthor:${query}`;
      } else if (searchType === 'publisher') {
        searchQuery = `inpublisher:${query}`;
      } else {
        searchQuery = `intitle:${query}`;
      }

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=10`
      );

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map(item => {
        const volumeInfo = item.volumeInfo || {};
        const industryIdentifiers = volumeInfo.industryIdentifiers || [];
        const isbn = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || 
                    industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || '';

        return {
          title: volumeInfo.title || '',
          author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
          publisher: volumeInfo.publisher || '',
          publishedDate: volumeInfo.publishedDate || '',
          isbn: isbn,
          coverImageUrl: volumeInfo.imageLinks?.thumbnail || '',
          description: volumeInfo.description || ''
        };
      });
    } catch (error) {
      console.error('Google Books API error:', error);
      throw error;
    }
  }, []);


  /**
   * エラーメッセージを取得（ユーザーフレンドリーなメッセージに変換）
   * @param {Error} error - エラーオブジェクト
   * @returns {string} ユーザーフレンドリーなエラーメッセージ
   */
  const getErrorMessage = useCallback((error) => {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('API key') || errorMessage.includes('API key is not configured')) {
      return '検索サービスが利用できません。しばらく時間をおいて再度お試しください。';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'インターネット接続を確認してください。';
    } else if (errorMessage.includes('timeout')) {
      return '検索に時間がかかっています。もう一度お試しください。';
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return '検索サービスが見つかりません。時間をおいて再度お試しください。';
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      return '検索回数が多すぎます。しばらく時間をおいて再度お試しください。';
    } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      return '検索サービスでエラーが発生しました。時間をおいて再度お試しください。';
    } else {
      return '検索中にエラーが発生しました。別のキーワードでお試しください。';
    }
  }, []);

  /**
   * 書籍検索を実行
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ（'title' | 'author' | 'publisher'）
   */
  const searchBooks = useCallback(async (query, searchType = 'title') => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setLoadingStep('検索を開始しています...');
    setError(null);
    setSearchResults([]);

    try {
      const results = [];
      let hasError = false;
      let lastError = null;

      // Google Books APIで検索
      try {
        setLoadingStep('Google Booksで検索中...');
        console.log('Trying Google Books API for query:', query);
        const googleResults = await searchGoogleBooks(query, searchType);
        console.log('Google Books raw results:', googleResults);
        if (googleResults && googleResults.length > 0) {
          const normalizedGoogleResults = normalizeSearchResults(googleResults, 'google');
          console.log('Google Books normalized results:', normalizedGoogleResults);
          results.push(...normalizedGoogleResults);
        }
      } catch (googleError) {
        console.warn('Google Books API failed:', googleError);
        hasError = true;
        lastError = googleError;
      }

      // 結果を整理中
      setLoadingStep('結果を整理中...');

      // デバッグ用ログ
      console.log('Search results:', results);
      console.log('Results length:', results.length);

      // 結果を信頼度順にソート
      const sortedResults = results.sort((a, b) => b.confidence - a.confidence);

      setSearchResults(sortedResults);

      // 検索履歴に追加（成功した場合のみ）
      if (results.length > 0) {
        addToSearchHistory(query, searchType);
      }

      // Google Books APIが失敗した場合のエラー処理
      if (hasError && results.length === 0) {
        setError(getErrorMessage(lastError));
      } else if (results.length === 0) {
        // より具体的なエラーメッセージ
        if (searchType === 'title') {
          setError('検索結果が見つかりませんでした。別のキーワードでお試しください。\n\n💡 ヒント: より具体的なタイトルや著者名で検索してみてください。');
        } else {
          setError('検索結果が見つかりませんでした。別のキーワードでお試しください。');
        }
      }
    } catch (error) {
      console.error('External book search error:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [getErrorMessage, addToSearchHistory]); // getErrorMessageとaddToSearchHistoryを依存配列に追加

  /**
   * 検索結果をクリア
   */
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // フィルタリングされた検索結果
  const filteredResults = applyFilters(searchResults);

  return {
    searchResults,
    filteredResults,
    loading,
    loadingStep,
    error,
    searchBooks,
    clearSearchResults,
    clearError,
    // 検索履歴関連
    searchHistory,
    loadSearchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    // フィルタリング関連
    filters,
    updateFilters,
    clearFilters
  };
};
