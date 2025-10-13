import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { 
  BOOK_STATUS, 
  DEFAULT_BOOK_STATUS,
  FILTER_STATUSES,
  FILTER_LABELS
} from '../constants/bookStatus';
import { filterBooks, normalizeTag as normalizeTagUtil } from './useBookFiltering';
import { computeBookStats } from './useBookStats';

export const useBookList = () => {
  // Reactコンテキストの安全性チェック
  try {
    if (typeof React === 'undefined' || !React.useState) {
      return {
        allBooks: [],
        filteredBooks: [],
        stats: { total: 0, tsundoku: 0, reading: 0, reReading: 0, finished: 0, filtered: 0 },
        loading: false,
        error: null,
        filter: FILTER_STATUSES.READING,
        searchText: '',
        fetchBooks: async () => {},
        handleFilterChange: () => {},
        handleSearchChange: () => {},
        clearSearch: () => {},
        clearFilter: () => {},
        normalizeTag: () => '',
      };
    }
  } catch (error) {
    console.warn('React context not available in useBookList:', error);
    return {
      allBooks: [],
      filteredBooks: [],
      stats: { total: 0, reading: 0, finished: 0, filtered: 0 },
      loading: false,
      error: null,
      filter: 'reading',
      searchText: '',
      fetchBooks: async () => {},
      handleFilterChange: () => {},
      handleSearchChange: () => {},
      clearSearch: () => {},
      clearFilter: () => {},
      normalizeTag: () => '',
    };
  }

  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(FILTER_STATUSES.READING_GROUP);
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
      
      const q = query(
        collection(db, "books"),
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
      setGlobalError("書籍一覧の取得に失敗しました。");
      setError("書籍一覧の取得に失敗しました。");
    } finally {
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
    setFilter(FILTER_STATUSES.READING_GROUP);
  }, []);

  // フィルタリング・検索ロジック（外部関数に委譲）
  const filteredBooks = filterBooks(allBooks, filter, searchText);

  // 統計情報（外部関数に委譲）
  const stats = computeBookStats(allBooks, filteredBooks);

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
    normalizeTag: normalizeTagUtil,
  };
};
