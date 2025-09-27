import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { useContext } from 'react';

/**
 * 書籍重複チェックフック
 * ISBNで既存の書籍を検索し、重複をチェックする
 */
export const useBookDuplicateCheck = () => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateBook, setDuplicateBook] = useState(null);
  const [error, setError] = useState(null);

  /**
   * ISBNで既存書籍をチェック
   * @param {string} isbn - チェックするISBN
   * @returns {Object|null} 重複する書籍データ、なければnull
   */
  const checkDuplicate = useCallback(async (isbn) => {
    if (!user || !isbn || !isbn.trim()) {
      setDuplicateBook(null);
      return null;
    }

    setIsChecking(true);
    setError(null);
    setDuplicateBook(null);

    try {
      // ISBNで既存書籍を検索
      const booksRef = collection(db, 'books');
      const q = query(
        booksRef,
        where('userId', '==', user.uid),
        where('isbn', '==', isbn.trim())
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // 重複する書籍が見つかった
        const duplicateDoc = querySnapshot.docs[0];
        const duplicateData = {
          id: duplicateDoc.id,
          ...duplicateDoc.data()
        };
        setDuplicateBook(duplicateData);
        return duplicateData;
      } else {
        // 重複なし
        setDuplicateBook(null);
        return null;
      }
    } catch (err) {
      console.error('Error checking book duplicate:', err);
      const errorMessage = '書籍の重複チェックに失敗しました: ' + err.message;
      setError(errorMessage);
      setGlobalError(errorMessage);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [user, setGlobalError]);

  /**
   * 重複チェック状態をリセット
   */
  const resetDuplicateCheck = useCallback(() => {
    setDuplicateBook(null);
    setError(null);
    setIsChecking(false);
  }, []);

  return {
    isChecking,
    duplicateBook,
    error,
    checkDuplicate,
    resetDuplicateCheck
  };
};

export default useBookDuplicateCheck;
