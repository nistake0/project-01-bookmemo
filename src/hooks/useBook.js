import { useState, useEffect, useCallback, useContext } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  }, [bookId, user, setGlobalError]);

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
  }, [bookId, user, setGlobalError]);

  const updateBookStatus = useCallback(async (newStatus) => {
    return await updateBook({ status: newStatus });
  }, [updateBook]);

  const updateBookTags = useCallback(async (newTags) => {
    return await updateBook({ tags: newTags });
  }, [updateBook]);

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
  };
}; 