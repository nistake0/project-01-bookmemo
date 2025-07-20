import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Typography, Box } from '@mui/material';
import { ErrorDialogContext } from './CommonErrorDialog';
import MemoCard from './MemoCard';
import MemoEditor from './MemoEditor';

const MemoList = ({ bookId }) => {
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleEdit = (memo) => {
    setSelectedMemo(memo);
    setEditorOpen(true);
  };

  const handleDelete = (memoId) => {
    // MemoEditorで削除処理を行うため、ここでは何もしない
  };

  const handleClose = () => {
    setSelectedMemo(null);
    setEditorOpen(false);
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
    </>
  );
};

export default MemoList; 