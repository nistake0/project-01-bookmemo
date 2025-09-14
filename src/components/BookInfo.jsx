import React from 'react';
import { Typography, Box } from '@mui/material';
import BookStatusChanger from './BookStatusChanger';

const BookInfo = ({ book, bookId, onStatusChange }) => {
  if (!book) return null;

  return (
    <Box data-testid="book-info">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <BookStatusChanger 
          book={book} 
          bookId={bookId} 
          onStatusChange={onStatusChange}
        />
      </Box>

      <Box sx={{ textAlign: 'left', mb: 2 }} data-testid="book-cover-section">
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={`${book.title}の表紙`} style={{ maxHeight: '250px', width: 'auto' }} data-testid="book-cover-image" />
        ) : (
          <Box sx={{
            border: '1px dashed grey',
            height: 250,
            width: 167,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto'
          }} data-testid="book-cover-placeholder">
            <Typography variant="body1" color="text.secondary">書影なし</Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mb: 2 }} data-testid="book-details">
        <Typography variant="h4" gutterBottom sx={{ wordBreak: 'break-word' }} data-testid="book-title">
          {book.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom data-testid="book-author">
          {book.author}
        </Typography>
        {book.publisher && (
          <Typography variant="body1" color="text.secondary" gutterBottom data-testid="book-publisher">
            出版社: {book.publisher}
          </Typography>
        )}
        {book.publishedDate && (
          <Typography variant="body1" color="text.secondary" data-testid="book-published-date">
            出版日: {book.publishedDate}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default BookInfo;