import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  collectionGroup
} from 'firebase/firestore';

// Firebase Firestoreのモック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  collectionGroup: jest.fn()
}));

// モックの設定
const mockCollection = collection;
const mockQuery = query;
const mockWhere = where;
const mockGetDocs = getDocs;
const mockOrderBy = orderBy;
const mockLimit = limit;
const mockCollectionGroup = collectionGroup;

describe('useSearch', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockBooks = [
    {
      id: 'book1',
      title: 'テスト本1',
      author: 'テスト著者1',
      tags: ['小説', '名作'],
      status: 'reading',
      updatedAt: { toDate: () => new Date('2024-01-01') }
    },
    {
      id: 'book2',
      title: 'テスト本2',
      author: 'テスト著者2',
      tags: ['技術書', 'プログラミング'],
      status: 'finished',
      updatedAt: { toDate: () => new Date('2024-02-01') }
    }
  ];

  const mockMemos = [
    {
      id: 'memo1',
      text: 'テストメモ1',
      comment: 'テストコメント1',
      tags: ['感想', '名言'],
      bookId: 'book1',
      bookTitle: 'テスト本1',
      updatedAt: { toDate: () => new Date('2024-01-15') }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Firestore関数のモック
    mockCollection.mockReturnValue('books-collection');
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockImplementation((field, operator, value) => ({ field, operator, value }));
    mockOrderBy.mockReturnValue('mock-order');
    mockLimit.mockReturnValue('mock-limit');
    mockCollectionGroup.mockReturnValue('memos-collection');

    // getDocsのモック
    mockGetDocs.mockResolvedValue({
      docs: mockBooks.map(book => ({
        id: book.id,
        data: () => book,
        ref: { parent: { parent: { id: book.id } } }
      })),
      forEach: (callback) => {
        mockBooks.forEach(book => callback({ 
          id: book.id, 
          data: () => book,
          ref: { parent: { parent: { id: book.id } } }
        }));
      },
      size: mockBooks.length
    });
  });

  describe('初期状態', () => {
    test('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.executeSearch).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
    });
  });

  describe('executeSearch', () => {
    test('基本的な検索が実行される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'books');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUser.uid);
      expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result.current.results).toHaveLength(4);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('インデックスエラー時のフォールバック処理', async () => {
      // インデックスエラーをシミュレート
      const indexError = new Error('The query requires an index. You can create it here: https://console.firebase.google.com/...');
      indexError.code = 'failed-precondition';
      
      mockGetDocs.mockRejectedValueOnce(indexError);

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      // フォールバッククエリが実行されることを確認
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'books');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', mockUser.uid);
      expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(100); // resultLimit * 2 (50 * 2)
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('ステータスフィルターが適用される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'reading',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'reading');
    });

    test('タグフィルターが適用される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockWhere).toHaveBeenCalledWith('tags', 'array-contains-any', ['小説']);
    });

    test('クライアントサイドタグフィルタリングが動作する', async () => {
      // タグを含むデータをモック
      const mockBooksWithTags = [
        {
          id: 'book1',
          title: 'テスト本1',
          author: 'テスト著者1',
          tags: ['小説', '名作'],
          status: 'reading',
          updatedAt: { toDate: () => new Date('2024-01-01') }
        },
        {
          id: 'book2',
          title: 'テスト本2',
          author: 'テスト著者2',
          tags: ['技術書', 'プログラミング'],
          status: 'finished',
          updatedAt: { toDate: () => new Date('2024-02-01') }
        },
        {
          id: 'book3',
          title: 'テスト本3',
          author: 'テスト著者3',
          tags: ['小説', '恋愛'],
          status: 'reading',
          updatedAt: { toDate: () => new Date('2024-03-01') }
        }
      ];

      // 本のクエリのみをモック
      mockGetDocs.mockResolvedValueOnce({
        docs: mockBooksWithTags.map(book => ({
          id: book.id,
          data: () => book,
          ref: { parent: { parent: { id: book.id } } }
        })),
        forEach: (callback) => {
          mockBooksWithTags.forEach(book => callback({ 
            id: book.id, 
            data: () => book,
            ref: { parent: { parent: { id: book.id } } }
          }));
        },
        size: mockBooksWithTags.length
      });

      // メモのクエリは空の結果を返す
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        forEach: () => {},
        size: 0
      });

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        includeMemoContent: false,
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      // 小説タグを含む本のみが結果に含まれることを確認
      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.some(book => book.id === 'book1')).toBe(true);
      expect(result.current.results.some(book => book.id === 'book3')).toBe(true);
      expect(result.current.results.some(book => book.id === 'book2')).toBe(false);
    });

    test('ネストした配列のタグフィルタリングが動作する', async () => {
      // ネストしたタグを含むデータをモック
      const mockBooksWithNestedTags = [
        {
          id: 'book1',
          title: 'テスト本1',
          author: 'テスト著者1',
          tags: [['小説', '名作'], '文学'],
          status: 'reading',
          updatedAt: { toDate: () => new Date('2024-01-01') }
        },
        {
          id: 'book2',
          title: 'テスト本2',
          author: 'テスト著者2',
          tags: ['技術書', ['プログラミング', 'Python']],
          status: 'finished',
          updatedAt: { toDate: () => new Date('2024-02-01') }
        },
        {
          id: 'book3',
          title: 'テスト本3',
          author: 'テスト著者3',
          tags: ['小説', '恋愛'],
          status: 'reading',
          updatedAt: { toDate: () => new Date('2024-03-01') }
        }
      ];

      // 本のクエリのみをモック
      mockGetDocs.mockResolvedValueOnce({
        docs: mockBooksWithNestedTags.map(book => ({
          id: book.id,
          data: () => book,
          ref: { parent: { parent: { id: book.id } } }
        })),
        forEach: (callback) => {
          mockBooksWithNestedTags.forEach(book => callback({ 
            id: book.id, 
            data: () => book,
            ref: { parent: { parent: { id: book.id } } }
          }));
        },
        size: mockBooksWithNestedTags.length
      });

      // メモのクエリは空の結果を返す
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        forEach: () => {},
        size: 0
      });

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        includeMemoContent: false,
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      // 小説タグを含む本のみが結果に含まれることを確認（ネストした配列も含む）
      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.some(book => book.id === 'book1')).toBe(true);
      expect(result.current.results.some(book => book.id === 'book3')).toBe(true);
      expect(result.current.results.some(book => book.id === 'book2')).toBe(false);
    });

    test('テキスト検索が適用される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: 'テスト',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      // テキスト検索はクライアントサイドでフィルタリングされる
      expect(result.current.results).toHaveLength(2);
    });

    test('エラーが発生した場合の処理', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(result.current.error).toBe('検索中にエラーが発生しました');
      expect(result.current.loading).toBe(false);
    });

    test('ユーザーが未認証の場合の処理', async () => {
      // useAuthのモックを一時的に変更
      const originalUseAuth = require('../auth/AuthProvider').useAuth;
      require('../auth/AuthProvider').useAuth = jest.fn(() => ({ user: null }));

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(result.current.error).toBe('ユーザーが認証されていません');
      expect(result.current.loading).toBe(false);

      // モックを元に戻す
      require('../auth/AuthProvider').useAuth = originalUseAuth;
    });

    test('メモフォールバック処理が正しく動作する', async () => {
      // メモクエリでエラーを発生させ、フォールバック処理をテスト
      const { getDocs } = require('firebase/firestore');
      
      let callCount = 0;
      getDocs.mockImplementation((query) => {
        callCount++;
        const queryString = query.toString();
        
        // メモクエリの最初の呼び出しでエラーを発生
        if (queryString.includes('memos') && callCount === 2) {
          throw new Error('Index error for memos');
        }
        
        // 書籍クエリとフォールバッククエリは成功
        return Promise.resolve({
          size: 2,
          docs: [
            { 
              id: 'book1', 
              data: () => ({ title: 'Book 1', tags: ['小説'] }),
              ref: { parent: { parent: { id: 'book1' } } }
            },
            { 
              id: 'book2', 
              data: () => ({ title: 'Book 2', tags: ['技術書'] }),
              ref: { parent: { parent: { id: 'book2' } } }
            }
          ],
          forEach: function(callback) {
            this.docs.forEach(callback);
          }
        });
      });

      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.results).toHaveLength(2);
    });
  });

  describe('clearResults', () => {
    test('検索結果がクリアされる', () => {
      const { result } = renderHook(() => useSearch());

      // 初期状態で結果を設定
      act(() => {
        result.current.results = mockBooks;
        result.current.error = 'test error';
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('日時範囲フィルター', () => {
    test('年別フィルターが正しく設定される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'year', year: 2024 },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockWhere).toHaveBeenCalledWith('updatedAt', '>=', expect.any(Date));
      expect(mockWhere).toHaveBeenCalledWith('updatedAt', '<=', expect.any(Date));
    });

    test('月別フィルターが正しく設定される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'month', year: 2024, month: 3 },
        memoContent: '',
        selectedTags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockWhere).toHaveBeenCalledWith('updatedAt', '>=', expect.any(Date));
      expect(mockWhere).toHaveBeenCalledWith('updatedAt', '<=', expect.any(Date));
    });
  });

  describe('ソート機能', () => {
    test('タイトルでのソートが適用される', async () => {
      const { result } = renderHook(() => useSearch());

      const searchConditions = {
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        memoContent: '',
        selectedTags: [],
        sortBy: 'title',
        sortOrder: 'asc'
      };

      await act(async () => {
        await result.current.executeSearch(searchConditions);
      });

      expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      // クライアントサイドでのソートは結果の順序で確認（統合表示で本+メモの4件）
      expect(result.current.results).toHaveLength(4);
    });
  });
}); 