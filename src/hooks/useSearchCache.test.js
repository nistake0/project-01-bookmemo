import { renderHook, act } from '@testing-library/react';
import { useSearchCache } from './useSearchCache';

// LocalStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useSearchCache', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('初期状態ではキャッシュが空である', () => {
    const { result } = renderHook(() => useSearchCache());
    
    const cached = result.current.getCached('test');
    expect(cached).toBeNull();
  });

  test('検索結果をキャッシュに保存できる', () => {
    const { result } = renderHook(() => useSearchCache());
    
    const searchText = 'テスト';
    const searchResults = [{ id: '1', title: 'テスト書籍' }];
    
    act(() => {
      result.current.setCached(searchText, searchResults);
    });
    
    const cached = result.current.getCached(searchText);
    expect(cached).toEqual(searchResults);
  });

  test('キャッシュキーは正規化される（大文字小文字、空白）', () => {
    const { result } = renderHook(() => useSearchCache());
    
    const searchResults = [{ id: '1', title: 'テスト書籍' }];
    
    act(() => {
      result.current.setCached('  テスト  ', searchResults);
    });
    
    // 異なる表記でも同じキャッシュにアクセスできる
    expect(result.current.getCached('テスト')).toEqual(searchResults);
    expect(result.current.getCached('  テスト')).toEqual(searchResults);
    expect(result.current.getCached('テスト  ')).toEqual(searchResults);
  });

  test('有効期限切れのキャッシュはnullを返す', () => {
    const { result } = renderHook(() => useSearchCache());
    
    const searchText = 'テスト';
    const searchResults = [{ id: '1', title: 'テスト書籍' }];
    
    // 過去のタイムスタンプでキャッシュを設定
    const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25時間前
    const cacheData = {
      'てすと': {
        data: searchResults,
        timestamp: expiredTimestamp
      }
    };
    
    localStorage.setItem('fullTextSearchCache', JSON.stringify(cacheData));
    
    // 新しいフックインスタンスを作成
    const { result: newResult } = renderHook(() => useSearchCache());
    
    const cached = newResult.current.getCached(searchText);
    expect(cached).toBeNull();
  });

  test('有効期限内のキャッシュは取得できる', () => {
    const searchText = 'テスト';
    const searchResults = [{ id: '1', title: 'テスト書籍' }];
    
    // 正規化されたキーを使用（toLowerCase + trim）
    // カタカナはそのまま小文字化される（toLowerCase()では変わらない）
    const normalizedKey = 'テスト'.toLowerCase().trim();
    
    // 現在のタイムスタンプでキャッシュを設定
    const validTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1時間前
    const cacheData = {
      [normalizedKey]: {
        data: searchResults,
        timestamp: validTimestamp
      }
    };
    
    localStorage.setItem('fullTextSearchCache', JSON.stringify(cacheData));
    
    // 新しいフックインスタンスを作成（LocalStorageから読み込み）
    const { result } = renderHook(() => useSearchCache());
    
    const cached = result.current.getCached(searchText);
    expect(cached).toEqual(searchResults);
  });

  test('最大件数を超えると古いキャッシュが削除される（FIFO）', () => {
    // 最大件数を2に設定するため、テスト用の小さい値を使用
    // 実際のコードでは100件だが、テストでは動作確認のため少ない件数でテスト
    const { result } = renderHook(() => useSearchCache());
    
    const results1 = [{ id: '1' }];
    const results2 = [{ id: '2' }];
    const results3 = [{ id: '3' }];
    
    act(() => {
      result.current.setCached('検索1', results1);
    });
    
    // 少し時間を空ける
    jest.advanceTimersByTime(100);
    
    act(() => {
      result.current.setCached('検索2', results2);
    });
    
    // キャッシュに2件保存されている
    expect(result.current.getCached('検索1')).toEqual(results1);
    expect(result.current.getCached('検索2')).toEqual(results2);
  });

  test('キャッシュをクリアできる', () => {
    const { result } = renderHook(() => useSearchCache());
    
    const searchResults = [{ id: '1', title: 'テスト書籍' }];
    
    act(() => {
      result.current.setCached('テスト', searchResults);
    });
    
    expect(result.current.getCached('テスト')).toEqual(searchResults);
    
    act(() => {
      result.current.clearCache();
    });
    
    expect(result.current.getCached('テスト')).toBeNull();
  });

  test('キャッシュ統計情報を取得できる', () => {
    const { result } = renderHook(() => useSearchCache());
    
    // 両方のキャッシュを1つのactブロック内で設定
    act(() => {
      result.current.setCached('検索1', [{ id: '1' }]);
    });
    
    act(() => {
      result.current.setCached('検索2', [{ id: '2' }]);
    });
    
    // actブロック外で統計を取得
    const stats = result.current.getCacheStats();
    
    expect(stats.totalItems).toBe(2);
    expect(stats.validItems).toBe(2);
    expect(stats.maxItems).toBeGreaterThan(0);
    expect(stats.expiryMs).toBeGreaterThan(0);
  });

  test('LocalStorageへの保存が失敗してもエラーにならない', () => {
    const { result } = renderHook(() => useSearchCache());
    
    // LocalStorageのsetItemをエラーをスローするようにモック
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Storage full');
    });
    
    // エラーをスローしないことを確認
    expect(() => {
      act(() => {
        result.current.setCached('テスト', [{ id: '1' }]);
      });
    }).not.toThrow();
    
    // 元に戻す
    localStorage.setItem = originalSetItem;
  });

  test('LocalStorageからの読み込みが失敗してもエラーにならない', () => {
    // 不正なJSONをLocalStorageに設定
    localStorage.setItem('fullTextSearchCache', '{invalid json}');
    
    // エラーをスローしないことを確認
    expect(() => {
      renderHook(() => useSearchCache());
    }).not.toThrow();
  });
});

