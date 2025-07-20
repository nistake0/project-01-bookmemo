import { useState, useCallback } from 'react';
import { collection, query, orderBy, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * タグ履歴管理のためのカスタムフック
 * 
 * 機能:
 * - タグ履歴の取得（fetchTagHistory）
 * - タグ履歴の保存（saveTagToHistory）
 * - 書籍用とメモ用の対応
 * 
 * @param {string} type - タグ履歴の種類 ('book' | 'memo')
 * @param {object} user - 認証ユーザー情報
 * @returns {object} タグ履歴関連の関数と状態
 */
export const useTagHistory = (type, user) => {
  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * タグ履歴を取得する
   * 
   * @returns {Promise<void>}
   */
  const fetchTagHistory = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const collectionName = type === 'book' ? 'bookTagHistory' : 'memoTagHistory';
      const q = query(
        collection(db, 'users', user.uid, collectionName),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tags = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tag) {
          tags.push(data.tag);
        }
      });
      
      setTagOptions(tags);
    } catch (error) {
      console.error('タグ履歴の取得に失敗しました:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, type]);

  /**
   * タグ履歴に保存する
   * 
   * @param {string} tag - 保存するタグ
   * @returns {Promise<void>}
   */
  const saveTagToHistory = useCallback(async (tag) => {
    if (!user?.uid || !tag) return;

    try {
      const collectionName = type === 'book' ? 'bookTagHistory' : 'memoTagHistory';
      const docRef = doc(db, 'users', user.uid, collectionName, tag);
      
      await setDoc(docRef, {
        tag,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('タグ履歴の保存に失敗しました:', error);
      throw error;
    }
  }, [user?.uid, type]);

  /**
   * 複数のタグを履歴に保存する
   * 
   * @param {string[]} tags - 保存するタグの配列
   * @returns {Promise<void>}
   */
  const saveTagsToHistory = useCallback(async (tags) => {
    if (!user?.uid || !tags || tags.length === 0) return;

    try {
      const promises = tags.map(tag => saveTagToHistory(tag));
      await Promise.all(promises);
    } catch (error) {
      console.error('タグ履歴の一括保存に失敗しました:', error);
      throw error;
    }
  }, [user?.uid, saveTagToHistory]);

  return {
    tagOptions,
    loading,
    fetchTagHistory,
    saveTagToHistory,
    saveTagsToHistory,
  };
}; 