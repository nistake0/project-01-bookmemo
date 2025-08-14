import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';

/**
 * 検索機能のカスタムフック
 * 
 * @param {Object} options - 検索オプション
 * @param {number} options.limit - 検索結果の最大件数（デフォルト: 50）
 * @returns {Object} 検索関連の状態と関数
 */
export function useSearch(options = {}) {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { limit: resultLimit = 50 } = options;

  /**
   * 検索条件からクエリを構築
   * 
   * @param {Object} conditions - 検索条件
   * @returns {Array} クエリの配列
   */
  const buildQueries = useCallback((conditions) => {
    const { 
      text, 
      status, 
      dateRange, 
      memoContent, 
      includeMemoContent, 
      selectedTags,
      searchTarget = 'integrated'
    } = conditions;

    const queries = [];

    // 書籍の検索クエリ（統合または書籍のみの場合）
    if (searchTarget === 'integrated' || searchTarget === 'books') {
      const bookQueryConstraints = [
        where('userId', '==', user.uid)
      ];

      // ステータスフィルター
      if (status && status !== 'all') {
        bookQueryConstraints.push(where('status', '==', status));
      }

      // 日時フィルター
      if (dateRange && dateRange.type !== 'none') {
        const { startDate, endDate } = getDateRangeFilter(dateRange);
        if (startDate) {
          bookQueryConstraints.push(where('updatedAt', '>=', startDate));
        }
        if (endDate) {
          bookQueryConstraints.push(where('updatedAt', '<=', endDate));
        }
      }

      // タグフィルター
      if (selectedTags && selectedTags.length > 0) {
        // インデックスエラーを避けるため、クライアントサイドフィルタリングにフォールバック
        // 複合インデックスが不足している場合があるため
        console.log('タグフィルター適用:', selectedTags);
        console.log('タグフィルターの型:', typeof selectedTags, Array.isArray(selectedTags));
        console.log('タグフィルターの内容:', JSON.stringify(selectedTags));
        
        // タグが配列でない場合やネストした配列の場合は、クライアントサイドフィルタリングのみ使用
        if (!Array.isArray(selectedTags) || selectedTags.some(tag => Array.isArray(tag))) {
          console.log('ネストした配列または無効なタグ形式を検出、クライアントサイドフィルタリングのみ使用');
        } else {
          bookQueryConstraints.push(where('tags', 'array-contains-any', selectedTags));
        }
      }

      const bookQuery = query(
        collection(db, 'books'),
        ...bookQueryConstraints,
        orderBy('updatedAt', 'desc'),
        limit(resultLimit)
      );
      queries.push({ type: 'book', query: bookQuery });
    }

    // メモの検索クエリ（統合またはメモのみの場合）
    if (searchTarget === 'integrated' || searchTarget === 'memos') {
      // メモのみの場合は常にメモクエリを実行
      // 統合の場合はメモ内容検索またはタグ検索が有効な場合のみ実行
      if (searchTarget === 'memos' || (searchTarget === 'integrated' && ((includeMemoContent && memoContent) || (selectedTags && selectedTags.length > 0)))) {
        const memoQueryConstraints = [
          where('userId', '==', user.uid)
        ];

        // メモ内容のテキスト検索（簡易実装）
        // 実際の実装では全文検索サービス（Algolia等）の使用を推奨
        const memoQuery = query(
          collectionGroup(db, 'memos'),
          ...memoQueryConstraints,
          orderBy('updatedAt', 'desc'),
          limit(resultLimit)
        );
        queries.push({ type: 'memo', query: memoQuery });
      }
    }

    return queries;
  }, [user, resultLimit]);

  /**
   * 日時範囲フィルターの取得
   * 
   * @param {Object} dateRange - 日時範囲設定
   * @returns {Object} 開始日と終了日
   */
  const getDateRangeFilter = useCallback((dateRange) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (dateRange.type) {
      case 'year':
        if (dateRange.year) {
          startDate = new Date(dateRange.year, 0, 1);
          endDate = new Date(dateRange.year, 11, 31, 23, 59, 59);
        }
        break;
      case 'month':
        if (dateRange.year && dateRange.month) {
          startDate = new Date(dateRange.year, dateRange.month - 1, 1);
          endDate = new Date(dateRange.year, dateRange.month, 0, 23, 59, 59);
        }
        break;
      case 'quarter':
        if (dateRange.year && dateRange.quarter) {
          const quarterStart = (dateRange.quarter - 1) * 3;
          startDate = new Date(dateRange.year, quarterStart, 1);
          endDate = new Date(dateRange.year, quarterStart + 3, 0, 23, 59, 59);
        }
        break;
      case 'custom':
        if (dateRange.startDate) {
          startDate = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59);
        }
        break;
      case 'recent':
        if (dateRange.months) {
          startDate = new Date(now.getFullYear(), now.getMonth() - dateRange.months, now.getDate());
          endDate = now;
        }
        break;
    }

    return { startDate, endDate };
  }, []);

  /**
   * テキスト検索によるフィルタリング
   * 
   * @param {Array} items - フィルタリング対象のアイテム
   * @param {string} searchText - 検索テキスト
   * @returns {Array} フィルタリングされたアイテム
   */
  const filterByText = useCallback((items, searchText) => {
    if (!searchText) return items;

    const normalizedSearchText = searchText.toLowerCase();
    
    return items.filter(item => {
      // 本の場合
      if (item.type === 'book') {
        return (
          (item.title && item.title.toLowerCase().includes(normalizedSearchText)) ||
          (item.author && item.author.toLowerCase().includes(normalizedSearchText)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(normalizedSearchText)))
        );
      }
      
      // メモの場合
      if (item.type === 'memo') {
        return (
          (item.text && item.text.toLowerCase().includes(normalizedSearchText)) ||
          (item.comment && item.comment.toLowerCase().includes(normalizedSearchText)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(normalizedSearchText)))
        );
      }
      
      return false;
    });
  }, []);

  /**
   * タグによるフィルタリング
   * 
   * @param {Array} items - フィルタリング対象のアイテム
   * @param {Array} selectedTags - 選択されたタグの配列
   * @returns {Array} フィルタリングされたアイテム
   */
  const filterByTags = useCallback((items, selectedTags) => {
    if (!selectedTags || selectedTags.length === 0) return items;

    // タグをフラット化して正規化
    const flattenAndNormalizeTags = (tags) => {
      if (!Array.isArray(tags)) return [];
      
      const flattened = [];
      const processTag = (tag) => {
        if (Array.isArray(tag)) {
          tag.forEach(processTag);
        } else if (typeof tag === 'string' && tag.trim()) {
          flattened.push(tag.toLowerCase().trim());
        }
      };
      
      tags.forEach(processTag);
      return flattened;
    };

    const normalizedSelectedTags = flattenAndNormalizeTags(selectedTags);
    console.log('正規化された選択タグ:', normalizedSelectedTags);
    
    return items.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false;
      
      const itemTags = flattenAndNormalizeTags(item.tags);
      console.log(`アイテム ${item.id} のタグ:`, itemTags);
      
      // 選択されたタグのいずれかが含まれているかチェック
      const hasMatchingTag = itemTags.some(tag => 
        normalizedSelectedTags.includes(tag)
      );
      
      console.log(`アイテム ${item.id} のマッチ結果:`, hasMatchingTag);
      return hasMatchingTag;
    });
  }, []);

  /**
   * メモ内容によるフィルタリング
   * 
   * @param {Array} memos - メモの配列
   * @param {string} memoContent - メモ内容検索テキスト
   * @returns {Array} フィルタリングされたメモ
   */
  const filterByMemoContent = useCallback((memos, memoContent) => {
    if (!memoContent) return memos;

    const normalizedMemoContent = memoContent.toLowerCase();
    
    return memos.filter(memo => {
      return (
        (memo.text && memo.text.toLowerCase().includes(normalizedMemoContent)) ||
        (memo.comment && memo.comment.toLowerCase().includes(normalizedMemoContent))
      );
    });
  }, []);

  /**
   * 検索実行
   * 
   * @param {Object} conditions - 検索条件
   */
  const executeSearch = useCallback(async (conditions) => {
    if (!user) {
      setError('ユーザーが認証されていません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('検索条件:', conditions);
      const queries = buildQueries(conditions);
      console.log('構築されたクエリ:', queries);
      const allResults = [];

      // 各クエリを実行
      for (const { type, query: firestoreQuery } of queries) {
        console.log(`${type}クエリ実行開始`);
        try {
          const querySnapshot = await getDocs(firestoreQuery);
          console.log(`${type}クエリ実行成功, 結果数:`, querySnapshot.size);
          
          if (type === 'memo') {
            // メモの場合は親の本の情報も取得
            console.log('メモクエリの結果を処理中...');
            for (const doc of querySnapshot.docs) {
              const data = doc.data();
              const bookId = doc.ref.parent.parent?.id; // 親の本のID
              
              console.log('メモデータ:', {
                id: doc.id,
                bookId,
                tags: data.tags,
                userId: data.userId,
                text: data.text?.substring(0, 50) + '...'
              });
              
              // 親の本の情報を取得
              let bookTitle = 'メモ';
              if (bookId) {
                try {
                  const bookDoc = await getDocs(query(
                    collection(db, 'books'),
                    where('__name__', '==', bookId),
                    where('userId', '==', user.uid)
                  ));
                  if (!bookDoc.empty) {
                    bookTitle = bookDoc.docs[0].data().title || 'メモ';
                  }
                } catch (bookError) {
                  console.warn('親の本の情報取得に失敗:', bookError);
                }
              }
              
              allResults.push({
                id: doc.id,
                type,
                bookId,
                bookTitle,
                ...data
              });
            }
            console.log('メモ処理完了, 追加されたメモ数:', querySnapshot.size);
          } else {
            // 本の場合は通常通り処理
            querySnapshot.forEach(doc => {
              const data = doc.data();
              allResults.push({
                id: doc.id,
                type,
                ...data
              });
            });
          }
        } catch (queryError) {
          console.error(`${type}クエリエラー:`, queryError);
          
          // インデックスエラーの場合、クライアントサイドフィルタリングにフォールバック
          if (queryError.code === 'failed-precondition' || 
              queryError.message.includes('index') || 
              queryError.message.includes('array-contains-any')) {
            console.log('インデックスエラー検出、クライアントサイドフィルタリングにフォールバック');
            
            if (type === 'memo') {
              // メモの場合はcollectionGroupクエリでフォールバック
              const fallbackQuery = query(
                collectionGroup(db, 'memos'),
                where('userId', '==', user.uid),
                orderBy('updatedAt', 'desc'),
                limit(resultLimit * 2) // より多くのデータを取得
              );
              
              const fallbackSnapshot = await getDocs(fallbackQuery);
              console.log('メモフォールバッククエリ実行成功, 結果数:', fallbackSnapshot.size);
              
              // メモの場合は親の本の情報も取得
              for (const doc of fallbackSnapshot.docs) {
                const data = doc.data();
                const bookId = doc.ref.parent.parent?.id; // 親の本のID
                
                // 親の本の情報を取得
                let bookTitle = 'メモ';
                if (bookId) {
                  try {
                    const bookDoc = await getDocs(query(
                      collection(db, 'books'),
                      where('__name__', '==', bookId),
                      where('userId', '==', user.uid)
                    ));
                    if (!bookDoc.empty) {
                      bookTitle = bookDoc.docs[0].data().title || 'メモ';
                    }
                  } catch (bookError) {
                    console.warn('親の本の情報取得に失敗:', bookError);
                  }
                }
                
                allResults.push({
                  id: doc.id,
                  type,
                  bookId,
                  bookTitle,
                  ...data
                });
              }
            } else {
              // 本の場合は通常のフォールバック
              const fallbackQuery = query(
                collection(db, 'books'),
                where('userId', '==', user.uid),
                orderBy('updatedAt', 'desc'),
                limit(resultLimit * 2) // より多くのデータを取得
              );
              
              const fallbackSnapshot = await getDocs(fallbackQuery);
              console.log('本フォールバッククエリ実行成功, 結果数:', fallbackSnapshot.size);
              
              fallbackSnapshot.forEach(doc => {
                const data = doc.data();
                allResults.push({
                  id: doc.id,
                  type,
                  ...data
                });
              });
            }
          } else {
            throw queryError;
          }
        }
      }

      console.log('全クエリ実行完了, 総結果数:', allResults.length);
      console.log('結果の内訳:', {
        books: allResults.filter(r => r.type === 'book').length,
        memos: allResults.filter(r => r.type === 'memo').length
      });

      // テキスト検索によるフィルタリング
      let filteredResults = filterByText(allResults, conditions.text);

      // タグフィルタリング（クライアントサイド）
      if (conditions.selectedTags && conditions.selectedTags.length > 0) {
        console.log('クライアントサイドタグフィルタリング実行:', conditions.selectedTags);
        filteredResults = filterByTags(filteredResults, conditions.selectedTags);
        console.log('タグフィルタリング後の結果数:', filteredResults.length);
      }

      // メモ内容検索によるフィルタリング
      if (conditions.includeMemoContent && conditions.memoContent) {
        const books = filteredResults.filter(result => result.type === 'book');
        const memos = filterByMemoContent(
          filteredResults.filter(result => result.type === 'memo'),
          conditions.memoContent
        );
        filteredResults = [...books, ...memos];
      }

      // 結果をソート
      filteredResults.sort((a, b) => {
        const sortBy = conditions.sortBy || 'updatedAt';
        const sortOrder = conditions.sortOrder || 'desc';
        
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // 日付の場合はDate型に変換
        if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
          aValue = aValue?.toDate ? aValue.toDate() : new Date(aValue);
          bValue = bValue?.toDate ? bValue.toDate() : new Date(bValue);
        }
        
        // 文字列の場合は小文字化
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setResults(filteredResults);
    } catch (err) {
      console.error('検索エラー:', err);
      setError('検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [user, buildQueries, filterByText, filterByTags, filterByMemoContent]);

  /**
   * 検索結果をクリア
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    executeSearch,
    clearResults
  };
} 