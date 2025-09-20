import { useMemo } from 'react';
import { BOOK_STATUS } from '../constants/bookStatus';

/**
 * 書籍統計計算専用フック
 * 統計情報の計算のみを担当
 */
export const useBookStats = (allBooks, filteredBooks) => {
  const stats = useMemo(() => {
    const total = allBooks.length;
    const tsundoku = allBooks.filter(book => (book.status || BOOK_STATUS.TSUNDOKU) === BOOK_STATUS.TSUNDOKU).length;
    const reading = allBooks.filter(book => (book.status || BOOK_STATUS.TSUNDOKU) === BOOK_STATUS.READING).length;
    const reReading = allBooks.filter(book => (book.status || BOOK_STATUS.TSUNDOKU) === BOOK_STATUS.RE_READING).length;
    const finished = allBooks.filter(book => (book.status || BOOK_STATUS.TSUNDOKU) === BOOK_STATUS.FINISHED).length;
    const filtered = filteredBooks.length;

    return {
      total,
      tsundoku,
      reading,
      reReading,
      finished,
      filtered
    };
  }, [allBooks, filteredBooks]);

  return stats;
};

export default useBookStats;
