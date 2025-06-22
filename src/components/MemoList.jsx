import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { List, ListItem, ListItemText, Typography, IconButton, Box, Modal, TextField, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMemo, setEditingMemo] = useState(null);
  const [open, setOpen] = useState(false);

  const handleOpen = (memo) => {
    setEditingMemo(memo);
    setOpen(true);
  };
  const handleClose = () => {
    setEditingMemo(null);
    setOpen(false);
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
    }
  };

  const handleDelete = async (memoId) => {
    if (window.confirm('本当にこのメモを削除しますか？')) {
      try {
        await deleteDoc(doc(db, 'books', bookId, 'memos', memoId));
      } catch (error) {
        console.error("Error deleting memo: ", error);
      }
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookId]);

  if (loading) return <Typography>メモを読み込み中...</Typography>;
  if (memos.length === 0) return <Typography>まだメモはありません。</Typography>;

  return (
    <>
    <List>
      {memos.map((memo) => (
        <ListItem 
          key={memo.id}
          secondaryAction={
            <>
              <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(memo)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(memo.id)}>
                <DeleteIcon />
              </IconButton>
            </>
          }
        >
          <ListItemText 
            primary={memo.text} 
            secondary={
              <>
                {memo.comment}
                {memo.page && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>p. {memo.page}</Typography>}
              </>
            } 
          />
        </ListItem>
      ))}
    </List>
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-memo-modal-title"
    >
      <Box sx={style} component="form" onSubmit={handleUpdate}>
        <Typography id="edit-memo-modal-title" variant="h6" component="h2">
          メモを編集
        </Typography>
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
        />
        <Button type="submit" variant="contained">更新</Button>
        <Button onClick={handleClose} sx={{ ml: 1 }}>キャンセル</Button>
      </Box>
    </Modal>
    </>
  );
};

export default MemoList; 