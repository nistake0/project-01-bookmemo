import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { List, ListItem, ListItemText, Typography, IconButton, Box, Modal, TextField, Button, Chip, Stack } from '@mui/material';
import { Card, CardContent, CardActions } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ErrorDialogContext } from './CommonErrorDialog';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const MemoList = ({ bookId }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMemo, setEditingMemo] = useState(null);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view' or 'edit'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleOpen = (memo) => {
    setEditingMemo(memo);
    setOpen(true);
    setDialogMode('view');
  };
  const handleClose = () => {
    setEditingMemo(null);
    setOpen(false);
    setDialogMode('view');
    setShowDeleteConfirm(false);
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
    } catch (error) {
      console.error("Error updating memo: ", error);
      setGlobalError("メモの更新に失敗しました。");
    }
  };

  const handleDelete = async (memoId) => {
    try {
      await deleteDoc(doc(db, 'books', bookId, 'memos', memoId));
      handleClose();
    } catch (error) {
      console.error("Error deleting memo: ", error);
      setGlobalError("メモの削除に失敗しました。");
    }
  };

  useEffect(() => {
    if (!bookId) return;

    const memosRef = collection(db, 'books', bookId, 'memos');
    const q = query(memosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const memosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemos(memosData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching memos:", error);
      setGlobalError("メモ一覧の取得に失敗しました。");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookId, setGlobalError]);

  if (loading) return <Typography>メモを読み込み中...</Typography>;
  if (memos.length === 0) return <Typography>まだメモはありません。</Typography>;

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {memos.map((memo) => {
        // カードの高さを制限し、本文・コメントは2行まで省略表示
        // メタ情報は1行にまとめて横並び
        const maxLines = 2;
        const lines = memo.text ? memo.text.split('\n') : [];
        const shortText = lines.slice(0, maxLines).join('\n');
        const isLong = lines.length > maxLines;
        const createdAt = memo.createdAt && memo.createdAt.toDate ? memo.createdAt.toDate() : null;
        return (
          <Card key={memo.id} data-testid="memo-card" sx={{ position: 'relative', maxWidth: '100%', mx: 'auto' }}>
            <CardContent sx={{ pb: 1, minHeight: 48, maxHeight: 56, overflow: 'hidden' }}>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                }}
              >
                {shortText}
              </Typography>
              {memo.comment && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                  }}
                >
                  {memo.comment}
                </Typography>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {memo.page && <Typography variant="caption">p.{memo.page}</Typography>}
                {createdAt && <Typography variant="caption" color="text.secondary">{createdAt.toLocaleDateString()}</Typography>}
                {Array.isArray(memo.tags) && memo.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" color="secondary" />
                ))}
              </Stack>
              <Box>
                <IconButton aria-label="edit" onClick={() => handleOpen(memo)} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => handleDelete(memo.id)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardActions>
          </Card>
        );
      })}
    </Box>
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-memo-modal-title"
    >
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>メモ詳細</DialogTitle>
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
              <Button onClick={() => setDialogMode('edit')}>編集</Button>
              <Button onClick={() => setShowDeleteConfirm(true)} color="error">削除</Button>
              <Button onClick={handleClose}>閉じる</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setDialogMode('view')}>キャンセル</Button>
              <Button onClick={handleUpdate} variant="contained">更新</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Modal>
    <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
      <DialogTitle>本当に削除しますか？</DialogTitle>
      <DialogContent>
        <Typography>このメモを削除すると、元に戻すことはできません。</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button>
        <Button onClick={() => handleDelete(editingMemo?.id)} color="error" variant="contained">削除</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default MemoList; 