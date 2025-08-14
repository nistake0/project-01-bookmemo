import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box } from '@mui/material';

export default function TagEditDialog({ open, tag, onClose, onRename, onDelete, onMerge, busy = false }) {
  const [newTag, setNewTag] = useState(tag || '');
  const [mergeCanonical, setMergeCanonical] = useState('');
  const [mergeAliases, setMergeAliases] = useState('');

  const handleClose = () => {
    setNewTag(tag || '');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>タグを編集</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          タグ名の変更またはタグの削除を行えます。
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="新しいタグ名"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          disabled={busy}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            類似タグの統合（カンマ区切りで別名を指定）
          </Typography>
          <TextField
            fullWidth
            label="統合先（正規化タグ名）"
            value={mergeCanonical}
            onChange={(e) => setMergeCanonical(e.target.value)}
            disabled={busy}
          />
          <TextField
            fullWidth
            label="別名（カンマ区切り）"
            value={mergeAliases}
            onChange={(e) => setMergeAliases(e.target.value)}
            disabled={busy}
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDelete?.(tag)} color="error" disabled={busy} data-testid="tag-delete-button">
          削除
        </Button>
        <Button onClick={handleClose} disabled={busy}>キャンセル</Button>
        <Button onClick={() => onRename?.(tag, newTag)} variant="contained" disabled={busy} data-testid="tag-rename-button">
          変更
        </Button>
        <Button onClick={() => onMerge?.(mergeAliases, mergeCanonical)} variant="outlined" disabled={busy} data-testid="tag-merge-button">
          統合
        </Button>
      </DialogActions>
    </Dialog>
  );
}


