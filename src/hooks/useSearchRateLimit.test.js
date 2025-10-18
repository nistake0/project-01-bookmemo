import { renderHook, act } from '@testing-library/react';
import { useSearchRateLimit } from './useSearchRateLimit';

// タイマーのモック
jest.useFakeTimers();

describe('useSearchRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  test('初回検索は常に許可される', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.allowed).toBe(true);
    expect(check.remainingMs).toBe(0);
    expect(check.error).toBeNull();
  });

  test('検索実行時刻を記録できる', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 記録後、すぐに再検索しようとすると制限される
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.allowed).toBe(false);
    expect(check.remainingMs).toBeGreaterThan(0);
    expect(check.error).toContain('秒後に再試行');
  });

  test('レート制限時間経過後は再検索可能', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 5秒（レート制限時間）経過
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.allowed).toBe(true);
    expect(check.remainingMs).toBe(0);
    expect(check.error).toBeNull();
  });

  test('異なるクエリは独立してレート制限される', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('検索1');
    });
    
    // 検索1は制限される
    const check1 = result.current.checkRateLimit('検索1');
    expect(check1.allowed).toBe(false);
    
    // 検索2は制限されない
    const check2 = result.current.checkRateLimit('検索2');
    expect(check2.allowed).toBe(true);
  });

  test('検索キーは正規化される（大文字小文字、空白）', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('  テスト  ');
    });
    
    // 異なる表記でも同じレート制限が適用される
    const check1 = result.current.checkRateLimit('テスト');
    expect(check1.allowed).toBe(false);
    
    const check2 = result.current.checkRateLimit('  テスト');
    expect(check2.allowed).toBe(false);
    
    const check3 = result.current.checkRateLimit('テスト  ');
    expect(check3.allowed).toBe(false);
  });

  test('残り待機時間を取得できる', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 2秒経過
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    const remainingTime = result.current.getRemainingTime('テスト検索');
    
    // 残り約3秒（5秒 - 2秒）
    expect(remainingTime).toBeGreaterThan(2000);
    expect(remainingTime).toBeLessThanOrEqual(3000);
  });

  test('レート制限をリセットできる（特定のクエリ）', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('検索1');
      result.current.recordSearch('検索2');
    });
    
    // 検索1をリセット
    act(() => {
      result.current.resetRateLimit('検索1');
    });
    
    // 検索1は制限解除
    const check1 = result.current.checkRateLimit('検索1');
    expect(check1.allowed).toBe(true);
    
    // 検索2は制限されたまま
    const check2 = result.current.checkRateLimit('検索2');
    expect(check2.allowed).toBe(false);
  });

  test('レート制限をリセットできる（全クエリ）', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('検索1');
      result.current.recordSearch('検索2');
    });
    
    // 全クエリをリセット
    act(() => {
      result.current.resetRateLimit();
    });
    
    // 両方とも制限解除
    const check1 = result.current.checkRateLimit('検索1');
    expect(check1.allowed).toBe(true);
    
    const check2 = result.current.checkRateLimit('検索2');
    expect(check2.allowed).toBe(true);
  });

  test('エラーメッセージに残り秒数が含まれる', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 1秒経過
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.error).toContain('4秒後に再試行');
  });

  test('レート制限時間ギリギリでは制限される', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 4.999秒経過（5秒未満）
    act(() => {
      jest.advanceTimersByTime(4999);
    });
    
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.allowed).toBe(false);
  });

  test('レート制限時間を超えると許可される', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    act(() => {
      result.current.recordSearch('テスト検索');
    });
    
    // 5秒経過
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    const check = result.current.checkRateLimit('テスト検索');
    
    expect(check.allowed).toBe(true);
  });

  test('初回検索の残り時間は0', () => {
    const { result } = renderHook(() => useSearchRateLimit());
    
    const remainingTime = result.current.getRemainingTime('テスト検索');
    
    expect(remainingTime).toBe(0);
  });
});

