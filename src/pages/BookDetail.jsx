import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Divider, 
  Typography, 
  Fab, 
  Dialog, 
  Tabs, 
  Tab,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import BookInfo from '../components/BookInfo';
import BookTagEditor from '../components/BookTagEditor';
import StatusHistoryTimeline from '../components/StatusHistoryTimeline';
import LatestStatusHistory from '../components/LatestStatusHistory';
import { useBook } from '../hooks/useBook';
import { useBookStatusHistory } from '../hooks/useBookStatusHistory';
import { convertToDate } from '../utils/dateUtils';

const BookDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { book, loading, error, updateBookStatus, updateBookTags } = useBook(id);
  const { 
    history, 
    loading: historyLoading, 
    error: historyError, 
    addManualStatusHistory,
    latestHistory,
    getImportantDates, 
    getReadingDuration 
  } = useBookStatusHistory(id);
  const [memoListKey, setMemoListKey] = useState(0); // MemoListの再レンダリング用
  const [memoAddDialogOpen, setMemoAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // タブ切り替え用

  // 書籍詳細ページのデバッグ情報を記録
  useEffect(() => {
    console.log('📖 BookDetail mounted:', { id, pathname: location.pathname });
  }, [id, location.pathname]);

  const handleStatusChange = (newStatus) => {
    updateBookStatus(newStatus);
  };

  const handleTagsChange = (newTags) => {
    updateBookTags(newTags);
  };

  const handleAddManualHistory = async (date, status, previousStatus, existingHistory = []) => {
    try {
      // 手動履歴を追加
      await addManualStatusHistory(date, status, previousStatus);
      console.log('Manual history added successfully');



      // 追加した履歴が最新かどうかを判定
      const allHistories = [...existingHistory];
      const newHistoryEntry = {
        status,
        previousStatus,
        changedAt: date
      };
      
      // 新しい履歴を追加して日時順にソート
      allHistories.push(newHistoryEntry);
      allHistories.sort((a, b) => convertToDate(b.changedAt) - convertToDate(a.changedAt));

      // 最新の履歴が今回追加したものかどうかを判定
      const isLatestHistory = allHistories.length > 0 && 
        convertToDate(allHistories[0].changedAt).getTime() === convertToDate(date).getTime();
      
      if (!book) {
        return;
      }

      if (isLatestHistory && status !== book.status) {
        await updateBookStatus(status);
      }
    } catch (error) {
      console.error('Failed to add manual history:', error);
    }
  };

  const handleMemoAdded = () => {
    console.log('BookDetail - handleMemoAdded: MemoListを再レンダリング');
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
    setMemoAddDialogOpen(false); // ダイアログを閉じる
  };

  const handleMemoUpdated = () => {
    console.log('BookDetail - handleMemoUpdated: MemoListを再レンダリング');
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
  };

  const handleFabClick = () => {
    setMemoAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setMemoAddDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // タブの内容をレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ mb: { xs: 1, sm: 2 } }}
              data-testid="memo-list-title"
            >
              メモ一覧
            </Typography>
            <MemoList key={memoListKey} bookId={book.id} onMemoUpdated={handleMemoUpdated} />
          </>
        );
      case 1:
        return (
          <StatusHistoryTimeline
            history={history}
            loading={historyLoading}
            error={historyError}
            importantDates={getImportantDates()}
            readingDuration={getReadingDuration()}
            showAddButton={true}
            bookId={id}
            onAddHistory={handleAddManualHistory}
            currentBookStatus={book?.status}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div data-testid="book-detail-loading">Loading...</div>;
  }
  
  if (error) {
    console.error('📖 BookDetail error:', error);
    return <div data-testid="book-detail-error">エラーが発生しました: {error}</div>;
  }
  
  if (!book) {
    console.warn('📖 BookDetail: Book not found for ID:', id);
    return <div data-testid="book-detail-not-found">本が見つかりません。</div>;
  }

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto', 
      mt: { xs: 2, sm: 4 }, 
      pb: '80px',
      px: { xs: 2, sm: 0 } // モバイルでは左右の余白を追加
    }} data-testid="book-detail">
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <BookInfo book={book} bookId={id} onStatusChange={handleStatusChange} />
        
        {/* 最新ステータス履歴表示 */}
        <LatestStatusHistory bookId={id} />
        
        <BookTagEditor book={book} bookId={id} onTagsChange={handleTagsChange} />
        
        <Divider sx={{ my: { xs: 1, sm: 2 } }} />
        
        {/* タブ切り替え */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="book detail tabs"
            data-testid="book-detail-tabs"
          >
            <Tab 
              label="メモ一覧" 
              data-testid="memo-list-tab"
            />
            <Tab 
              label="ステータス履歴" 
              data-testid="status-history-tab"
            />
          </Tabs>
        </Box>
        
        {/* タブの内容 */}
        {renderTabContent()}
      </Paper>

      {/* FAB - メモ追加ボタン */}
      <Fab
        color="primary"
        aria-label="メモを追加"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, sm: 16 }, // モバイルではフッターメニューの上に配置
          right: { xs: 16, sm: 16 },
        }}
        onClick={handleFabClick}
        data-testid="memo-add-fab"
      >
        <AddIcon />
      </Fab>

      {/* メモ追加ダイアログ */}
      <Dialog
        open={memoAddDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        data-testid="memo-add-dialog"
      >
        <MemoAdd 
          bookId={book.id} 
          bookTags={book.tags || []} 
          onMemoAdded={handleMemoAdded}
          onClose={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
};

export default BookDetail; 