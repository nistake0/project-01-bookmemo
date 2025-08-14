import { useEffect, useMemo, useState, useContext } from 'react';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

/**
 * 集計用ユーティリティ
 */
function incrementCount(map, key, by = 1) {
  if (!key) return;
  const current = map.get(key) || 0;
  map.set(key, current + by);
}

/**
 * アプリ全体の統計値を取得するフック。
 * - 書籍数サマリー
 * - タグ使用頻度（書籍・メモ）
 */
export default function useStats() {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [books, setBooks] = useState([]);
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      if (!user) {
        setBooks([]);
        setMemos([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // 書籍一覧
        const booksQ = query(collection(db, 'books'), where('userId', '==', user.uid));
        const booksSnap = await getDocs(booksQ);
        const loadedBooks = booksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // メモ（コレクショングループ）
        const memosQ = query(collectionGroup(db, 'memos'), where('userId', '==', user.uid));
        const memosSnap = await getDocs(memosQ);
        const loadedMemos = memosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (!cancelled) {
          setBooks(loadedBooks);
          setMemos(loadedMemos);
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
        if (!cancelled) {
          setError('統計情報の取得に失敗しました。');
          setGlobalError('統計情報の取得に失敗しました。');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const summary = useMemo(() => {
    const totalBooks = books.length;
    const finishedBooks = books.filter(b => (b.status || 'reading') === 'finished').length;
    const readingBooks = books.filter(b => (b.status || 'reading') === 'reading').length;
    return { totalBooks, finishedBooks, readingBooks };
  }, [books]);

  const tagStats = useMemo(() => {
    // タグ頻度（書籍・メモ）
    const bookTagCount = new Map();
    const memoTagCount = new Map();

    for (const b of books) {
      const tags = Array.isArray(b.tags) ? b.tags : [];
      for (const t of tags) incrementCount(bookTagCount, String(t).trim());
    }

    for (const m of memos) {
      const tags = Array.isArray(m.tags) ? m.tags : [];
      for (const t of tags) incrementCount(memoTagCount, String(t).trim());
    }

    // 統合
    const allTagKeys = new Set([...bookTagCount.keys(), ...memoTagCount.keys()]);
    const rows = [];
    for (const tag of allTagKeys) {
      const bookCount = bookTagCount.get(tag) || 0;
      const memoCount = memoTagCount.get(tag) || 0;
      rows.push({ tag, bookCount, memoCount, totalCount: bookCount + memoCount });
    }

    // 多い順
    rows.sort((a, b) => b.totalCount - a.totalCount || a.tag.localeCompare(b.tag));
    return rows;
  }, [books, memos]);

  return {
    loading,
    error,
    summary,
    tagStats,
  };
}


