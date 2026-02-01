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
  Box,
  Paper,
  Rating,
  FormControl,
  FormLabel,
  useTheme
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useMemo } from '../hooks/useMemo';
import { 
  getMemoRatingValue,
  getMemoRatingDescription,
  DEFAULT_MEMO_RATING
} from '../constants/memoRating';
import MemoMoveDialog from './MemoMoveDialog';
import LinkifiedText from './LinkifiedText';
import { getMemoCardSx } from '../theme/cardStyles';

// CI環境でも安定する固定フォーマットで日時を表示（yyyy/M/d H:mm:ss）
const formatDateTime = (createdAt) => {
  try {
    const date = createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : null);
    if (!date) return '';
    const yyyy = date.getFullYear();
    const m = date.getMonth() + 1; // 月は0始まりのため+1
    const d = date.getDate();
    const h = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}/${m}/${d} ${h}:${mm}:${ss}`;
  } catch (e) {
    return '';
  }
};

const MemoEditor = ({
  open,
  memo,
  bookId,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  editMode = false
}) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { updateMemo, deleteMemo, moveMemo } = useMemo(bookId);
  const [dialogMode, setDialogMode] = useState(editMode ? 'edit' : 'view'); // 'view' or 'edit'
  const [editingMemo, setEditingMemo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inputTagValue, setInputTagValue] = useState("");
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // メモやeditModeが変更されたときに編集状態をリセット
  React.useEffect(() => {
    if (memo) {
      setEditingMemo({
        ...memo,
        rating: getMemoRatingValue(memo)
      });
      setDialogMode(editMode ? 'edit' : 'view');
      setShowDeleteConfirm(false);
      setInputTagValue("");
      setShowMoveDialog(false);
    }
  }, [memo, editMode]);

  const handleClose = () => {
    setEditingMemo(null);
    setDialogMode('view');
    setShowDeleteConfirm(false);
    setInputTagValue("");
    setShowMoveDialog(false);
    if (typeof onClose === 'function') {
      onClose();
    }
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
        rating: editingMemo.rating || DEFAULT_MEMO_RATING,
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

  const handleMove = async ({ memoId, targetBookId }) => {
    return moveMemo({ memoId, targetBookId });
  };

  const handleMoveSuccess = (targetBookId) => {
    if (typeof onMove === 'function') {
      onMove(targetBookId);
    }
    if (typeof onUpdate === 'function') {
      onUpdate();
    }
    handleClose();
  };

  if (!memo) return null;

  const theme = useTheme();
  const memoDetailCardSx = getMemoCardSx(theme, { hover: false });

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid="memo-detail-dialog">
        <DialogTitle data-testid="memo-detail-title" data-testid-title="メモ詳細">メモ詳細</DialogTitle>
        <DialogContent>
          {dialogMode === 'view' ? (
            <Paper
              component={Box}
              sx={{
                ...memoDetailCardSx,
                p: 2,
                mt: 1,
                position: 'relative',
                zIndex: 1,
              }}
              elevation={0}
            >
              <LinkifiedText text={editingMemo?.text} variant="body1" sx={{ mb: 2 }} data-testid="memo-detail-text" />
              {editingMemo?.comment && (
                <LinkifiedText
                  text={editingMemo.comment}
                  variant="body2"
                  sx={{ mb: 1 }}
                  color="text.secondary"
                  data-testid="memo-detail-comment"
                />
              )}
              
              {/* ランク表示 */}
              {editingMemo?.rating != null && (
                <Box sx={{ mb: 1 }}>
                  {editingMemo.rating > 0 && (
                    <Rating 
                      value={editingMemo.rating} 
                      readOnly 
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} data-testid="memo-detail-rating-description">
                    {getMemoRatingDescription(editingMemo.rating || DEFAULT_MEMO_RATING)}
                  </Typography>
                </Box>
              )}
              
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }} data-testid="memo-detail-tags">
                {Array.isArray(editingMemo?.tags) && editingMemo.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" color="secondary" />
                ))}
              </Stack>
              {editingMemo?.page && <Typography variant="caption" sx={{ display: 'block', mb: 1 }} data-testid="memo-detail-page">p. {editingMemo.page}</Typography>}
              {editingMemo?.createdAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }} data-testid="memo-detail-created-at">
                  {formatDateTime(editingMemo.createdAt)}
                </Typography>
              )}
            </Paper>
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
              
              {/* ランク入力 */}
              <FormControl margin="normal" fullWidth>
                <FormLabel component="legend">ランク評価</FormLabel>
                <Rating
                  value={editingMemo?.rating || DEFAULT_MEMO_RATING}
                  onChange={(event, newValue) => {
                    setEditingMemo({ ...editingMemo, rating: newValue || DEFAULT_MEMO_RATING });
                  }}
                  size="large"
                  sx={{ mt: 1 }}
                  data-testid="memo-rating-input"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {getMemoRatingDescription(editingMemo?.rating || DEFAULT_MEMO_RATING)}
                </Typography>
              </FormControl>
              
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
              <Button onClick={() => setShowMoveDialog(true)} data-testid="memo-move-button">
                移動
              </Button>
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

      <MemoMoveDialog
        open={showMoveDialog}
        memo={editingMemo}
        currentBookId={bookId}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMove}
        onSuccess={handleMoveSuccess}
      />
    </>
  );
};

export default MemoEditor; 