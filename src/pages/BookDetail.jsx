import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Divider, Typography, Fab, Dialog } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import BookInfo from '../components/BookInfo';
import BookTagEditor from '../components/BookTagEditor';
import { useBook } from '../hooks/useBook';

const BookDetail = () => {
  const { id } = useParams();
  const { book, loading, error, updateBookStatus, updateBookTags } = useBook(id);
  const [memoListKey, setMemoListKey] = useState(0); // MemoListの再レンダリング用
  const [memoAddDialogOpen, setMemoAddDialogOpen] = useState(false);

  const handleStatusChange = (newStatus) => {
    updateBookStatus(newStatus);
  };

  const handleTagsChange = (newTags) => {
    updateBookTags(newTags);
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

  if (loading) return <div data-testid="book-detail-loading">Loading...</div>;
  if (error) return <div data-testid="book-detail-error">エラーが発生しました: {error}</div>;
  if (!book) return <div data-testid="book-detail-not-found">本が見つかりません。</div>;

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
        
        <BookTagEditor book={book} bookId={id} onTagsChange={handleTagsChange} />
        
        <Divider sx={{ my: { xs: 1, sm: 2 } }} />
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ mb: { xs: 1, sm: 2 } }}
          data-testid="memo-list-title"
        >
          メモ一覧
        </Typography>
        <MemoList key={memoListKey} bookId={book.id} onMemoUpdated={handleMemoUpdated} />
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