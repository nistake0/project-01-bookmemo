import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MemoEditor from '../components/MemoEditor';

/**
 * 検索結果のクリックハンドラーとメモダイアログ管理を提供するフック
 * 
 * SearchResultsコンポーネントで使用する標準的なクリックハンドラーと
 * メモ詳細ダイアログの状態管理を簡単に実装できるようにします。
 * 
 * @param {Array} results - 検索結果配列（メモの詳細取得に使用）
 * @returns {Object} ハンドラーと状態
 *   - handleResultClick: 結果クリック時のハンドラー関数
 *   - memoDialogOpen: メモダイアログの開閉状態
 *   - selectedMemo: 選択されたメモオブジェクト
 *   - selectedMemoBookId: 選択されたメモの書籍ID
 *   - closeMemoDialog: ダイアログを閉じる関数
 *   - MemoDialog: メモダイアログコンポーネント（JSX関数）
 * 
 * @example
 * // 基本的な使用方法
 * function MySearchPage() {
 *   const { results, loading } = useSearch();
 *   const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
 *   
 *   return (
 *     <>
 *       <SearchResults 
 *         results={results} 
 *         loading={loading}
 *         onResultClick={handleResultClick}
 *       />
 *       <MemoDialog />
 *     </>
 *   );
 * }
 */
export function useSearchResultHandler(results) {
  const navigate = useNavigate();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedMemoBookId, setSelectedMemoBookId] = useState(null);
  
  /**
   * 検索結果クリック時のハンドラー
   * - 書籍の場合: 書籍詳細ページに遷移
   * - メモの場合: メモ詳細ダイアログを表示
   */
  const handleResultClick = useCallback((type, bookId, memoId) => {
    if (type === 'book') {
      // 書籍クリック: 詳細ページに遷移
      navigate(`/book/${bookId}`);
    } else if (type === 'memo') {
      // メモクリック: ダイアログを表示
      const memo = results.find(r => r.type === 'memo' && r.id === memoId);
      if (memo) {
        setSelectedMemo(memo);
        setSelectedMemoBookId(bookId);
        setMemoDialogOpen(true);
      } else {
        // フォールバック: メモが見つからない場合は書籍詳細へ遷移
        console.warn('[useSearchResultHandler] Memo not found in results, navigating to book page');
        navigate(`/book/${bookId}?memo=${memoId}`);
      }
    }
  }, [navigate, results]);
  
  /**
   * メモダイアログを閉じる
   */
  const closeMemoDialog = useCallback(() => {
    setMemoDialogOpen(false);
    setSelectedMemo(null);
    setSelectedMemoBookId(null);
  }, []);
  
  /**
   * メモダイアログコンポーネント
   * このコンポーネントをJSXで使用してください
   */
  const MemoDialog = useCallback(() => (
    <MemoEditor 
      open={memoDialogOpen}
      memo={selectedMemo}
      bookId={selectedMemoBookId}
      onClose={closeMemoDialog}
      onUpdate={closeMemoDialog}
      onDelete={closeMemoDialog}
    />
  ), [memoDialogOpen, selectedMemo, selectedMemoBookId, closeMemoDialog]);
  
  return {
    handleResultClick,
    memoDialogOpen,
    selectedMemo,
    selectedMemoBookId,
    closeMemoDialog,
    MemoDialog
  };
}

export default useSearchResultHandler;

