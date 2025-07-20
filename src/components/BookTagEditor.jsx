import React, { useState, useEffect, useContext, useCallback } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Typography, Box, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useTagHistory } from '../hooks/useTagHistory';

const BookTagEditor = ({ book, bookId, onTagsChange }) => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editTags, setEditTags] = useState([]);

  // 共通フックを使用してタグ履歴を管理
  const { tagOptions, fetchTagHistory, saveTagsToHistory } = useTagHistory('book', user);

  useEffect(() => {
    fetchTagHistory();
  }, [fetchTagHistory]);

  const handleEditTags = () => {
    setEditTags(book.tags || []);
    setEditTagsOpen(true);
  };

  const handleSaveTags = async () => {
    if (!book) return;
    try {
      const docRef = doc(db, 'books', bookId);
      await updateDoc(docRef, {
        tags: editTags,
        updatedAt: serverTimestamp(),
      });
      await saveTagsToHistory(editTags);
      onTagsChange(editTags);
      setEditTagsOpen(false);
    } catch (error) {
      console.error("Error updating tags:", error);
      setGlobalError("タグの更新に失敗しました。");
    }
  };

  if (!book) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h6">タグ:</Typography>
        <IconButton onClick={handleEditTags} size="small" data-testid="edit-tags-button">
          <EditIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(book.tags || []).map((tag, index) => (
          <Chip key={index} label={tag} size="small" />
        ))}
      </Box>

      <Dialog open={editTagsOpen} onClose={() => setEditTagsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>タグを編集</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            freeSolo
            options={tagOptions}
            value={editTags}
            onChange={(event, newValue) => setEditTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="タグ"
                placeholder="タグを入力または選択"
                fullWidth
                margin="normal"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option}
                  size="small"
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTagsOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveTags} variant="contained" data-testid="save-tags-button">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookTagEditor; 