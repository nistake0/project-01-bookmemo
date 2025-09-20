import React, { useState, useContext } from 'react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Menu, MenuItem, Chip, Box } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { ErrorDialogContext } from './CommonErrorDialog';
import { 
  BOOK_STATUS, 
  DEFAULT_BOOK_STATUS,
  ALL_BOOK_STATUSES,
  getBookStatusLabel,
  getBookStatusColor,
  getStatusChangeButtonText,
  isValidBookStatus
} from '../constants/bookStatus';
import { useBookStatusHistory } from '../hooks/useBookStatusHistory';

const BookStatusChanger = ({ book, bookId, onStatusChange }) => {
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const { addStatusHistory } = useBookStatusHistory(bookId);
  const [updating, setUpdating] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleStatusChange = async (newStatus) => {
    if (!book || !isValidBookStatus(newStatus)) return;
    
    setUpdating(true);
    setAnchorEl(null);
    
    const docRef = doc(db, 'books', bookId);
    const currentStatus = book.status || DEFAULT_BOOK_STATUS;
    
    try {
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // 読了時のみfinishedAtを設定
      if (newStatus === BOOK_STATUS.FINISHED) {
        updateData.finishedAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);
      
      // ステータス変更履歴を追加
      try {
        await addStatusHistory(newStatus, currentStatus);
      } catch (historyError) {
        console.error("Error adding status history:", historyError);
        // 履歴の追加に失敗してもメインの処理は続行
      }
      
      onStatusChange(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      setGlobalError("ステータスの更新に失敗しました。");
    } finally {
      setUpdating(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!book) return null;

  const currentStatus = book.status || DEFAULT_BOOK_STATUS;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip 
        label={getBookStatusLabel(currentStatus)}
        color={getBookStatusColor(currentStatus)}
        data-testid="book-status-chip"
      />
      
      <Button
        onClick={handleMenuOpen}
        variant="outlined"
        disabled={updating}
        endIcon={<KeyboardArrowDown />}
        data-testid="book-status-change-button"
      >
        {updating ? '更新中...' : 'ステータス変更'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        data-testid="book-status-menu"
      >
        {ALL_BOOK_STATUSES.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={status === currentStatus}
            data-testid={`status-menu-item-${status}`}
          >
            {getBookStatusLabel(status)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default BookStatusChanger;