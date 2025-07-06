import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, TextField, Box } from '@mui/material';

const MemoAdd = ({ bookId }) => {
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const [page, setPage] = useState('');
  const [tagsText, setTagsText] = useState(''); // タグ入力用

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const tags = tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      const memosRef = collection(db, 'books', bookId, 'memos');
      await addDoc(memosRef, {
        text,
        comment,
        page: Number(page) || null, // 数値に変換。空の場合はnull
        tags, // 追加
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setText('');
      setComment('');
      setPage('');
      setTagsText('');
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
      <TextField
        label="ページ番号"
        type="number"
        value={page}
        onChange={(e) => setPage(e.target.value)}
        margin="normal"
        sx={{ mr: 2 }}
      />
      <TextField
        label="タグ（カンマ区切り）"
        value={tagsText}
        onChange={e => setTagsText(e.target.value)}
        fullWidth
        margin="normal"
        placeholder="例: 名言,感想,引用"
      />
      <Button type="submit" variant="contained">メモを追加</Button>
    </Box>
  );
};

export default MemoAdd; 