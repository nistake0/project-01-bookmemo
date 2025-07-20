import React from 'react';
import { Typography, Box, Chip } from '@mui/material';

const BookInfo = ({ book }) => {
  if (!book) return null;

  const currentStatus = book.status || 'reading';

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Chip 
          label={currentStatus === 'reading' ? '読書中' : '読了'} 
          color={currentStatus === 'reading' ? 'primary' : 'success'} 
        />
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
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
      
      <Typography variant="h4" gutterBottom>
        {book.title}
      </Typography>
      <Typography variant="h6" color="text.secondary">
        {book.author}
      </Typography>
      {book.publisher && (
        <Typography variant="body1" color="text.secondary">
          出版社: {book.publisher}
        </Typography>
      )}
      {book.publishedDate && (
        <Typography variant="body1" color="text.secondary">
          出版日: {book.publishedDate}
        </Typography>
      )}
    </>
  );
};

export default BookInfo; 