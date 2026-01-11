import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

/**
 * 書籍選択ダイアログ等で使用する軽量な書籍リスト取得フック
 *  - タイトル・著者など最小限のフィールドのみ取得
 *  - クライアント側でタイトル順にソート
 */
export const useBookLookup = () => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBooks = useCallback(async () => {
    if (!user?.uid) {
      setBooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const booksQuery = query(
        collection(db, 'books'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(booksQuery);

      const fetched = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() || {};
        return {
          id: docSnapshot.id,
          title: data.title || '',
          titleLower: (data.title || '').toLocaleLowerCase(),
          author: data.author || '',
          status: data.status || '',
          updatedAt: data.updatedAt || null,
          coverImageUrl: data.coverImageUrl || '',
        };
      });

      const sorted = fetched.sort((a, b) => {
        if (a.titleLower === b.titleLower) {
          return (a.updatedAt?.seconds || 0) < (b.updatedAt?.seconds || 0) ? 1 : -1;
        }
        return a.titleLower.localeCompare(b.titleLower);
      });

      setBooks(sorted);
    } catch (err) {
      console.error('Error fetching books for lookup:', err);
      setGlobalError('書籍リストの取得に失敗しました。');
      setError('書籍リストの取得に失敗しました。');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, setGlobalError]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const data = useMemo(
    () =>
      books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        status: book.status,
        updatedAt: book.updatedAt,
        coverImageUrl: book.coverImageUrl,
      })),
    [books]
  );

  return {
    books: data,
    loading,
    error,
    refresh: fetchBooks,
  };
};
