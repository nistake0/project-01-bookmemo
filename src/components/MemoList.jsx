import React, { useState, useContext } from 'react';
import { Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useMemo } from '../hooks/useMemo';
import MemoCard from './MemoCard';
import MemoEditor from './MemoEditor';

const MemoList = ({ bookId, onMemoUpdated }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { memos, loading, updateMemo, deleteMemo } = useMemo(bookId);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);

  console.log('MemoList - レンダリング:', { 
    bookId, 
    memosCount: memos.length, 
    loading, 
    memos: memos.map(m => ({ id: m.id, text: m.text }))
  });

  const handleEdit = (memo) => {
    console.log('MemoList - handleEdit:', memo);
    setSelectedMemo(memo);
    setEditorOpen(true);
  };

  const handleDelete = (memoId) => {
    console.log('MemoList - handleDelete:', memoId);
    const memo = memos.find(m => m.id === memoId);
    if (memo) {
      setMemoToDelete(memo);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memoToDelete) return;
    console.log('MemoList - handleConfirmDelete:', memoToDelete.id);
    
    try {
      await deleteMemo(memoToDelete.id);
      setDeleteDialogOpen(false);
      setMemoToDelete(null);
    } catch (error) {
      console.error("Error deleting memo:", error);
      setGlobalError("メモの削除に失敗しました。");
    }
  };

  const handleClose = () => {
    console.log('MemoList - handleClose');
    setSelectedMemo(null);
    setEditorOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMemoToDelete(null);
  };

  const handleMemoUpdated = () => {
    console.log('MemoList - handleMemoUpdated: メモ更新完了');
    if (onMemoUpdated) {
      console.log('MemoList - onMemoUpdatedコールバック呼び出し');
      onMemoUpdated();
    }
  };

  if (loading) {
    console.log('MemoList - ローディング中');
    return <Typography>メモを読み込み中...</Typography>;
  }
  
  if (memos.length === 0) {
    console.log('MemoList - メモなし');
    return <Typography>まだメモはありません。</Typography>;
  }

  console.log('MemoList - メモ一覧表示:', memos.length, '件');

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {memos.map((memo) => {
          console.log('MemoList - MemoCard描画:', memo.id, memo.text);
          return (
            <MemoCard
              key={memo.id}
              memo={memo}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          );
        })}
      </Box>
      <MemoEditor
        open={editorOpen}
        memo={selectedMemo}
        bookId={bookId}
        onClose={handleClose}
        onUpdate={handleMemoUpdated}
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