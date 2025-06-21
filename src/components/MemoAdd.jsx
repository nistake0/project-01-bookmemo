import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, TextField, Box } from '@mui/material';

const MemoAdd = ({ bookId }) => {
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const memosRef = collection(db, 'books', bookId, 'memos');
      await addDoc(memosRef, {
        text,
        comment,
        createdAt: serverTimestamp(),
      });
      setText('');
      setComment('');
    } catch (error) {
      console.error("Error adding memo: ", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label="引用・抜き書き"
        fullWidth
        multiline
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        label="感想・コメント"
        fullWidth
        multiline
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        margin="normal"
      />
      <Button type="submit" variant="contained">メモを追加</Button>
    </Box>
  );
};

export default MemoAdd; 