import { filterBooks, normalizeTag } from '../useBookFiltering';
import { FILTER_STATUSES, BOOK_STATUS } from '../../constants/bookStatus';

describe('useBookFiltering utilities', () => {
  describe('normalizeTag', () => {
    it('converts full-width alphanumerics to half-width and lowercases', () => {
      expect(normalizeTag('ＴＥＳＴ')).toBe('test');
      expect(normalizeTag('ｔｅｓｔ')).toBe('test');
      expect(normalizeTag('１２３ABC')).toBe('123abc');
    });

    it('handles null/undefined/empty', () => {
      expect(normalizeTag(null)).toBe('');
      expect(normalizeTag(undefined)).toBe('');
      expect(normalizeTag('')).toBe('');
    });
  });

  describe('filterBooks', () => {
    const books = [
      { id: '1', title: 'JavaScript入門', author: '山田太郎', tags: ['プログラミング'], status: BOOK_STATUS.READING },
      { id: '2', title: 'Effective TypeScript', author: 'Dan', tags: ['Programming', 'TS'], status: BOOK_STATUS.FINISHED },
      { id: '3', title: 'アルゴリズム図鑑', author: '鈴木', tags: ['コンピュータ'], status: BOOK_STATUS.TSUNDOKU },
      { id: '4', title: 'Reactパターン', author: 'Ｙａｍａｄａ', tags: ['ＪＳ', 'ＵＩ'], status: BOOK_STATUS.RE_READING },
      { id: '5', title: 'Python入門', author: '佐藤', tags: ['プログラミング'], status: BOOK_STATUS.SUSPENDED },
    ];

    it('returns all when filter is ALL and no search text', () => {
      const result = filterBooks(books, FILTER_STATUSES.ALL, '');
      expect(result.map(b => b.id)).toEqual(['1','2','3','4','5']);
    });

    it('filters by status', () => {
      const result = filterBooks(books, FILTER_STATUSES.FINISHED, '');
      expect(result.map(b => b.id)).toEqual(['2']);
    });

    it('filters by reading-group (reading + re-reading)', () => {
      const result = filterBooks(books, FILTER_STATUSES.READING_GROUP, '');
      // reading (id:1) + re-reading (id:4)
      expect(result.map(b => b.id)).toEqual(['1', '4']);
    });

    it('filters by title/author/tags with normalization', () => {
      // author includes full-width Yamada, search with lower ascii
      const r1 = filterBooks(books, FILTER_STATUSES.ALL, 'yamada');
      expect(r1.map(b => b.id)).toEqual(['4']);

      // tag includes full-width JS matches 'js'
      const r2 = filterBooks(books, FILTER_STATUSES.ALL, 'js');
      expect(r2.map(b => b.id)).toEqual(['4']);

      // title match
      const r3 = filterBooks(books, FILTER_STATUSES.ALL, 'typescript');
      expect(r3.map(b => b.id)).toEqual(['2']);
    });

    it('handles null/empty tags without throwing', () => {
      const withNull = [{ id: 'x', title: 't', author: 'a', tags: null, status: BOOK_STATUS.READING }];
      const result = filterBooks(withNull, FILTER_STATUSES.ALL, 'tag');
      expect(result).toHaveLength(0);
    });

    it('returns empty array when input is not array', () => {
      expect(filterBooks(null, FILTER_STATUSES.ALL, '')).toEqual([]);
    });
  });
});


