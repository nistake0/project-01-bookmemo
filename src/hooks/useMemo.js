import { useState, useEffect, useCallback, useContext } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { getMemoRatingSortOrder, DEFAULT_MEMO_RATING } from '../constants/memoRating';

export const useMemo = (bookId) => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMemos = useCallback(async () => {
    if (!user || !bookId) {
      setMemos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const memosRef = collection(db, 'books', bookId, 'memos');
      const q = query(memosRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        rating: doc.data().rating || DEFAULT_MEMO_RATING // 後方互換性
      }));
      
      // ランク順でソート（高いランクが先に来る）
      const sortedData = data.sort((a, b) => {
        const ratingA = getMemoRatingSortOrder(a.rating);
        const ratingB = getMemoRatingSortOrder(b.rating);
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // 高いランクが先
        }
        // ランクが同じ場合は作成日時の降順
        return new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
      });
      
      setMemos(sortedData);
    } catch (err) {
      console.error('Error fetching memos:', err);
      setGlobalError('メモ一覧の取得に失敗しました。');
      setError('メモ一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, bookId]);

  const addMemo = useCallback(async (memoData) => {
    if (!user || !bookId) throw new Error('ユーザーまたは書籍IDが無効です。');
    try {
      const memosRef = collection(db, 'books', bookId, 'memos');
      const docRef = await addDoc(memosRef, {
        ...memoData,
        userId: user.uid, // ユーザーIDを追加
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 即座にローカル状態を更新（一時的なタイムスタンプを使用）
      const newMemo = {
        id: docRef.id,
        ...memoData,
        userId: user.uid, // ユーザーIDを追加
        createdAt: new Date(), // 一時的なタイムスタンプ
        updatedAt: new Date(),
      };
      setMemos(prevMemos => {
        const updatedMemos = [newMemo, ...prevMemos];
        return updatedMemos;
      });
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding memo:', err);
      setGlobalError('メモの追加に失敗しました。');
      throw err;
    }
  }, [user?.uid, bookId]);

  const updateMemo = useCallback(async (memoId, updateData) => {
    if (!user || !bookId || !memoId) throw new Error('ユーザー・書籍ID・メモIDが無効です。');
    try {
      const memoRef = doc(db, 'books', bookId, 'memos', memoId);
      await updateDoc(memoRef, {
        ...updateData,
        userId: user.uid, // ユーザーIDを保持
        updatedAt: serverTimestamp(),
      });
      
      // 即座にローカル状態を更新
      setMemos(prevMemos => {
        const updatedMemos = prevMemos.map(memo => 
          memo.id === memoId 
            ? { ...memo, ...updateData, userId: user.uid, updatedAt: new Date() }
            : memo
        );
        return updatedMemos;
      });
      
      return true;
    } catch (err) {
      console.error('Error updating memo:', err);
      setGlobalError('メモの更新に失敗しました。');
      throw err;
    }
  }, [user?.uid, bookId]);

  const deleteMemo = useCallback(async (memoId) => {
    if (!user || !bookId || !memoId) throw new Error('ユーザー・書籍ID・メモIDが無効です。');
    try {
      const memoRef = doc(db, 'books', bookId, 'memos', memoId);
      await deleteDoc(memoRef);
      // 直接メモを削除して状態を更新
      setMemos(prevMemos => prevMemos.filter(memo => memo.id !== memoId));
      return true;
    } catch (err) {
      console.error('Error deleting memo:', err);
      setGlobalError('メモの削除に失敗しました。');
      throw err;
    }
  }, [user?.uid, bookId]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  return {
    memos,
    loading,
    error,
    fetchMemos,
    addMemo,
    updateMemo,
    deleteMemo,
  };
}; 