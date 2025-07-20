import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Divider, Typography } from '@mui/material';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import BookInfo from '../components/BookInfo';
import BookTagEditor from '../components/BookTagEditor';
import { useBook } from '../hooks/useBook';

const BookDetail = () => {
  const { id } = useParams();
  const { book, loading, error, updateBookStatus, updateBookTags } = useBook(id);
  const [memoListKey, setMemoListKey] = useState(0); // MemoListの再レンダリング用

  const handleStatusChange = (newStatus) => {
    updateBookStatus(newStatus);
  };

  const handleTagsChange = (newTags) => {
    updateBookTags(newTags);
  };

  const handleMemoAdded = () => {
    console.log('BookDetail - handleMemoAdded: MemoListを再レンダリング');
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
  };

  const handleMemoUpdated = () => {
    console.log('BookDetail - handleMemoUpdated: MemoListを再レンダリング');
    setMemoListKey(prev => prev + 1); // MemoListを強制的に再レンダリング
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>エラーが発生しました: {error}</div>;
  if (!book) return <div>本が見つかりません。</div>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, pb: '80px' }}>
      <Paper sx={{ p: 3 }}>
        <BookInfo book={book} bookId={id} onStatusChange={handleStatusChange} />
        
        <BookTagEditor book={book} bookId={id} onTagsChange={handleTagsChange} />
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモ一覧</Typography>
        <MemoList key={memoListKey} bookId={book.id} onMemoUpdated={handleMemoUpdated} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモを追加</Typography>
        <MemoAdd bookId={book.id} bookTags={book.tags || []} onMemoAdded={handleMemoAdded} />
      </Paper>
    </Box>
  );
};

export default BookDetail; 