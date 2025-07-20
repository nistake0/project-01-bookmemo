import React from 'react';
import { Typography, Box, Chip, Button } from '@mui/material';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useContext } from 'react';
import { ErrorDialogContext } from './CommonErrorDialog';

const BookInfo = ({ book, bookId, onStatusChange }) => {
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [updating, setUpdating] = React.useState(false);

  if (!book) return null;

  const currentStatus = book.status || 'reading';

  const handleStatusChange = async () => {
    if (!book) return;
    setUpdating(true);
    const newStatus = book.status === 'reading' ? 'finished' : 'reading';
    const docRef = doc(db, 'books', bookId);
    try {
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      onStatusChange(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      setGlobalError("ステータスの更新に失敗しました。");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip 
          label={currentStatus === 'reading' ? '読書中' : '読了'} 
          color={currentStatus === 'reading' ? 'primary' : 'success'} 
        />
        <Button onClick={handleStatusChange} variant="outlined" disabled={updating}>
          {updating ? '更新中...' : (currentStatus === 'reading' ? '読了にする' : '読書中にする')}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'left', mb: 2 }}>
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={`${book.title}の表紙`} style={{ maxHeight: '250px', width: 'auto' }} />
        ) : (
          <Box sx={{
            border: '1px dashed grey',
            height: 250,
            width: 167,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto'
          }}>
            <Typography variant="body1" color="text.secondary">書影なし</Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ wordBreak: 'break-word' }}>
          {book.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {book.author}
        </Typography>
        {book.publisher && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            出版社: {book.publisher}
          </Typography>
        )}
        {book.publishedDate && (
          <Typography variant="body1" color="text.secondary">
            出版日: {book.publishedDate}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default BookInfo; 