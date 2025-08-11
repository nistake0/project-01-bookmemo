import { useState, useCallback, useEffect } from 'react';
import { collection, query, getDocs, where, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * タグ統計データを取得するためのカスタムフック
 * 
 * 機能:
 * - タグごとの本・メモ件数を集計
 * - タグ使用頻度の計算
 * - 本・メモ別の統計データ取得
 * 
 * @param {object} user - 認証ユーザー情報
 * @returns {object} タグ統計関連の関数と状態
 */
export const useTagStats = (user) => {
  const [tagStats, setTagStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * タグ統計データを取得する
   * 
   * @returns {Promise<void>}
   */
  const fetchTagStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      console.log('useTagStats: タグ統計取得開始, userId:', user.uid);

      // 本とメモのデータを並行して取得
      const [booksSnapshot, memosSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'books'), where('userId', '==', user.uid))),
        getDocs(query(collectionGroup(db, 'memos'), where('userId', '==', user.uid)))
      ]);

      console.log('useTagStats: データ取得完了, 本:', booksSnapshot.size, 'メモ:', memosSnapshot.size);

      // タグ統計を初期化
      const stats = {};

      // 本のタグを集計
      booksSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('useTagStats: 本データ:', { id: doc.id, title: data.title, tags: data.tags });
        
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => {
            if (!stats[tag]) {
              stats[tag] = { bookCount: 0, memoCount: 0, lastUsed: null };
            }
            stats[tag].bookCount++;
            
            // 最後に使用された日時を更新
            const updatedAt = data.updatedAt?.toDate?.() || new Date();
            if (!stats[tag].lastUsed || updatedAt > stats[tag].lastUsed) {
              stats[tag].lastUsed = updatedAt;
            }
          });
        }
      });

      console.log('useTagStats: 本のタグ集計完了');

      // メモのタグを集計
      memosSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('useTagStats: メモデータ:', { 
          id: doc.id, 
          bookId: doc.ref.parent.parent?.id,
          tags: data.tags,
          text: data.text?.substring(0, 30) + '...'
        });
        
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => {
            if (!stats[tag]) {
              stats[tag] = { bookCount: 0, memoCount: 0, lastUsed: null };
            }
            stats[tag].memoCount++;
            
            // 最後に使用された日時を更新
            const updatedAt = data.updatedAt?.toDate?.() || new Date();
            if (!stats[tag].lastUsed || updatedAt > stats[tag].lastUsed) {
              stats[tag].lastUsed = updatedAt;
            }
          });
        }
      });

      console.log('useTagStats: メモのタグ集計完了, 最終統計:', stats);

      setTagStats(stats);
      console.log('useTagStats: タグ統計設定完了');
    } catch (err) {
      console.error('タグ統計の取得に失敗しました:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * タグ統計をソートして取得する
   * 
   * @param {string} sortBy - ソート基準 ('count' | 'name' | 'lastUsed')
   * @param {string} sortOrder - ソート順序 ('asc' | 'desc')
   * @returns {Array} ソートされたタグ統計配列
   */
  const getSortedTagStats = useCallback((sortBy = 'count', sortOrder = 'desc') => {
    const statsArray = Object.entries(tagStats).map(([tag, stats]) => ({
      tag,
      ...stats,
      totalCount: stats.bookCount + stats.memoCount,
      type: stats.bookCount > 0 && stats.memoCount > 0 ? 'both' : 
            stats.bookCount > 0 ? 'book' : 'memo'
    }));

    return statsArray.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'count':
          comparison = b.totalCount - a.totalCount;
          break;
        case 'name':
          comparison = a.tag.localeCompare(b.tag, 'ja');
          break;
        case 'lastUsed':
          comparison = (b.lastUsed || 0) - (a.lastUsed || 0);
          break;
        default:
          comparison = b.totalCount - a.totalCount;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [tagStats]);

  /**
   * 特定のタグの統計を取得する
   * 
   * @param {string} tag - タグ名
   * @returns {object|null} タグ統計データ
   */
  const getTagStat = useCallback((tag) => {
    return tagStats[tag] || null;
  }, [tagStats]);

  /**
   * 統計データを初期化する
   */
  const clearStats = useCallback(() => {
    setTagStats({});
    setError(null);
  }, []);

  // ユーザーが変更されたときに統計を再取得
  useEffect(() => {
    if (user?.uid) {
      fetchTagStats();
    } else {
      clearStats();
    }
  }, [user?.uid, fetchTagStats, clearStats]);

  return {
    tagStats,
    loading,
    error,
    fetchTagStats,
    getSortedTagStats,
    getTagStat,
    clearStats,
  };
}; 