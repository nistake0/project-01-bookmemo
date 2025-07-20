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
    console.log('=== useMemo test: fetches memos successfully START ===');
    const mockDocs = [
      { id: 'memo-1', data: () => ({ text: 'メモ1', createdAt: {}, updatedAt: {} }) },
      { id: 'memo-2', data: () => ({ text: 'メモ2', createdAt: {}, updatedAt: {} }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    console.log('=== useMemo test: renderHook START ===');
    const { result } = renderHook(() => useMemo(bookId));
    console.log('=== useMemo test: renderHook END ===');

    console.log('=== useMemo test: waitFor START ===');
    await waitFor(() => {
      console.log('=== useMemo test: waitFor callback START ===');
      expect(result.current.loading).toBe(false);
      console.log('=== useMemo test: waitFor callback END ===');
    });
    console.log('=== useMemo test: waitFor END ===');

    console.log('=== useMemo test: 最終確認 START ===');
    expect(result.current.memos.length).toBe(2);
    expect(result.current.memos[0].text).toBe('メモ1');
    expect(result.current.memos[1].text).toBe('メモ2');
    expect(result.current.error).toBe(null);
    console.log('=== useMemo test: 最終確認 END ===');
    console.log('=== useMemo test: fetches memos successfully END ===');
  });

  test('handles fetch error', async () => {
    console.log('=== useMemo test: handles fetch error START ===');
    getDocs.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.memos).toEqual([]);
    expect(result.current.error).toBe('メモ一覧の取得に失敗しました。');
    console.log('=== useMemo test: handles fetch error END ===');
  });

  test('adds memo successfully', async () => {
    console.log('=== useMemo test: adds memo successfully START ===');
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
    console.log('=== useMemo test: adds memo successfully END ===');
  });

  test('handles add memo error', async () => {
    console.log('=== useMemo test: handles add memo error START ===');
    getDocs.mockResolvedValueOnce({ docs: [] });
    addDoc.mockRejectedValue(new Error('Add failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.addMemo({ text: '失敗メモ' })).rejects.toThrow('Add failed');
    console.log('=== useMemo test: handles add memo error END ===');
  });

  test('updates memo successfully', async () => {
    console.log('=== useMemo test: updates memo successfully START ===');
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
    console.log('=== useMemo test: updates memo successfully END ===');
  });

  test('handles update memo error', async () => {
    console.log('=== useMemo test: handles update memo error START ===');
    getDocs.mockResolvedValueOnce({ docs: [] });
    updateDoc.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.updateMemo('memo-1', { text: '失敗' })).rejects.toThrow('Update failed');
    console.log('=== useMemo test: handles update memo error END ===');
  });

  test('deletes memo successfully', async () => {
    console.log('=== useMemo test: deletes memo successfully START ===');
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
    console.log('=== useMemo test: deletes memo successfully END ===');
  });

  test('handles delete memo error', async () => {
    console.log('=== useMemo test: handles delete memo error START ===');
    getDocs.mockResolvedValueOnce({ docs: [] });
    deleteDoc.mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useMemo(bookId));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await expect(result.current.deleteMemo('memo-1')).rejects.toThrow('Delete failed');
    console.log('=== useMemo test: handles delete memo error END ===');
  });

  // 今回の修正に関連するテストケース
  describe('修正関連のテスト', () => {
    test('addMemo should not cause infinite loop - 無限ループ防止テスト', async () => {
      console.log('=== useMemo test: addMemo should not cause infinite loop START ===');
      getDocs.mockResolvedValueOnce({ docs: [] });
      addDoc.mockResolvedValue({ id: 'memo-1' });
      
      const { result } = renderHook(() => useMemo(bookId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // 複数回メモを追加しても無限ループが発生しないことを確認
      await act(async () => {
        await result.current.addMemo({ text: 'メモ1' });
      });
      
      await act(async () => {
        await result.current.addMemo({ text: 'メモ2' });
      });
      
      await act(async () => {
        await result.current.addMemo({ text: 'メモ3' });
      });
      
      // 3つのメモが正常に追加されていることを確認
      expect(result.current.memos).toHaveLength(3);
      expect(result.current.memos[0].text).toBe('メモ3'); // 最新のメモが最初
      expect(result.current.memos[1].text).toBe('メモ2');
      expect(result.current.memos[2].text).toBe('メモ1');
      console.log('=== useMemo test: addMemo should not cause infinite loop END ===');
    });

    test('updateMemo should not cause infinite loop - 更新時の無限ループ防止テスト', async () => {
      console.log('=== useMemo test: updateMemo should not cause infinite loop START ===');
      getDocs.mockResolvedValueOnce({ docs: [
        { id: 'memo-1', data: () => ({ text: '元のメモ', createdAt: {}, updatedAt: {} }) },
      ] });
      updateDoc.mockResolvedValue();
      
      const { result } = renderHook(() => useMemo(bookId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // 複数回メモを更新しても無限ループが発生しないことを確認
      await act(async () => {
        await result.current.updateMemo('memo-1', { text: '更新1' });
      });
      
      await act(async () => {
        await result.current.updateMemo('memo-1', { text: '更新2' });
      });
      
      await act(async () => {
        await result.current.updateMemo('memo-1', { text: '更新3' });
      });
      
      // 最後の更新が反映されていることを確認
      expect(result.current.memos).toHaveLength(1);
      expect(result.current.memos[0].text).toBe('更新3');
      console.log('=== useMemo test: updateMemo should not cause infinite loop END ===');
    });

    test('addMemo should update state immediately - 即座の状態更新テスト', async () => {
      console.log('=== useMemo test: addMemo should update state immediately START ===');
      getDocs.mockResolvedValueOnce({ docs: [] });
      addDoc.mockResolvedValue({ id: 'memo-1' });
      
      const { result } = renderHook(() => useMemo(bookId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // メモ追加前の状態を記録
      const beforeAdd = result.current.memos.length;
      
      // メモを追加
      await act(async () => {
        await result.current.addMemo({ text: '即座更新テスト' });
      });
      
      // 即座に状態が更新されていることを確認
      expect(result.current.memos.length).toBe(beforeAdd + 1);
      expect(result.current.memos[0].text).toBe('即座更新テスト');
      expect(result.current.memos[0].id).toBe('memo-1');
      console.log('=== useMemo test: addMemo should update state immediately END ===');
    });

    test('updateMemo should update state immediately - 更新時の即座の状態更新テスト', async () => {
      console.log('=== useMemo test: updateMemo should update state immediately START ===');
      getDocs.mockResolvedValueOnce({ docs: [
        { id: 'memo-1', data: () => ({ text: '元のテキスト', createdAt: {}, updatedAt: {} }) },
      ] });
      updateDoc.mockResolvedValue();
      
      const { result } = renderHook(() => useMemo(bookId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // メモ更新前の状態を記録
      const beforeUpdate = result.current.memos[0].text;
      
      // メモを更新
      await act(async () => {
        await result.current.updateMemo('memo-1', { text: '即座更新テスト' });
      });
      
      // 即座に状態が更新されていることを確認
      expect(result.current.memos[0].text).not.toBe(beforeUpdate);
      expect(result.current.memos[0].text).toBe('即座更新テスト');
      console.log('=== useMemo test: updateMemo should update state immediately END ===');
    });
  });
}); 