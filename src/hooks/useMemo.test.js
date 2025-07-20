import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemo } from './useMemo';
import { getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({ db: jest.fn() }));
jest.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'test-user-id' } }) }));

jest.mock('../components/CommonErrorDialog', () => ({
  ErrorDialogContext: {
    Provider: ({ children }) => children,
  },
}));

describe('useMemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const bookId = 'book-1';

  test('fetches memos successfully', async () => {
    const mockDocs = [
      { id: 'memo-1', data: () => ({ text: 'メモ1', createdAt: {}, updatedAt: {} }) },
      { id: 'memo-2', data: () => ({ text: 'メモ2', createdAt: {}, updatedAt: {} }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const { result } = renderHook(() => useMemo(bookId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.memos.length).toBe(2);
    expect(result.current.memos[0].text).toBe('メモ1');
    expect(result.current.memos[1].text).toBe('メモ2');
    expect(result.current.error).toBe(null);
  });

  test('handles fetch error', async () => {
    getDocs.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.memos).toEqual([]);
    expect(result.current.error).toBe('メモ一覧の取得に失敗しました。');
  });

  test('adds memo successfully', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    addDoc.mockResolvedValue({ id: 'memo-3' });
    const { result } = renderHook(() => useMemo(bookId));
    
    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // メモ追加
    let memoId;
    await act(async () => {
      memoId = await result.current.addMemo({ text: '新規メモ' });
    });
    
    expect(memoId).toBe('memo-3');
    expect(result.current.memos).toHaveLength(1);
    expect(result.current.memos[0]).toEqual({
      id: 'memo-3',
      text: '新規メモ'
    });
  });

  test('handles add memo error', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    addDoc.mockRejectedValue(new Error('Add failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.addMemo({ text: '失敗メモ' })).rejects.toThrow('Add failed');
  });

  test('updates memo successfully', async () => {
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 'memo-1', data: () => ({ text: '元のメモ', createdAt: {}, updatedAt: {} }) },
    ] });
    updateDoc.mockResolvedValue();
    const { result } = renderHook(() => useMemo(bookId));
    
    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // メモ更新
    let success;
    await act(async () => {
      success = await result.current.updateMemo('memo-1', { text: '更新後メモ' });
    });
    
    expect(success).toBe(true);
    expect(result.current.memos).toHaveLength(1);
    expect(result.current.memos[0]).toEqual({
      id: 'memo-1',
      text: '更新後メモ',
      createdAt: {},
      updatedAt: {}
    });
  });

  test('handles update memo error', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    updateDoc.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.updateMemo('memo-1', { text: '失敗' })).rejects.toThrow('Update failed');
  });

  test('deletes memo successfully', async () => {
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 'memo-1', data: () => ({ text: '削除対象メモ', createdAt: {}, updatedAt: {} }) },
    ] });
    deleteDoc.mockResolvedValue();
    const { result } = renderHook(() => useMemo(bookId));
    
    // 初期化完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // メモ削除
    let success;
    await act(async () => {
      success = await result.current.deleteMemo('memo-1');
    });
    
    expect(success).toBe(true);
    expect(result.current.memos).toHaveLength(0);
  });

  test('handles delete memo error', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    deleteDoc.mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.deleteMemo('memo-1')).rejects.toThrow('Delete failed');
  });
}); 