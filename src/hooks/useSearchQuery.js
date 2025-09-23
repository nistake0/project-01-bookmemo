import { collection, query, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { getDateRangeFilter } from '../utils/searchDateRange';

// 検索条件から Firestore クエリ群を構築（books と memos）
// APIは関数型にして useSearch から呼び出しやすくする
export function buildSearchQueries(db, user, conditions, resultLimit = 50) {
  if (!user) return [];

  const { status, dateRange, selectedTags } = conditions || {};

  const queries = [];

  // books クエリ
  const bookQueryConstraints = [where('userId', '==', user.uid)];

  if (status && status !== 'all') {
    bookQueryConstraints.push(where('status', '==', status));
  }

  if (dateRange && dateRange.type !== 'none') {
    const { startDate, endDate } = getDateRangeFilter(dateRange);
    if (startDate) bookQueryConstraints.push(where('updatedAt', '>=', startDate));
    if (endDate) bookQueryConstraints.push(where('updatedAt', '<=', endDate));
  }

  // タグはネスト配列などを考慮し、可能な場合のみ array-contains-any を適用
  if (selectedTags && selectedTags.length > 0) {
    if (Array.isArray(selectedTags) && !selectedTags.some((t) => Array.isArray(t))) {
      bookQueryConstraints.push(where('tags', 'array-contains-any', selectedTags));
    }
  }

  const bookQuery = query(
    collection(db, 'books'),
    ...bookQueryConstraints,
    orderBy('updatedAt', 'desc'),
    limit(resultLimit)
  );
  queries.push({ type: 'book', query: bookQuery });

  // memos クエリ（全文検索はクライアントサイドで実施）
  const memoQuery = query(
    collectionGroup(db, 'memos'),
    where('userId', '==', user.uid),
    // orderBy('updatedAt', 'desc') は index 要求回避のため未指定
    limit(resultLimit * 3)
  );
  queries.push({ type: 'memo', query: memoQuery });

  return queries;
}

export default { buildSearchQueries };


