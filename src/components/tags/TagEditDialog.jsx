import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';

export default function TagEditDialog({ open, tag, onClose, onRename, onDelete, busy = false }) {
  const [newTag, setNewTag] = useState(tag || '');

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
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDelete?.(tag)} color="error" disabled={busy} data-testid="tag-delete-button">
          削除
        </Button>
        <Button onClick={handleClose} disabled={busy}>キャンセル</Button>
        <Button onClick={() => onRename?.(tag, newTag)} variant="contained" disabled={busy} data-testid="tag-rename-button">
          変更
        </Button>
      </DialogActions>
    </Dialog>
  );
}


