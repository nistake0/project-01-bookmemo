import { useState, useCallback, useContext } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { useTagHistory } from './useTagHistory';
import { DEFAULT_BOOK_STATUS } from '../constants/bookStatus';

export const useBookActions = () => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // タグ履歴フックを使用
  const { saveTagsToHistory } = useTagHistory('book', user);

  const addBook = useCallback(async (bookData) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません。');
    }

    if (!bookData.title) {
      throw new Error('タイトルは必須です。');
    }

    try {
      setLoading(true);
      setError(null);

      // 空文字・空白タグを除去
      let tagsToSave = (bookData.tags || []).filter(tag => tag && tag.trim() !== "");
      
      // 未確定inputValueも考慮
      if (bookData.inputTagValue && !tagsToSave.includes(bookData.inputTagValue.trim())) {
        tagsToSave = [...tagsToSave, bookData.inputTagValue.trim()];
      }
      tagsToSave = tagsToSave.filter(tag => tag && tag.trim() !== "");

      const docRef = await addDoc(collection(db, "books"), {
        userId: user.uid,
        isbn: bookData.isbn || '',
        title: bookData.title,
        author: bookData.author || '',
        publisher: bookData.publisher || '',
        publishedDate: bookData.publishedDate || '',
        coverImageUrl: bookData.coverImageUrl || '',
        tags: tagsToSave,
        status: bookData.status || DEFAULT_BOOK_STATUS,
        acquisitionType: bookData.acquisitionType || 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // タグ履歴に保存
      if (tagsToSave.length > 0) {
        await saveTagsToHistory(tagsToSave);
      }

      // 初期ステータスを履歴に記録
      const initialStatus = bookData.status || DEFAULT_BOOK_STATUS;
      if (initialStatus) {
        try {
          const historyRef = collection(db, 'books', docRef.id, 'statusHistory');
          await addDoc(historyRef, {
            status: initialStatus,
            previousStatus: null, // 初期ステータスなので前のステータスは無し
            changedAt: serverTimestamp(),
            changedBy: user.uid,
            notes: '書籍追加時の初期ステータス',
            createdAt: serverTimestamp()
          });
        } catch (historyError) {
          console.error("Error adding initial status history:", historyError);
          // 履歴の追加に失敗してもメインの処理は続行
        }
      }

      return docRef.id;
    } catch (err) {
      console.error("Error adding book:", err);
      const errorMessage = "書籍の追加に失敗しました: " + err.message;
      setGlobalError(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, setGlobalError, saveTagsToHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addBook,
    loading,
    error,
    clearError,
  };
};
