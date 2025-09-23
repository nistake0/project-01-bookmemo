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
import { filterByText, filterByTags, filterByMemoContent, sortResults } from '../utils/searchFilters';
import { getDateRangeFilter } from '../utils/searchDateRange';
import { buildSearchQueries } from './useSearchQuery';

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
    return buildSearchQueries(db, user, conditions, resultLimit);
  }, [user, resultLimit]);

  /**
   * 日時範囲フィルターの取得
   * 
   * @param {Object} dateRange - 日時範囲設定
   * @returns {Object} 開始日と終了日
   */
  // getDateRangeFilter は utils へ移動

  /**
   * テキスト検索によるフィルタリング
   * 
   * @param {Array} items - フィルタリング対象のアイテム
   * @param {string} searchText - 検索テキスト
   * @returns {Array} フィルタリングされたアイテム
   */
  // filterByText は utils へ移動

  /**
   * タグによるフィルタリング
   * 
   * @param {Array} items - フィルタリング対象のアイテム
   * @param {Array} selectedTags - 選択されたタグの配列
   * @returns {Array} フィルタリングされたアイテム
   */
  // filterByTags は utils へ移動

  /**
   * メモ内容によるフィルタリング
   * 
   * @param {Array} memos - メモの配列
   * @param {string} memoContent - メモ内容検索テキスト
   * @returns {Array} フィルタリングされたメモ
   */
  // filterByMemoContent は utils へ移動

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
      if (conditions.memoContent) {
        const books = filteredResults.filter(result => result.type === 'book');
        const memos = filterByMemoContent(
          filteredResults.filter(result => result.type === 'memo'),
          conditions.memoContent
        );
        filteredResults = [...books, ...memos];
      }

      // 結果をソート（utils）
      const sortBy = conditions.sortBy || 'updatedAt';
      const sortOrder = conditions.sortOrder || 'desc';
      const sorted = sortResults(filteredResults, sortBy, sortOrder);
      filteredResults = sorted;

      setResults(filteredResults);
    } catch (err) {
      console.error('検索エラー:', err);
      setError('検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [user, buildQueries]);

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