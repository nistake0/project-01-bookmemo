import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Autocomplete, Chip } from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useTagHistory } from '../../hooks/useTagHistory';

export default function BulkMergeTagsDialog({ open, onClose, onConfirm, busy = false }) {
  const { user } = useAuth();
  const { tagOptions: bookTags, fetchTagHistory: fetchBookTags } = useTagHistory('book', user);
  const { tagOptions: memoTags, fetchTagHistory: fetchMemoTags } = useTagHistory('memo', user);

  const [canonical, setCanonical] = useState('');
  const [aliases, setAliases] = useState([]);
  const [canonicalInput, setCanonicalInput] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchBookTags();
      fetchMemoTags();
    }
  }, [open, user, fetchBookTags, fetchMemoTags]);

  useEffect(() => {
    if (!open) {
      setCanonical('');
      setAliases([]);
      setCanonicalInput('');
    }
  }, [open]);

  const mergedOptions = useMemo(() => {
    const set = new Set([...(bookTags || []), ...(memoTags || [])]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [bookTags, memoTags]);

  const canSubmit = canonical.trim().length > 0 && aliases.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>タグを一括統合</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          複数の別名タグを正規タグへ統合します。正規タグと、統合したい別名タグを選択してください。
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>正規タグ</Typography>
          <Autocomplete
            freeSolo
            options={mergedOptions}
            value={canonical}
            inputValue={canonicalInput}
            onInputChange={(e, v) => setCanonicalInput(v)}
            onChange={(e, v) => setCanonical(v || canonicalInput)}
            renderInput={(params) => (
              <TextField {...params} label="正規タグ" placeholder="統合先のタグ名" fullWidth />
            )}
            data-testid="bulk-merge-canonical"
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>別名タグ（複数可）</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={mergedOptions}
            value={aliases}
            onChange={(e, v) => setAliases(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip key={key} label={option} {...tagProps} color="primary" variant="outlined" />
                );
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="別名タグ" placeholder="統合したい別名を入力..." fullWidth />
            )}
            data-testid="bulk-merge-aliases"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>キャンセル</Button>
        <Button onClick={() => onConfirm?.(aliases, canonical || canonicalInput)} variant="contained" disabled={busy || !canSubmit} data-testid="bulk-merge-confirm">
          統合
        </Button>
      </DialogActions>
    </Dialog>
  );
}


