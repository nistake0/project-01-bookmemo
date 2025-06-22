import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Typography, Box, Paper, Divider } from '@mui/material';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBook = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'books', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setBook({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such document or access denied!");
          // TODO: 404ページやエラー表示を実装
          setBook(null);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user]);

  if (loading) return <div>Loading...</div>;
  if (!book) return <div>本が見つかりません。</div>;


  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        {book.coverImageUrl && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src={book.coverImageUrl} alt={`${book.title}の表紙`} style={{ maxHeight: '250px', width: 'auto' }} />
          </Box>
        )}
        <Typography variant="h4" gutterBottom>
          {book.title}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {book.author}
        </Typography>
        {book.publisher && (
          <Typography variant="body1" color="text.secondary">
            出版社: {book.publisher}
          </Typography>
        )}
        {book.publishedDate && (
          <Typography variant="body1" color="text.secondary">
            出版日: {book.publishedDate}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモ一覧</Typography>
        <MemoList bookId={book.id} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモを追加</Typography>
        <MemoAdd bookId={book.id} />
      </Paper>
    </Box>
  );
};

export default BookDetail; 