import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Autocomplete, Chip } from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useTagHistory } from '../../hooks/useTagHistory';

export default function BulkDeleteTagsDialog({ open, onClose, onConfirm, busy = false }) {
  const { user } = useAuth();
  const { tagOptions: bookTags, fetchTagHistory: fetchBookTags } = useTagHistory('book', user);
  const { tagOptions: memoTags, fetchTagHistory: fetchMemoTags } = useTagHistory('memo', user);

  const [selectedTags, setSelectedTags] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchBookTags();
      fetchMemoTags();
    }
  }, [open, user, fetchBookTags, fetchMemoTags]);

  useEffect(() => {
    if (!open) {
      setSelectedTags([]);
      setInputValue('');
    }
  }, [open]);

  const mergedOptions = useMemo(() => {
    const set = new Set([...(bookTags || []), ...(memoTags || [])]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [bookTags, memoTags]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>タグを一括削除</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          削除するタグを選択または入力してください。複数選択できます。
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={mergedOptions}
          value={selectedTags}
          inputValue={inputValue}
          onInputChange={(e, v) => setInputValue(v)}
          onChange={(e, v) => setSelectedTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip key={key} label={option} {...tagProps} color="error" variant="outlined" />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="削除タグ" placeholder="タグ名を入力..." fullWidth data-testid="bulk-delete-tags-input" />
          )}
          data-testid="bulk-delete-tags-autocomplete"
        />
        {!!selectedTags.length && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">削除対象: {selectedTags.join(', ')}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>キャンセル</Button>
        <Button onClick={() => onConfirm?.(selectedTags)} color="error" variant="contained" disabled={busy || selectedTags.length === 0} data-testid="bulk-delete-confirm">
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}


