import React, { useState, useContext } from 'react';
import { Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useMemo } from '../hooks/useMemo';
import MemoCard from './MemoCard';
import MemoEditor from './MemoEditor';
import LoadingIndicator from './common/LoadingIndicator';

const MemoList = ({ bookId, onMemoUpdated }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { memos, loading, updateMemo, deleteMemo } = useMemo(bookId);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);
  const [editorEditMode, setEditorEditMode] = useState(false);

  // 通常の詳細表示（タップ時）
  const handleEdit = (memo, editMode = false) => {
    setSelectedMemo(memo);
    setEditorEditMode(editMode);
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
      await deleteMemo(memoToDelete.id);
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

  const handleMemoUpdated = () => {
    if (onMemoUpdated) {
      onMemoUpdated();
    }
  };

  if (loading) {
    return (
      <LoadingIndicator
        variant="inline"
        message="メモを読み込み中..."
        data-testid="memo-list-loading"
      />
    );
  }
  
  if (memos.length === 0) {
    return <Typography>まだメモはありません。</Typography>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {memos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            onEdit={(m, editMode) => handleEdit(m, editMode)}
            onDelete={handleDelete}
            onClick={(m) => handleEdit(m, false)}
          />
        ))}
      </Box>
      <MemoEditor
        open={editorOpen}
        memo={selectedMemo}
        bookId={bookId}
        onClose={handleClose}
        onUpdate={handleMemoUpdated}
        onDelete={handleMemoUpdated}
        editMode={editorEditMode}
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