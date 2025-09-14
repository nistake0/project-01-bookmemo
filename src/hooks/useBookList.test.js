import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookList } from './useBookList';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

// モック設定
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));
// ErrorDialogContext は実際の Provider を使う



jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));

describe('useBookList', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockSetGlobalError = jest.fn();

  // Firestore モック関数を取得
  const { collection, query, where, orderBy, getDocs } = require('firebase/firestore');

  const mockBooks = [
    {
      id: 'book1',
      title: 'テスト本1',
      author: '著者1',
      status: 'reading',
      tags: ['小説', '名作'],
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'book2',
      title: 'テスト本2',
      author: '著者2',
      status: 'finished',
      tags: ['技術書', 'プログラミング'],
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'book3',
      title: '小説タイトル',
      author: '小説著者',
      status: 'reading',
      tags: ['小説', '恋愛'],
      updatedAt: new Date('2024-01-03'),
    },
  ];

  // Provider ラッパー
  const wrapper = ({ children }) => (
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {children}
    </ErrorDialogContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトモック設定
    useAuth.mockReturnValue({ user: mockUser });
    // Firestore モック設定
    collection.mockReturnValue('mock-collection');
    where.mockReturnValue('mock-where');
    orderBy.mockReturnValue('mock-orderBy');
    query.mockReturnValue('mock-query');
    
    const mockQuerySnapshot = {
      docs: mockBooks.map(book => ({
        id: book.id,
        data: () => book,
      })),
    };
    getDocs.mockResolvedValue(mockQuerySnapshot);
  });

  const renderUseBookList = () => {
    return renderHook(() => useBookList(), { wrapper });
  };

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderUseBookList();

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.allBooks).toEqual([]);
      expect(result.current.filteredBooks).toEqual([]);
      expect(result.current.filter).toBe('reading');
      expect(result.current.searchText).toBe('');
      expect(result.current.stats).toEqual({
        total: 0,
        tsundoku: 0,
        reading: 0,
        reReading: 0,
        finished: 0,
        filtered: 0,
      });
    });
  });

  describe('書籍一覧の取得', () => {
    it('ユーザーが存在する場合、書籍一覧を取得する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(collection).toHaveBeenCalledWith({}, 'books');
      // v9 API: where/orderBy はパラメータのみ
      expect(where).toHaveBeenCalledWith('userId', '==', 'test-user-id');
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(query).toHaveBeenCalledWith('mock-collection', 'mock-where', 'mock-orderBy');
      expect(getDocs).toHaveBeenCalledWith('mock-query');

      expect(result.current.allBooks).toEqual(mockBooks);
      expect(result.current.filteredBooks).toEqual([mockBooks[0], mockBooks[2]]); // readingのみ
      expect(result.current.stats).toEqual({
        total: 3,
        tsundoku: 0,
        reading: 2,
        reReading: 0,
        finished: 1,
        filtered: 2,
      });
    });

    it('ユーザーが存在しない場合、空の配列を設定する', async () => {
      useAuth.mockReturnValue({ user: null });
      
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allBooks).toEqual([]);
      expect(result.current.filteredBooks).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、エラー状態を設定する', async () => {
      const mockError = new Error('Firestore error');
      getDocs.mockRejectedValue(mockError);

      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('書籍一覧の取得に失敗しました。');
      expect(mockSetGlobalError).toHaveBeenCalledWith('書籍一覧の取得に失敗しました。');
    });
  });

  describe('フィルタリング機能', () => {
    it('ステータスフィルターが正しく動作する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 初期状態（reading）
      expect(result.current.filteredBooks).toEqual([mockBooks[0], mockBooks[2]]);

      // finishedに変更
      act(() => {
        result.current.handleFilterChange(null, 'finished');
      });

      expect(result.current.filter).toBe('finished');
      expect(result.current.filteredBooks).toEqual([mockBooks[1]]);

      // allに変更
      act(() => {
        result.current.handleFilterChange(null, 'all');
      });

      expect(result.current.filter).toBe('all');
      expect(result.current.filteredBooks).toEqual(mockBooks);
    });

    it('フィルターをクリアできる', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // フィルターを変更
      act(() => {
        result.current.handleFilterChange(null, 'finished');
      });

      expect(result.current.filter).toBe('finished');

      // クリア
      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter).toBe('reading');
    });
  });

  describe('検索機能', () => {
    it('タイトルでの検索が正しく動作する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // タイトル/タグ検索（小説は book3 のタイトルおよび book1 のタグに一致）
      act(() => {
        result.current.handleSearchChange({ target: { value: '小説' } });
      });

      expect(result.current.searchText).toBe('小説');
      expect(result.current.filteredBooks).toEqual([mockBooks[0], mockBooks[2]]);
    });

    it('著者での検索が正しく動作する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 著者検索
      act(() => {
        result.current.handleSearchChange({ target: { value: '著者1' } });
      });

      expect(result.current.filteredBooks).toEqual([mockBooks[0]]);
    });

    it('タグでの検索が正しく動作する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // タグ検索（finished を含めるため all に切替）
      act(() => {
        result.current.handleFilterChange(null, 'all');
      });
      // タグ検索
      act(() => {
        result.current.handleSearchChange({ target: { value: '技術書' } });
      });

      expect(result.current.filteredBooks).toEqual([mockBooks[1]]);
    });

    it('大文字小文字を区別しない検索が動作する', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 大文字で検索（finished を含めるため all に切替）
      act(() => {
        result.current.handleFilterChange(null, 'all');
      });
      // 大文字で検索
      act(() => {
        result.current.handleSearchChange({ target: { value: 'テスト本' } });
      });

      expect(result.current.filteredBooks).toEqual([mockBooks[0], mockBooks[1]]);
    });

    it('検索をクリアできる', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 検索を設定
      act(() => {
        result.current.handleSearchChange({ target: { value: 'テスト' } });
      });

      expect(result.current.searchText).toBe('テスト');

      // クリア
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchText).toBe('');
      expect(result.current.filteredBooks).toEqual([mockBooks[0], mockBooks[2]]); // readingのみ
    });
  });

  describe('統計情報', () => {
    it('統計情報が正しく計算される', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        total: 3,
        tsundoku: 0,
        reading: 2,
        reReading: 0,
        finished: 1,
        filtered: 2, // readingのみ表示
      });
    });

    it('フィルター変更時に統計情報が更新される', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // allフィルターに変更
      act(() => {
        result.current.handleFilterChange(null, 'all');
      });

      expect(result.current.stats.filtered).toBe(3); // 全件表示
    });
  });

  describe('fetchBooks関数', () => {
    it('手動で書籍一覧を再取得できる', async () => {
      const { result } = renderUseBookList();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 新しいデータでモックを更新
      const newMockBooks = [
        { id: 'book4', title: '新しい本', status: 'reading' }
      ];
      const newMockQuerySnapshot = {
        docs: newMockBooks.map(book => ({
          id: book.id,
          data: () => book,
        })),
      };
      getDocs.mockResolvedValue(newMockQuerySnapshot);

      // 手動で再取得
      act(() => {
        result.current.fetchBooks();
      });

      await waitFor(() => {
        expect(result.current.allBooks).toEqual(newMockBooks);
      });
    });
  });

  describe('タグ正規化', () => {
    it('全角英数字を半角に変換する', () => {
      const { result } = renderUseBookList();

      expect(result.current.normalizeTag('ＴＥＳＴ')).toBe('test');
      expect(result.current.normalizeTag('ｔｅｓｔ')).toBe('test');
      expect(result.current.normalizeTag('１２３')).toBe('123');
    });

    it('大文字を小文字に変換する', () => {
      const { result } = renderUseBookList();

      expect(result.current.normalizeTag('TEST')).toBe('test');
      expect(result.current.normalizeTag('Test')).toBe('test');
    });

    it('nullやundefinedを空文字列に変換する', () => {
      const { result } = renderUseBookList();

      expect(result.current.normalizeTag(null)).toBe('');
      expect(result.current.normalizeTag(undefined)).toBe('');
      expect(result.current.normalizeTag('')).toBe('');
    });
  });
});
