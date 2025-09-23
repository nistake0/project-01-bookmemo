import { useState, useEffect, useCallback, useContext } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { 
  BOOK_STATUS, 
  getBookStatusLabel, 
  isValidBookStatus 
} from '../constants/bookStatus';
import { logger } from '../utils/logger';
import { extractImportantDates, getCurrentStatusFromHistory, calculateReadingDuration } from '../utils/statusHistoryUtils';

/**
 * 書籍ステータス変更履歴管理フック
 * @param {string} bookId - 書籍ID
 * @returns {Object} ステータス履歴の状態と操作関数
 */
export const useBookStatusHistory = (bookId) => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ステータス履歴を取得
  const fetchStatusHistory = useCallback(() => {
    if (!user || !bookId) {
      logger.status.debug('No user or bookId', { user: !!user, bookId });
      setLoading(false);
      return () => {};
    }

    try {
      logger.status.debug('Setting up listener for bookId', { bookId });
      setLoading(true);
      setError(null);
      
      const historyRef = collection(db, 'books', bookId, 'statusHistory');
      // orderByを一時的に削除して権限問題を回避
      const q = query(historyRef);
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          logger.status.debug('Snapshot received', { 
            size: snapshot.size, 
            empty: snapshot.empty,
            bookId 
          });
          const historyData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // クライアント側でソート（changedAtの降順）
          historyData.sort((a, b) => {
            const aTime = a.changedAt?.toDate ? a.changedAt.toDate() : new Date(a.changedAt || 0);
            const bTime = b.changedAt?.toDate ? b.changedAt.toDate() : new Date(b.changedAt || 0);
            return bTime - aTime;
          });
          
          setHistory(historyData);
          setLoading(false);
        },
        (error) => {
          logger.status.error('Error fetching status history', error);
          logger.status.error('Error details', { 
            code: error.code, 
            message: error.message, 
            bookId,
            userId: user.uid 
          });
          
          // 権限エラーの場合は空の履歴として扱う（既存データとの互換性）
          if (error.code === 'permission-denied') {
            logger.status.warn('Permission denied for statusHistory, treating as empty history');
            setHistory([]);
            setLoading(false);
            return;
          }
          
          setGlobalError('ステータス履歴の取得に失敗しました。');
          setError('ステータス履歴の取得に失敗しました。');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      logger.status.error('Error setting up status history listener', error);
      setGlobalError('ステータス履歴の取得に失敗しました。');
      setError('ステータス履歴の取得に失敗しました。');
      setLoading(false);
      return () => {};
    }
  }, [bookId, user, setGlobalError]);

  // ステータス変更履歴を追加
  const addStatusHistory = useCallback(async (newStatus, previousStatus, notes = null) => {
    if (!user || !bookId || !isValidBookStatus(newStatus)) {
      throw new Error('無効なパラメータです。');
    }

    try {
      const historyRef = collection(db, 'books', bookId, 'statusHistory');
      
      const historyData = {
        status: newStatus,
        previousStatus: previousStatus || null,
        changedAt: serverTimestamp(),
        changedBy: user.uid,
        notes: notes || null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(historyRef, historyData);
      return docRef.id;
    } catch (error) {
      logger.status.error('Error adding status history', error);
      setGlobalError('ステータス履歴の保存に失敗しました。');
      throw error;
    }
  }, [bookId, user, setGlobalError]);

  // 重要な日付を取得（utilsへ委譲）
  const getImportantDates = useCallback(() => {
    if (!history.length) return {};
    return extractImportantDates(history);
  }, [history]);

  // 現在のステータスを取得（utilsへ委譲）
  const getCurrentStatus = useCallback(() => {
    return getCurrentStatusFromHistory(history);
  }, [history]);

  // 読書期間を計算（utilsへ委譲）
  const getReadingDuration = useCallback(() => {
    return calculateReadingDuration(getImportantDates());
  }, [getImportantDates]);

  // 手動履歴追加機能
  const addManualStatusHistory = useCallback(async (date, status, previousStatus) => {
    if (!user || !bookId) {
      logger.status.debug('No user or bookId for manual history addition', { user: !!user, bookId });
      return;
    }

    if (!isValidBookStatus(status)) {
      throw new Error('Invalid status');
    }

    try {
      logger.status.info('Adding manual status history', { 
        bookId, 
        date, 
        status, 
        previousStatus, 
        userId: user.uid 
      });

      const historyRef = collection(db, 'books', bookId, 'statusHistory');
      const historyData = {
        status,
        previousStatus: previousStatus || '',
        changedAt: date,
        userId: user.uid
      };

      await addDoc(historyRef, historyData);
      logger.status.info('Manual status history added successfully');
    } catch (error) {
      logger.status.error('Error adding manual status history', error);
      setGlobalError('手動履歴の追加に失敗しました。');
      throw error;
    }
  }, [user, bookId, setGlobalError]);

  // 最新履歴取得
  const latestHistory = history.length > 0 ? history[0] : null;

  useEffect(() => {
    const unsubscribe = fetchStatusHistory();
    return unsubscribe;
  }, [bookId, user]); // fetchStatusHistoryの依存配列と一致させる

  return {
    history,
    loading,
    error,
    addStatusHistory,
    addManualStatusHistory,
    latestHistory,
    getImportantDates,
    getCurrentStatus,
    getReadingDuration,
    refetch: fetchStatusHistory
  };
};

export default useBookStatusHistory;
