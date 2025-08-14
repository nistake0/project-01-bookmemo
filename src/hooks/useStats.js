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

  const statusDistribution = useMemo(() => {
    const finished = books.filter(b => (b.status || 'reading') === 'finished').length;
    const reading = books.filter(b => (b.status || 'reading') === 'reading').length;
    return { finished, reading };
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

  const monthlyFinished = useMemo(() => {
    // 直近12ヶ月の読了冊数を月別集計（finishedAtが存在しない場合はupdatedAtやcreatedAtの年月にフォールバック）
    const now = new Date();
    const buckets = [];
    const keyToIndex = new Map();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keyToIndex.set(key, buckets.length);
      buckets.push({ key, year: d.getFullYear(), month: d.getMonth() + 1, count: 0 });
    }

    for (const b of books) {
      const status = b.status || 'reading';
      const ts = b.finishedAt || b.updatedAt || b.createdAt;
      if (!ts || status !== 'finished') continue;
      // Firestore Timestamp互換（toDate）やDate、文字列ISOを許容
      const date = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
      if (Number.isNaN(date?.getTime?.())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!keyToIndex.has(key)) continue; // 直近12ヶ月のみ
      const idx = keyToIndex.get(key);
      buckets[idx].count += 1;
    }

    return buckets;
  }, [books]);

  const monthlyAddedBooks = useMemo(() => {
    const now = new Date();
    const buckets = [];
    const keyToIndex = new Map();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keyToIndex.set(key, buckets.length);
      buckets.push({ key, year: d.getFullYear(), month: d.getMonth() + 1, count: 0 });
    }

    for (const b of books) {
      const ts = b.createdAt || b.updatedAt || b.finishedAt;
      if (!ts) continue;
      const date = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
      if (Number.isNaN(date?.getTime?.())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!keyToIndex.has(key)) continue;
      const idx = keyToIndex.get(key);
      buckets[idx].count += 1;
    }

    return buckets;
  }, [books]);

  const monthlyMemos = useMemo(() => {
    const now = new Date();
    const buckets = [];
    const keyToIndex = new Map();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keyToIndex.set(key, buckets.length);
      buckets.push({ key, year: d.getFullYear(), month: d.getMonth() + 1, count: 0 });
    }

    for (const m of memos) {
      const ts = m.createdAt || m.updatedAt;
      if (!ts) continue;
      const date = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
      if (Number.isNaN(date?.getTime?.())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!keyToIndex.has(key)) continue;
      const idx = keyToIndex.get(key);
      buckets[idx].count += 1;
    }

    return buckets;
  }, [memos]);

  const topAuthors = useMemo(() => {
    const count = new Map();
    for (const b of books) {
      const author = (b.author || '').toString().trim();
      if (!author) continue;
      incrementCount(count, author);
    }
    const rows = [...count.entries()].map(([author, total]) => ({ author, total }));
    rows.sort((a, b) => b.total - a.total || a.author.localeCompare(b.author));
    return rows;
  }, [books]);

  const topPublishers = useMemo(() => {
    const count = new Map();
    for (const b of books) {
      const publisher = (b.publisher || '').toString().trim();
      if (!publisher) continue;
      incrementCount(count, publisher);
    }
    const rows = [...count.entries()].map(([publisher, total]) => ({ publisher, total }));
    rows.sort((a, b) => b.total - a.total || a.publisher.localeCompare(b.publisher));
    return rows;
  }, [books]);

  return {
    loading,
    error,
    summary,
    tagStats,
    monthlyFinished,
    monthlyAddedBooks,
    monthlyMemos,
    topAuthors,
    topPublishers,
    statusDistribution,
  };
}


