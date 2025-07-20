import { renderHook, act } from '@testing-library/react';
import { useTagHistory } from './useTagHistory';

/**
 * useTagHistory フックのユニットテスト
 * 
 * テスト対象の機能:
 * - タグ履歴の取得（fetchTagHistory）
 * - タグ履歴の保存（saveTagToHistory）
 * - 複数タグの一括保存（saveTagsToHistory）
 * - 書籍用とメモ用の対応
 */

// Firebase モック
jest.mock('../firebase', () => ({
  db: {},
}));

// Firestore モック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

describe('useTagHistory', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockCollection = jest.fn();
  const mockQuery = jest.fn();
  const mockOrderBy = jest.fn();
  const mockGetDocs = jest.fn();
  const mockSetDoc = jest.fn();
  const mockDoc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Firestore モックの設定
    const { collection, query, orderBy, getDocs, setDoc, doc } = require('firebase/firestore');
    collection.mockImplementation(mockCollection);
    query.mockImplementation(mockQuery);
    orderBy.mockImplementation(mockOrderBy);
    getDocs.mockImplementation(mockGetDocs);
    setDoc.mockImplementation(mockSetDoc);
    doc.mockImplementation(mockDoc);
  });

  /**
   * テストケース: 書籍用タグ履歴の取得
   * 
   * 目的: 書籍用のタグ履歴が正しく取得されることを確認
   * 
   * テストステップ:
   * 1. useTagHistoryフックを書籍用で初期化
   * 2. fetchTagHistoryを実行
   * 3. 正しいコレクション名でクエリが実行されることを確認
   * 4. タグオプションが正しく設定されることを確認
   */
  it('fetches book tag history correctly', async () => {
    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ data: () => ({ tag: '小説' }) });
        callback({ data: () => ({ tag: '技術書' }) });
      }),
    };

    mockGetDocs.mockResolvedValue(mockQuerySnapshot);
    mockQuery.mockReturnValue({});
    mockOrderBy.mockReturnValue({});

    const { result } = renderHook(() => useTagHistory('book', mockUser));

    await act(async () => {
      await result.current.fetchTagHistory();
    });

    expect(mockCollection).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'bookTagHistory');
    expect(mockQuery).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    expect(result.current.tagOptions).toEqual(['小説', '技術書']);
  });

  /**
   * テストケース: メモ用タグ履歴の取得
   * 
   * 目的: メモ用のタグ履歴が正しく取得されることを確認
   * 
   * テストステップ:
   * 1. useTagHistoryフックをメモ用で初期化
   * 2. fetchTagHistoryを実行
   * 3. 正しいコレクション名でクエリが実行されることを確認
   */
  it('fetches memo tag history correctly', async () => {
    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ data: () => ({ tag: '重要' }) });
        callback({ data: () => ({ tag: '要確認' }) });
      }),
    };

    mockGetDocs.mockResolvedValue(mockQuerySnapshot);
    mockQuery.mockReturnValue({});
    mockOrderBy.mockReturnValue({});

    const { result } = renderHook(() => useTagHistory('memo', mockUser));

    await act(async () => {
      await result.current.fetchTagHistory();
    });

    expect(mockCollection).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'memoTagHistory');
    expect(result.current.tagOptions).toEqual(['重要', '要確認']);
  });

  /**
   * テストケース: タグ履歴の保存
   * 
   * 目的: タグ履歴が正しく保存されることを確認
   * 
   * テストステップ:
   * 1. useTagHistoryフックを初期化
   * 2. saveTagToHistoryを実行
   * 3. 正しいパラメータでsetDocが呼ばれることを確認
   */
  it('saves tag to history correctly', async () => {
    mockSetDoc.mockResolvedValue();
    mockDoc.mockReturnValue({});

    const { result } = renderHook(() => useTagHistory('book', mockUser));

    await act(async () => {
      await result.current.saveTagToHistory('新しいタグ');
    });

    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'bookTagHistory', '新しいタグ');
    expect(mockSetDoc).toHaveBeenCalledWith({}, {
      tag: '新しいタグ',
      updatedAt: 'mock-timestamp',
    });
  });

  /**
   * テストケース: 複数タグの一括保存
   * 
   * 目的: 複数のタグが正しく一括保存されることを確認
   * 
   * テストステップ:
   * 1. useTagHistoryフックを初期化
   * 2. saveTagsToHistoryを実行
   * 3. 各タグに対してsaveTagToHistoryが呼ばれることを確認
   */
  it('saves multiple tags to history correctly', async () => {
    mockSetDoc.mockResolvedValue();
    mockDoc.mockReturnValue({});

    const { result } = renderHook(() => useTagHistory('book', mockUser));

    await act(async () => {
      await result.current.saveTagsToHistory(['タグ1', 'タグ2', 'タグ3']);
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(3);
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'bookTagHistory', 'タグ1');
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'bookTagHistory', 'タグ2');
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'test-user-id', 'bookTagHistory', 'タグ3');
  });

  /**
   * テストケース: ユーザーが未認証の場合
   * 
   * 目的: ユーザーが未認証の場合に処理がスキップされることを確認
   * 
   * テストステップ:
   * 1. ユーザーがnullの状態でuseTagHistoryフックを初期化
   * 2. fetchTagHistoryとsaveTagToHistoryを実行
   * 3. Firestoreの関数が呼ばれないことを確認
   */
  it('skips operations when user is not authenticated', async () => {
    const { result } = renderHook(() => useTagHistory('book', null));

    await act(async () => {
      await result.current.fetchTagHistory();
      await result.current.saveTagToHistory('タグ');
    });

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  /**
   * テストケース: エラーハンドリング
   * 
   * 目的: エラーが発生した場合に適切に処理されることを確認
   * 
   * テストステップ:
   * 1. Firestoreの関数でエラーを発生させる
   * 2. fetchTagHistoryを実行
   * 3. エラーが適切にキャッチされることを確認
   */
  it('handles errors correctly', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useTagHistory('book', mockUser));

    await act(async () => {
      await expect(result.current.fetchTagHistory()).rejects.toThrow('Firestore error');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('タグ履歴の取得に失敗しました:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
}); 