import { BOOK_STATUS, DEFAULT_BOOK_STATUS } from '../constants/bookStatus';

export function computeBookStats(allBooks, filteredBooks) {
  const safeAll = Array.isArray(allBooks) ? allBooks : [];
  const total = safeAll.length;

  const countBy = (status) => safeAll.filter((book) => (book.status || DEFAULT_BOOK_STATUS) === status).length;

  return {
    total,
    tsundoku: countBy(BOOK_STATUS.TSUNDOKU),
    reading: countBy(BOOK_STATUS.READING),
    reReading: countBy(BOOK_STATUS.RE_READING),
    finished: countBy(BOOK_STATUS.FINISHED),
    filtered: Array.isArray(filteredBooks) ? filteredBooks.length : 0,
  };
}

export default { computeBookStats };


