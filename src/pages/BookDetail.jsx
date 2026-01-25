import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Divider, 
  Typography, 
  Fab, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Tabs, 
  Tab,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import BookInfo from '../components/BookInfo';
import BookEditDialog from '../components/BookEditDialog';
import BookTagEditor from '../components/BookTagEditor';
import StatusHistoryTimeline from '../components/StatusHistoryTimeline';
import LatestStatusHistory from '../components/LatestStatusHistory';
import LoadingIndicator from '../components/common/LoadingIndicator';
import DecorativeCorner from '../components/common/DecorativeCorner';
import { useBook } from '../hooks/useBook';
import { useBookStatusHistory } from '../hooks/useBookStatusHistory';
import { useBookStatusManager } from '../hooks/useBookStatusManager';
import { useNavigation } from '../hooks/useNavigation';

const BookDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { book, loading, error, updateBook, updateBookStatus, updateBookTags, deleteBook } = useBook(id);
  const { 
    history, 
    loading: historyLoading, 
    error: historyError, 
    addManualStatusHistory,
    latestHistory,
    getImportantDates, 
    getReadingDuration 
  } = useBookStatusHistory(id);
  
  // 新しいカスタムフックでステータス管理のビジネスロジックを分離
  const { handleAddManualHistory } = useBookStatusManager(
    book, 
    addManualStatusHistory, 
    updateBookStatus
  );
  
  // Phase 3対応: ナビゲーションフックを使用
  const { handleBack } = useNavigation();
  
  const [memoListKey, setMemoListKey] = useState(0); // MemoListの再レンダリング用
  const [memoAddDialogOpen, setMemoAddDialogOpen] = useState(false);
  const [bookEditDialogOpen, setBookEditDialogOpen] = useState(false);
  const [bookDeleteDialogOpen, setBookDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // タブ切り替え用

  // 書籍詳細ページのデバッグ情報を記録（削除: 開発用ログ）

  const handleStatusChange = (newStatus) => {
    updateBookStatus(newStatus);
  };

  const handleTagsChange = (newTags) => {
    updateBookTags(newTags);
  };


  const handleMemoAdded = () => {
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
    setMemoAddDialogOpen(false); // ダイアログを閉じる
  };

  const handleMemoUpdated = () => {
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
  };

  const handleFabClick = () => {
    setMemoAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setMemoAddDialogOpen(false);
  };

  const handleOpenBookEdit = () => {
    setBookEditDialogOpen(true);
  };

  const handleCloseBookEdit = () => {
    setBookEditDialogOpen(false);
  };

  const handleSaveBook = async (updatedFields) => {
    await updateBook(updatedFields);
  };

  const handleOpenBookDelete = () => {
    setBookDeleteDialogOpen(true);
  };

  const handleCloseBookDelete = () => {
    setBookDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBook();
      // 削除成功後、書籍一覧ページへリダイレクト
      navigate('/');
    } catch (error) {
      // エラーはdeleteBook内でsetGlobalErrorで通知済み
      console.error('書籍の削除に失敗しました:', error);
    } finally {
      setBookDeleteDialogOpen(false);
    }
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
    return (
      <LoadingIndicator
        variant="fullPage"
        message="読み込み中..."
        data-testid="book-detail-loading"
      />
    );
  }
  
  if (error) {
    console.error('📖 BookDetail error:', error);
    return <div data-testid="book-detail-error">エラーが発生しました: {error}</div>;
  }
  
  if (!book) {
    console.warn('📖 BookDetail: Book not found for ID:', id);
    return <div data-testid="book-detail-not-found">本が見つかりません。</div>;
  }

  const detailCardSx = {
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '2px solid rgba(139, 69, 19, 0.2)',
    borderRadius: 3,
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      border: '1px solid rgba(139, 69, 19, 0.1)',
      borderRadius: 2,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 1,
      height: '100%',
      background: 'linear-gradient(to bottom, transparent, rgba(139, 69, 19, 0.1), transparent)',
      pointerEvents: 'none',
      zIndex: 0,
    },
  };

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto', 
      mt: { xs: 2, sm: 4 }, 
      pb: '80px',
      px: { xs: 2, sm: 0 } // モバイルでは左右の余白を追加
    }} data-testid="book-detail">
      <Paper sx={detailCardSx}>
        <DecorativeCorner position="top-left" size={20} />
        <DecorativeCorner position="top-right" size={20} />
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3 } }}>
          <BookInfo 
            book={book} 
            bookId={id} 
            onStatusChange={handleStatusChange}
            onEdit={handleOpenBookEdit}
          />
          
          {/* 最新ステータス履歴表示 */}
          <LatestStatusHistory bookId={id} />
          
          <BookTagEditor book={book} bookId={id} onTagsChange={handleTagsChange} />
          
          {/* 編集・削除ボタン（横並び） */}
          <Box sx={{ textAlign: 'left', mt: 2, mb: 2 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleOpenBookEdit}
                data-testid="book-edit-button"
              >
                書籍情報を編集
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleOpenBookDelete}
                data-testid="book-delete-button"
              >
                書籍を削除
              </Button>
            </Stack>
          </Box>
          
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
        </Box>
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
      <BookEditDialog
        open={bookEditDialogOpen}
        book={book}
        onClose={handleCloseBookEdit}
        onSave={handleSaveBook}
      />
      
      {/* 削除確認ダイアログ */}
      <Dialog 
        open={bookDeleteDialogOpen} 
        onClose={handleCloseBookDelete} 
        data-testid="book-delete-dialog"
      >
        <DialogTitle data-testid="book-delete-confirm-title">本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>この書籍を削除すると、元に戻すことはできません。</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            メモが含まれている書籍は削除できません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookDelete} data-testid="book-delete-cancel-button">
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            data-testid="book-delete-confirm-button"
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookDetail; 