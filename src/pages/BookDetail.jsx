import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Box, Paper, Divider, Typography } from '@mui/material';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import BookInfo from '../components/BookInfo';
import BookStatusChanger from '../components/BookStatusChanger';
import BookTagEditor from '../components/BookTagEditor';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
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
          setGlobalError("書籍が見つからないか、アクセス権限がありません。");
          setBook(null);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setGlobalError("書籍情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, user, setGlobalError]);

  const handleStatusChange = (newStatus) => {
    setBook({ ...book, status: newStatus });
  };

  const handleTagsChange = (newTags) => {
    setBook({ ...book, tags: newTags });
  };

  if (loading) return <div>Loading...</div>;
  if (!book) return <div>本が見つかりません。</div>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, pb: '80px' }}>
      <Paper sx={{ p: 3 }}>
        <BookInfo book={book} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <BookStatusChanger book={book} bookId={id} onStatusChange={handleStatusChange} />
        </Box>
        
        <BookTagEditor book={book} bookId={id} onTagsChange={handleTagsChange} />
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモ一覧</Typography>
        <MemoList bookId={book.id} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモを追加</Typography>
        <MemoAdd bookId={book.id} bookTags={book.tags || []} />
      </Paper>
    </Box>
  );
};

export default BookDetail; 