import React, { useState, useContext } from 'react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';

const BookStatusChanger = ({ book, bookId, onStatusChange }) => {
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [updating, setUpdating] = useState(false);

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

  if (!book) return null;

  const currentStatus = book.status || 'reading';

  return (
    <Button onClick={handleStatusChange} variant="outlined" disabled={updating}>
      {updating ? '更新中...' : (currentStatus === 'reading' ? '読了にする' : '読書中にする')}
    </Button>
  );
};

export default BookStatusChanger; 