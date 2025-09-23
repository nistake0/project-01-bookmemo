import { computeBookStats } from '../useBookStats';
import { BOOK_STATUS } from '../../constants/bookStatus';

describe('useBookStats utilities', () => {
  it('computes counts correctly', () => {
    const books = [
      { status: BOOK_STATUS.TSUNDOKU },
      { status: BOOK_STATUS.READING },
      { status: BOOK_STATUS.READING },
      { status: BOOK_STATUS.RE_READING },
      { status: BOOK_STATUS.FINISHED },
    ];
    const filtered = books.slice(0, 3);
    const stats = computeBookStats(books, filtered);
    expect(stats.total).toBe(5);
    expect(stats.tsundoku).toBe(1);
    expect(stats.reading).toBe(2);
    expect(stats.reReading).toBe(1);
    expect(stats.finished).toBe(1);
    expect(stats.filtered).toBe(3);
  });

  it('handles empty inputs', () => {
    const stats = computeBookStats([], []);
    expect(stats.total).toBe(0);
    expect(stats.filtered).toBe(0);
  });
});


