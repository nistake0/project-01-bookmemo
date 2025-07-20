import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';
import MemoCard from './MemoCard';
import MemoEditor from './MemoEditor';

const MemoList = ({ bookId }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);

  const handleEdit = (memo) => {
    setSelectedMemo(memo);
    setEditorOpen(true);
  };

  const handleDelete = (memoId) => {
    const memo = memos.find(m => m.id === memoId);
    if (memo) {
      setMemoToDelete(memo);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memoToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'books', bookId, 'memos', memoToDelete.id));
      setDeleteDialogOpen(false);
      setMemoToDelete(null);
    } catch (error) {
      console.error("Error deleting memo:", error);
      setGlobalError("メモの削除に失敗しました。");
    }
  };

  const handleClose = () => {
    setSelectedMemo(null);
    setEditorOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMemoToDelete(null);
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
        {memos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </Box>
      <MemoEditor
        open={editorOpen}
        memo={selectedMemo}
        bookId={bookId}
        onClose={handleClose}
      />
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} data-testid="memo-delete-dialog">
        <DialogTitle data-testid="memo-delete-confirm-title">本当に削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>このメモを削除すると、元に戻すことはできません。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} data-testid="memo-delete-cancel-button">キャンセル</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" data-testid="memo-delete-confirm-button">削除</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemoList; 