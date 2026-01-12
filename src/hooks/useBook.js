import { useState, useEffect, useCallback, useContext } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

export const useBook = (bookId) => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBook = useCallback(async () => {
    if (!user || !bookId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, 'books', bookId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setBook({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("No such document or access denied!");
        setGlobalError("書籍が見つからないか、アクセス権限がありません。");
        setBook(null);
        setError("書籍が見つからないか、アクセス権限がありません。");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setGlobalError("書籍情報の取得に失敗しました。");
      setError("書籍情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [bookId, user]);

  const updateBook = useCallback(async (updateData) => {
    if (!user || !bookId) {
      throw new Error("ユーザーまたは書籍IDが無効です。");
    }

    try {
      const docRef = doc(db, 'books', bookId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      
      // ローカル状態も更新
      setBook(prevBook => ({
        ...prevBook,
        ...updateData,
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating book:", error);
      setGlobalError("書籍情報の更新に失敗しました。");
      throw error;
    }
  }, [bookId, user]);

  const updateBookStatus = useCallback(async (newStatus) => {
    return await updateBook({ status: newStatus });
  }, [updateBook]);

  const updateBookTags = useCallback(async (newTags) => {
    return await updateBook({ tags: newTags });
  }, [updateBook]);

  const deleteBook = useCallback(async () => {
    if (!user || !bookId) {
      throw new Error("ユーザーまたは書籍IDが無効です。");
    }

    try {
      // メモの存在確認
      const memosRef = collection(db, 'books', bookId, 'memos');
      const memosSnapshot = await getDocs(memosRef);
      
      if (!memosSnapshot.empty) {
        const errorMessage = 'この書籍にはメモが含まれているため、削除できません。先にメモを削除してください。';
        setGlobalError(errorMessage);
        throw new Error(errorMessage);
      }

      // メモが無い場合のみ削除処理を実行
      const docRef = doc(db, 'books', bookId);
      await deleteDoc(docRef);
      
      // ローカル状態をクリア
      setBook(null);
      
      return true;
    } catch (error) {
      console.error("Error deleting book:", error);
      // メモがある場合のエラーは既にsetGlobalErrorで通知済み
      if (!error.message.includes('メモが含まれている')) {
        setGlobalError("書籍の削除に失敗しました。");
      }
      throw error;
    }
  }, [bookId, user, setGlobalError]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  return {
    book,
    loading,
    error,
    fetchBook,
    updateBook,
    updateBookStatus,
    updateBookTags,
    deleteBook,
  };
}; 