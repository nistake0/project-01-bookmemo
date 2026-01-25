import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { BOOK_STATUS_COLORS, BOOK_STATUS_LABELS } from '../constants/bookStatus';
import { useBookLookup } from '../hooks/useBookLookup';
import LoadingIndicator from './common/LoadingIndicator';

const formatDateTime = (createdAt) => {
  if (!createdAt) return '';
  try {
    const date =
      typeof createdAt.toDate === 'function'
        ? createdAt.toDate()
        : createdAt instanceof Date
        ? createdAt
        : null;
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  } catch (error) {
    return '';
  }
};

const buildMemoSummary = (memo) => {
  if (!memo) return '';
  const base = memo.text || memo.comment || '';
  if (!base) return '';
  const trimmed = base.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}…`;
};

const MemoMoveDialog = ({
  open,
  memo,
  currentBookId,
  onClose,
  onMove,
  onSuccess,
}) => {
  const { books, loading, error, refresh } = useBookLookup();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [validationState, setValidationState] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  useEffect(() => {
    if (!open) {
      setSelectedBookId('');
      setValidationError(null);
      setValidationState('idle');
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (error) {
      setSelectedBookId('');
    }
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);
    setValidationState('idle');

    if (!selectedBook) {
      setValidationError('移動先の書籍を選択してください。');
      setValidationState('required');
      return;
    }
    if (selectedBook.id === currentBookId) {
      setValidationError('同じ書籍には移動できません。');
      setValidationState('same-book');
      return;
    }
    if (!memo?.id) {
      setValidationError('メモの情報を取得できませんでした。');
       setValidationState('invalid-memo');
      return;
    }

    try {
      setIsSubmitting(true);
      await onMove?.({
        memoId: memo.id,
        targetBookId: selectedBook.id,
      });
      onSuccess?.(selectedBook.id);
      onClose?.();
    } catch (submitError) {
      console.error('Failed to move memo:', submitError);
      setValidationError('メモの移動に失敗しました。');
      setValidationState('submit-error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusChip = (book) => {
    if (!book?.status) return null;
    const label = BOOK_STATUS_LABELS[book.status] || '未設定';
    const color = BOOK_STATUS_COLORS[book.status] || 'default';
    return (
      <Chip
        size="small"
        label={label}
        color={color}
        sx={{ ml: 1 }}
        data-testid="memo-move-book-status-chip"
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      data-testid="memo-move-dialog"
    >
      <DialogTitle>メモを別の書籍へ移動</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {memo && (
            <Box
              sx={{
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
                backgroundColor: (theme) => theme.palette.action.hover,
              }}
              data-testid="memo-move-summary"
            >
              <Typography variant="subtitle2" gutterBottom data-testid="memo-move-summary-label">
                対象メモ
              </Typography>
              {memo.text && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: memo.comment ? 1 : 0 }}>
                  {buildMemoSummary(memo)}
                </Typography>
              )}
              {memo.comment && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {memo.comment}
                </Typography>
              )}
              {memo.createdAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  作成日時: {formatDateTime(memo.createdAt)}
                </Typography>
              )}
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            data-testid="memo-move-instruction"
          >
            誤って別の書籍に作成したメモを移動します。移動先の書籍を選択すると、元の書籍からは自動的に削除されます。
          </Typography>

          <Divider />

          {error && (
            <Alert
              severity="error"
              data-testid="memo-move-fetch-error"
              action={
                <Button color="inherit" size="small" onClick={refresh} data-testid="memo-move-refresh-button">
                  再読み込み
                </Button>
              }
            >
              書籍リストの取得に失敗しました。再読み込みしてください。
            </Alert>
          )}

          {loading ? (
            <LoadingIndicator
              variant="inline"
              message="書籍リストを読み込み中..."
              data-testid="memo-move-loading"
            />
          ) : (
            <form onSubmit={handleSubmit} data-testid="memo-move-form">
              <Autocomplete
                options={books}
                value={selectedBook}
                onChange={(_, newValue) => {
                  const newId = newValue?.id || '';
                  setSelectedBookId(newId);
                  if (!newId) {
                    setValidationError(null);
                    setValidationState('idle');
                    return;
                  }
                  if (newId === currentBookId) {
                    setValidationError('同じ書籍には移動できません。');
                    setValidationState('same-book');
                    return;
                  }
                  setValidationError(null);
                  setValidationState('idle');
                }}
                getOptionLabel={(option) => option?.title || '（タイトル未設定）'}
                noOptionsText="該当する書籍がありません"
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id} data-testid={`memo-move-option-${option.id}`}>
                    <Stack spacing={0.5} sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {option.title || '（タイトル未設定）'}
                        </Typography>
                        {renderStatusChip(option)}
                      </Box>
                      {option.author && (
                        <Typography variant="body2" color="text.secondary">
                          {option.author}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    data-testid="memo-move-book-textfield"
                    label="移動先の書籍"
                    placeholder="タイトルや著者名で検索"
                    error={Boolean(validationError)}
                    helperText={
                      validationError ||
                      (books.length === 0
                        ? '移動先の書籍がありません'
                        : '移動先の書籍を選択してください')
                    }
                    inputProps={{
                      ...params.inputProps,
                      'data-testid': 'memo-move-book-input',
                    }}
                    FormHelperTextProps={{
                      ...(params.FormHelperTextProps ?? {}),
                      'data-testid': 'memo-move-helper-text',
                      'data-state': validationState,
                    }}
                  />
                )}
                disabled={isSubmitting || books.length === 0}
                data-testid="memo-move-book-autocomplete"
              />
            </form>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting} data-testid="memo-move-cancel-button">
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            isSubmitting ||
            !selectedBook ||
            selectedBook.id === currentBookId ||
            books.length === 0
          }
          data-testid="memo-move-submit-button"
        >
          {isSubmitting ? '移動中...' : '移動する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemoMoveDialog;
