import React, { useState, useContext } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  Stack, 
  Chip,
  Box 
} from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';

const MemoEditor = ({ open, memo, bookId, onClose, onUpdate, onDelete }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [dialogMode, setDialogMode] = useState('view'); // 'view' or 'edit'
  const [editingMemo, setEditingMemo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // メモが変更されたときに編集状態をリセット
  React.useEffect(() => {
    if (memo) {
      setEditingMemo(memo);
      setDialogMode('view');
      setShowDeleteConfirm(false);
    }
  }, [memo]);

  const handleClose = () => {
    setEditingMemo(null);
    setDialogMode('view');
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMemo || !editingMemo.text.trim()) return;

    const memoRef = doc(db, 'books', bookId, 'memos', editingMemo.id);
    try {
      await updateDoc(memoRef, {
        text: editingMemo.text,
        comment: editingMemo.comment,
        page: Number(editingMemo.page) || null,
        updatedAt: serverTimestamp(),
      });
      handleClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating memo: ", error);
      setGlobalError("メモの更新に失敗しました。");
    }
  };

  const handleDelete = async (memoId) => {
    try {
      await deleteDoc(doc(db, 'books', bookId, 'memos', memoId));
      handleClose();
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting memo: ", error);
      setGlobalError("メモの削除に失敗しました。");
    }
  };

  if (!memo) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle data-testid="memo-detail-title">メモ詳細</DialogTitle>
        <DialogContent>
          {dialogMode === 'view' ? (
            <>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{editingMemo?.text}</Typography>
              {editingMemo?.comment && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{editingMemo.comment}</Typography>}
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                {Array.isArray(editingMemo?.tags) && editingMemo.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" color="secondary" />
                ))}
              </Stack>
              {editingMemo?.page && <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>p. {editingMemo.page}</Typography>}
              {editingMemo?.createdAt && editingMemo.createdAt.toDate && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {editingMemo.createdAt.toDate().toLocaleString()}
                </Typography>
              )}
            </>
          ) : (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt: 1 }}>
              <TextField
                label="引用・抜き書き"
                fullWidth
                multiline
                rows={4}
                value={editingMemo?.text || ''}
                onChange={(e) => setEditingMemo({ ...editingMemo, text: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                label="感想・コメント"
                fullWidth
                multiline
                rows={2}
                value={editingMemo?.comment || ''}
                onChange={(e) => setEditingMemo({ ...editingMemo, comment: e.target.value })}
                margin="normal"
              />
              <TextField
                label="ページ番号"
                type="number"
                value={editingMemo?.page || ''}
                onChange={(e) => setEditingMemo({ ...editingMemo, page: e.target.value })}
                margin="normal"
                sx={{ mr: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {dialogMode === 'view' ? (
            <>
              <Button onClick={() => setDialogMode('edit')} data-testid="memo-edit-button">編集</Button>
              <Button onClick={() => setShowDeleteConfirm(true)} color="error" data-testid="memo-delete-button">削除</Button>
              <Button onClick={handleClose} data-testid="memo-close-button">閉じる</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setDialogMode('view')} data-testid="memo-cancel-button">キャンセル</Button>
              <Button onClick={handleUpdate} variant="contained" data-testid="memo-update-button">更新</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle data-testid="memo-delete-confirm-title">本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>このメモを削除すると、元に戻すことはできません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} data-testid="memo-delete-cancel-button">キャンセル</Button>
          <Button onClick={() => handleDelete(editingMemo?.id)} color="error" variant="contained" data-testid="memo-delete-confirm-button">削除</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemoEditor; 