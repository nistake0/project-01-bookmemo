import { FILTER_STATUSES, DEFAULT_BOOK_STATUS, BOOK_STATUS } from '../constants/bookStatus';

// タグ・文字列正規化（小文字化＋全角英数字→半角）
export function normalizeTag(tag) {
  if (!tag) return '';
  const zenkakuToHankaku = (s) => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
  return zenkakuToHankaku(String(tag)).toLowerCase();
}

// 書籍一覧フィルタリング
export function filterBooks(allBooks, filter, searchText) {
  if (!Array.isArray(allBooks)) return [];

  const filtered = allBooks.filter((book) => {
    // ステータスフィルター
    if (filter !== FILTER_STATUSES.ALL) {
      const status = book.status || DEFAULT_BOOK_STATUS;
      
      // 読書中グループフィルター（reading + re-reading のみ）
      if (filter === FILTER_STATUSES.READING_GROUP) {
        if (![BOOK_STATUS.READING, BOOK_STATUS.RE_READING].includes(status)) {
          return false;
        }
      } else {
        // 通常の個別ステータスフィルター
        if (status !== filter) return false;
      }
    }

    // 検索テキストフィルター
    if (!searchText || !String(searchText).trim()) return true;
    const normalizedQuery = normalizeTag(searchText);

    return (
      (book.title && normalizeTag(book.title).includes(normalizedQuery)) ||
      (book.author && normalizeTag(book.author).includes(normalizedQuery)) ||
      (Array.isArray(book.tags) && book.tags.some((tag) => normalizeTag(tag).includes(normalizedQuery)))
    );
  });

  return filtered;
}

export default { filterBooks, normalizeTag };


