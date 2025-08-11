import { renderHook, act, waitFor } from '@testing-library/react';
import { useTagStats } from './useTagStats';
import { collection, query, getDocs, where } from 'firebase/firestore';

// Firestoreのモック
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: {}
}));

const mockGetDocs = getDocs;
const mockCollection = collection;
const mockQuery = query;
const mockWhere = where;

describe('useTagStats', () => {
  const mockUser = { uid: 'test-user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useTagStats(mockUser));

    expect(result.current.tagStats).toEqual({});
    expect(result.current.loading).toBe(true); // 初期状態ではloadingがtrue
    expect(result.current.error).toBe(null);
    expect(typeof result.current.fetchTagStats).toBe('function');
    expect(typeof result.current.getSortedTagStats).toBe('function');
    expect(typeof result.current.getTagStat).toBe('function');
    expect(typeof result.current.clearStats).toBe('function');
  });

  test('タグ統計データを正しく取得する', async () => {
    // モックデータ
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説', '文学'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      },
      {
        id: 'book2',
        data: () => ({
          tags: ['技術書', 'プログラミング'],
          updatedAt: { toDate: () => new Date('2024-02-01') }
        })
      }
    ];

    const mockMemosData = [
      {
        id: 'memo1',
        data: () => ({
          tags: ['小説', '感想'],
          updatedAt: { toDate: () => new Date('2024-03-01') }
        })
      }
    ];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // 初期状態ではloadingがtrue
    expect(result.current.loading).toBe(true);

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tagStats).toEqual({
      '小説': {
        bookCount: 1,
        memoCount: 1,
        lastUsed: new Date('2024-03-01')
      },
      '文学': {
        bookCount: 1,
        memoCount: 0,
        lastUsed: new Date('2024-01-01')
      },
      '技術書': {
        bookCount: 1,
        memoCount: 0,
        lastUsed: new Date('2024-02-01')
      },
      'プログラミング': {
        bookCount: 1,
        memoCount: 0,
        lastUsed: new Date('2024-02-01')
      },
      '感想': {
        bookCount: 0,
        memoCount: 1,
        lastUsed: new Date('2024-03-01')
      }
    });
  });

  test('タグ統計を正しくソートする（使用頻度順）', async () => {
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説', '文学'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      },
      {
        id: 'book2',
        data: () => ({
          tags: ['小説'],
          updatedAt: { toDate: () => new Date('2024-02-01') }
        })
      }
    ];

    const mockMemosData = [
      {
        id: 'memo1',
        data: () => ({
          tags: ['小説'],
          updatedAt: { toDate: () => new Date('2024-03-01') }
        })
      }
    ];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sortedStats = result.current.getSortedTagStats('count', 'desc');
    
    expect(sortedStats[0].tag).toBe('小説');
    expect(sortedStats[0].totalCount).toBe(3); // 本2件 + メモ1件
    expect(sortedStats[1].tag).toBe('文学');
    expect(sortedStats[1].totalCount).toBe(1);
  });

  test('タグ統計を名前順でソートする', async () => {
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説', '文学'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }
    ];

    const mockMemosData = [];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sortedStats = result.current.getSortedTagStats('name', 'asc');
    
    // 日本語のソート順序を確認（ひらがな・カタカナ・漢字の順序）
    expect(sortedStats[0].tag).toBe('文学');
    expect(sortedStats[1].tag).toBe('小説');
  });

  test('特定のタグの統計を取得する', async () => {
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }
    ];

    const mockMemosData = [];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const tagStat = result.current.getTagStat('小説');
    expect(tagStat).toEqual({
      bookCount: 1,
      memoCount: 0,
      lastUsed: new Date('2024-01-01')
    });

    const nonExistentTagStat = result.current.getTagStat('存在しないタグ');
    expect(nonExistentTagStat).toBe(null);
  });

  test('統計データをクリアする', async () => {
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }
    ];

    const mockMemosData = [];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Object.keys(result.current.tagStats).length).toBeGreaterThan(0);

    act(() => {
      result.current.clearStats();
    });

    expect(result.current.tagStats).toEqual({});
    expect(result.current.error).toBe(null);
  });

  test('エラーハンドリングが正しく動作する', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useTagStats(mockUser));

    await act(async () => {
      await result.current.fetchTagStats();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Firestore error');
    expect(result.current.loading).toBe(false);
  });

  test('ユーザーがnullの場合、統計を取得しない', () => {
    const { result } = renderHook(() => useTagStats(null));

    expect(result.current.tagStats).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  test('タグの種類が正しく判定される', async () => {
    const mockBooksData = [
      {
        id: 'book1',
        data: () => ({
          tags: ['小説'],
          updatedAt: { toDate: () => new Date('2024-01-01') }
        })
      }
    ];

    const mockMemosData = [
      {
        id: 'memo1',
        data: () => ({
          tags: ['小説', '感想'],
          updatedAt: { toDate: () => new Date('2024-02-01') }
        })
      }
    ];

    mockGetDocs
      .mockResolvedValueOnce({
        forEach: (callback) => mockBooksData.forEach(callback)
      })
      .mockResolvedValueOnce({
        forEach: (callback) => mockMemosData.forEach(callback)
      });

    const { result } = renderHook(() => useTagStats(mockUser));

    // useEffectが自動実行されるのを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const sortedStats = result.current.getSortedTagStats();
    
    const novelTag = sortedStats.find(stat => stat.tag === '小説');
    expect(novelTag.type).toBe('both'); // 本とメモの両方に使用

    const impressionTag = sortedStats.find(stat => stat.tag === '感想');
    expect(impressionTag.type).toBe('memo'); // メモのみに使用
  });
}); 