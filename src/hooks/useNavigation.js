import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * 全画面共通のナビゲーション機能を提供するフック
 * 
 * 機能:
 * - 戻る・進むナビゲーション
 * - location stateの復元
 * - 検索状態の保持
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    const { returnPath, searchState } = location.state || {};
    
    if (returnPath && searchState) {
      // location.stateがあれば検索状態を復元して戻る
      navigate(returnPath, { state: { restoreSearch: searchState } });
    } else {
      // location.stateがない場合は通常の戻る（sessionStorageからの復元はuseSearchが自動で行う）
      navigate(-1);
    }
  }, [navigate, location.state]);

  const handleForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  // 状態復元のヘルパー
  const restoreSearchState = useCallback((searchState) => {
    // 検索状態を復元する処理
    // 実装は各画面で実装
    console.log('Restoring search state:', searchState);
  }, []);

  return {
    handleBack,
    handleForward,
    restoreSearchState,
    location
  };
};
