import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

// タグ正規化関数（小文字化＋全角英数字→半角）
function normalizeTag(tag) {
  if (!tag) return '';
  // 全角英数字→半角
  const zenkakuToHankaku = s => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
  return zenkakuToHankaku(tag).toLowerCase();
}

export const useBookList = () => {

  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('reading');
  const [searchText, setSearchText] = useState('');

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setAllBooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('=== useBookList fetchBooks START ===');
      const q = query(
        collection(db, "books"),
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );
      
      console.log('=== useBookList getDocs START ===');
      const querySnapshot = await getDocs(q);
      console.log('=== useBookList getDocs END ===');
      
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('=== useBookList setAllBooks START ===');
      setAllBooks(data);
      console.log('=== useBookList setAllBooks END ===');
    } catch (error) {
      console.error("Error fetching books:", error);
      setGlobalError("書籍一覧の取得に失敗しました。");
      setError("書籍一覧の取得に失敗しました。");
    } finally {
      console.log('=== useBookList setLoading false ===');
      setLoading(false);
    }
  }, [user, setGlobalError]);

  const handleFilterChange = useCallback((event, newValue) => {
    setFilter(newValue);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchText(event.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const clearFilter = useCallback(() => {
    setFilter('reading');
  }, []);

  // フィルタリング・検索ロジック
  const filteredBooks = allBooks.filter(book => {
    // ステータスフィルター
    if (filter !== 'all') {
      const status = book.status || 'reading';
      if (status !== filter) return false;
    }
    
    // 検索テキストフィルター
    if (!searchText.trim()) return true;
    const normalizedQuery = normalizeTag(searchText);
    
    // タイトル・著者・タグで部分一致（正規化）
    return (
      (book.title && normalizeTag(book.title).includes(normalizedQuery)) ||
      (book.author && normalizeTag(book.author).includes(normalizedQuery)) ||
      (Array.isArray(book.tags) && book.tags.some(tag => normalizeTag(tag).includes(normalizedQuery)))
    );
  });

  // 統計情報
  const stats = {
    total: allBooks.length,
    reading: allBooks.filter(book => (book.status || 'reading') === 'reading').length,
    finished: allBooks.filter(book => book.status === 'finished').length,
    filtered: filteredBooks.length,
  };

  // ユーザーが変更されたときに書籍を再取得
  useEffect(() => {
    fetchBooks();
  }, [user?.uid]);

  return {
    // データ
    allBooks,
    filteredBooks,
    stats,
    
    // 状態
    loading,
    error,
    filter,
    searchText,
    
    // アクション
    fetchBooks,
    handleFilterChange,
    handleSearchChange,
    clearSearch,
    clearFilter,
    
    // ユーティリティ
    normalizeTag,
  };
};
