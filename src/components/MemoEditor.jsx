import React, { useState, useContext } from 'react';
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
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useMemo } from '../hooks/useMemo';

const MemoEditor = ({ open, memo, bookId, onClose, onUpdate, onDelete, editMode = false }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { updateMemo, deleteMemo } = useMemo(bookId);
  const [dialogMode, setDialogMode] = useState(editMode ? 'edit' : 'view'); // 'view' or 'edit'
  const [editingMemo, setEditingMemo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inputTagValue, setInputTagValue] = useState("");

  // メモやeditModeが変更されたときに編集状態をリセット
  React.useEffect(() => {
    if (memo) {
      setEditingMemo(memo);
      setDialogMode(editMode ? 'edit' : 'view');
      setShowDeleteConfirm(false);
      setInputTagValue("");
    }
  }, [memo, editMode]);

  const handleClose = () => {
    setEditingMemo(null);
    setDialogMode('view');
    setShowDeleteConfirm(false);
    setInputTagValue("");
    onClose();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMemo || !editingMemo.text.trim()) return;

    // 未確定のタグ入力があればtagsに追加
    let tagsToSave = editingMemo.tags || [];
    if (inputTagValue && !tagsToSave.includes(inputTagValue)) {
      tagsToSave = [...tagsToSave, inputTagValue];
    }

    try {
      await updateMemo(editingMemo.id, {
        text: editingMemo.text,
        comment: editingMemo.comment,
        page: Number(editingMemo.page) || null,
        tags: tagsToSave,
      });
      handleClose();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating memo: ", error);
      setGlobalError("メモの更新に失敗しました。");
    }
  };

  const handleDelete = async (memoId) => {
    try {
      await deleteMemo(memoId);
      handleClose();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting memo: ", error);
      setGlobalError("メモの削除に失敗しました。");
    }
  };

  if (!memo) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid="memo-detail-dialog">
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
                inputProps={{ 'data-testid': 'memo-text-input' }}
              />
              <TextField
                label="感想・コメント"
                fullWidth
                multiline
                rows={2}
                value={editingMemo?.comment || ''}
                onChange={(e) => setEditingMemo({ ...editingMemo, comment: e.target.value })}
                margin="normal"
                inputProps={{ 'data-testid': 'memo-comment-input' }}
              />
              <TextField
                label="ページ番号"
                type="number"
                value={editingMemo?.page || ''}
                onChange={(e) => setEditingMemo({ ...editingMemo, page: e.target.value })}
                margin="normal"
                sx={{ mr: 2 }}
                inputProps={{ 'data-testid': 'memo-page-input' }}
              />
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={editingMemo?.tags || []}
                getOptionLabel={option => typeof option === 'string' ? option : (option.inputValue || option.tag || '')}
                onChange={(event, newValue) => {
                  const normalized = (newValue || []).map(v => {
                    if (typeof v === 'string') return v;
                    if (v && typeof v === 'object') {
                      if ('inputValue' in v && v.inputValue) return v.inputValue;
                      if ('tag' in v && v.tag) return v.tag;
                    }
                    return '';
                  }).filter(Boolean);
                  setEditingMemo({ ...editingMemo, tags: normalized });
                }}
                inputValue={inputTagValue}
                onInputChange={(event, newInputValue) => setInputTagValue(newInputValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="タグ" 
                    margin="normal" 
                    fullWidth 
                    placeholder="例: 名言,感想,引用" 
                    inputProps={{ 
                      ...params.inputProps,
                      'data-testid': 'memo-tags-input' 
                    }} 
                  />
                )}
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

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} data-testid="memo-delete-dialog">
        <DialogTitle data-testid="memo-delete-confirm-title">本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>このメモを削除すると、元に戻すことはできません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} data-testid="memo-delete-cancel-button">キャンセル</Button>
          <Button onClick={() => {
            handleDelete(editingMemo?.id);
          }} color="error" variant="contained" data-testid="memo-delete-confirm-button">削除</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemoEditor; 