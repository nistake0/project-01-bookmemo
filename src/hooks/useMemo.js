import { useState, useEffect, useCallback, useContext } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

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
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemos(data);
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // 直接メモを追加して状態を更新
      const newMemo = { id: docRef.id, ...memoData };
      setMemos(prevMemos => [newMemo, ...prevMemos]);
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
        updatedAt: serverTimestamp(),
      });
      // 直接メモを更新して状態を更新
      setMemos(prevMemos => 
        prevMemos.map(memo => 
          memo.id === memoId 
            ? { ...memo, ...updateData }
            : memo
        )
      );
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