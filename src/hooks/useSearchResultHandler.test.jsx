import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useSearchResultHandler from './useSearchResultHandler';

// react-router-domのモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// MemoEditorのモック
jest.mock('../components/MemoEditor', () => {
  return function MockMemoEditor({ open }) {
    return open ? <div data-testid="memo-editor-dialog">Mock Memo Editor</div> : null;
  };
});

describe('useSearchResultHandler', () => {
  const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;
  
  beforeEach(() => {
    mockNavigate.mockClear();
  });
  
  describe('handleResultClick - 書籍', () => {
    it('書籍クリック時にnavigateを呼ぶ', () => {
      const mockResults = [];
      const { result } = renderHook(() => useSearchResultHandler(mockResults), { wrapper });
      
      act(() => {
        result.current.handleResultClick('book', 'book123');
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/book/book123');
    });
  });
  
  describe('handleResultClick - メモ', () => {
    it('メモクリック時にダイアログを開く（メモが結果に含まれる場合）', () => {
      const mockResults = [
        {
          id: 'memo1',
          type: 'memo',
          bookId: 'book1',
          text: 'テストメモ'
        }
      ];
      
      const { result } = renderHook(() => useSearchResultHandler(mockResults), { wrapper });
      
      // 初期状態: ダイアログは閉じている
      expect(result.current.memoDialogOpen).toBe(false);
      expect(result.current.selectedMemo).toBe(null);
      
      // メモをクリック
      act(() => {
        result.current.handleResultClick('memo', 'book1', 'memo1');
      });
      
      // ダイアログが開く
      expect(result.current.memoDialogOpen).toBe(true);
      expect(result.current.selectedMemo).toEqual(mockResults[0]);
      expect(result.current.selectedMemoBookId).toBe('book1');
      
      // navigateは呼ばれない
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    
    it('メモクリック時にnavigateにフォールバック（メモが結果に含まれない場合）', () => {
      const mockResults = [];  // メモが含まれていない
      const { result } = renderHook(() => useSearchResultHandler(mockResults), { wrapper });
      
      // メモをクリック（存在しないメモ）
      act(() => {
        result.current.handleResultClick('memo', 'book1', 'memo1');
      });
      
      // ダイアログは開かない
      expect(result.current.memoDialogOpen).toBe(false);
      expect(result.current.selectedMemo).toBe(null);
      
      // フォールバック: navigateが呼ばれる
      expect(mockNavigate).toHaveBeenCalledWith('/book/book1?memo=memo1');
    });
  });
  
  describe('closeMemoDialog', () => {
    it('ダイアログを閉じる', () => {
      const mockResults = [
        {
          id: 'memo1',
          type: 'memo',
          bookId: 'book1',
          text: 'テストメモ'
        }
      ];
      
      const { result } = renderHook(() => useSearchResultHandler(mockResults), { wrapper });
      
      // メモをクリックしてダイアログを開く
      act(() => {
        result.current.handleResultClick('memo', 'book1', 'memo1');
      });
      expect(result.current.memoDialogOpen).toBe(true);
      
      // ダイアログを閉じる
      act(() => {
        result.current.closeMemoDialog();
      });
      
      expect(result.current.memoDialogOpen).toBe(false);
      expect(result.current.selectedMemo).toBe(null);
      expect(result.current.selectedMemoBookId).toBe(null);
    });
  });
  
  describe('MemoDialog', () => {
    it('MemoDialogコンポーネントが提供される', () => {
      const mockResults = [];
      const { result } = renderHook(() => useSearchResultHandler(mockResults), { wrapper });
      
      expect(result.current.MemoDialog).toBeDefined();
      expect(typeof result.current.MemoDialog).toBe('function');
    });
  });
  
  describe('resultsの変更に追従', () => {
    it('resultsが変更されると、handleResultClickが新しい結果を使う', () => {
      const initialResults = [];
      const { result, rerender } = renderHook(
        ({ results }) => useSearchResultHandler(results),
        { 
          wrapper,
          initialProps: { results: initialResults }
        }
      );
      
      // 初期状態: メモが見つからない
      act(() => {
        result.current.handleResultClick('memo', 'book1', 'memo1');
      });
      expect(mockNavigate).toHaveBeenCalledWith('/book/book1?memo=memo1');
      mockNavigate.mockClear();
      
      // resultsを更新
      const newResults = [
        {
          id: 'memo1',
          type: 'memo',
          bookId: 'book1',
          text: '新しいメモ'
        }
      ];
      rerender({ results: newResults });
      
      // 更新後: メモが見つかる
      act(() => {
        result.current.handleResultClick('memo', 'book1', 'memo1');
      });
      expect(result.current.memoDialogOpen).toBe(true);
      expect(result.current.selectedMemo.text).toBe('新しいメモ');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

