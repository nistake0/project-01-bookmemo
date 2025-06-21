import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

const MemoList = ({ bookId }) => {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <List>
      {memos.map((memo) => (
        <ListItem key={memo.id}>
          <ListItemText primary={memo.text} secondary={memo.comment || ''} />
        </ListItem>
      ))}
    </List>
  );
};

export default MemoList; 