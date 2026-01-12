import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import BookStatusChanger from './BookStatusChanger';
import { getAcquisitionTypeLabel, ACQUISITION_TYPE } from '../constants/bookStatus';
import { useTextCopyMenu } from '../hooks/useTextCopyMenu';

const BookInfo = ({ book, bookId, onStatusChange, onEdit }) => {
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const { handleClick, handleContextMenu, menuProps, handleCopy, handleExternalSearch } = useTextCopyMenu({
    showSnackbar,
  });
  
  if (!book) return null;

  return (
    <>
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
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            wordBreak: 'break-word',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={(e) => handleClick(e, book.title, book)}
          onContextMenu={(e) => handleContextMenu(e, book.title, book)}
          data-testid="book-title"
        >
          {book.title}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          gutterBottom
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={(e) => handleClick(e, book.author, book)}
          onContextMenu={(e) => handleContextMenu(e, book.author, book)}
          data-testid="book-author"
        >
          {book.author}
        </Typography>
        {book.publisher && (
          <Typography
            variant="body1"
            color="text.secondary"
            gutterBottom
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': { opacity: 0.8 },
            }}
            onClick={(e) => handleClick(e, book.publisher, book)}
            onContextMenu={(e) => handleContextMenu(e, book.publisher, book)}
            data-testid="book-publisher"
          >
            出版社: {book.publisher}
          </Typography>
        )}
        {book.publishedDate && (
          <Typography variant="body1" color="text.secondary" gutterBottom data-testid="book-published-date">
            出版日: {book.publishedDate}
          </Typography>
        )}
        {book.isbn && (
          <Typography variant="body1" color="text.secondary" gutterBottom data-testid="book-isbn">
            ISBN: {book.isbn}
          </Typography>
        )}
        {book.acquisitionType && book.acquisitionType !== ACQUISITION_TYPE.UNKNOWN && (
          <Box sx={{ mb: 1 }}>
            <Chip 
              label={`取得方法: ${getAcquisitionTypeLabel(book.acquisitionType)}`}
              color="primary"
              variant="outlined"
              size="small"
              data-testid="book-acquisition-type"
            />
          </Box>
        )}
      </Box>
      </Box>
      
      {/* コンテキストメニュー */}
      <Menu {...menuProps} data-testid="text-copy-menu">
        <MenuItem onClick={handleCopy} data-testid="text-copy-menu-copy">
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>コピー</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExternalSearch('google')} data-testid="text-copy-menu-google">
          <ListItemIcon>
            <SearchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Google検索</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExternalSearch('amazon')} data-testid="text-copy-menu-amazon">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Amazon検索</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Snackbar（フィードバック用） */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        data-testid="text-copy-snackbar"
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          data-testid="text-copy-alert"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BookInfo;