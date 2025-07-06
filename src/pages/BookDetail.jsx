import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Typography, Box, Paper, Divider, Button, Chip } from '@mui/material';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const handleStatusChange = async () => {
    if (!book) return;
    setUpdating(true);
    const newStatus = book.status === 'reading' ? 'finished' : 'reading';
    const docRef = doc(db, 'books', id);
    try {
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setBook({ ...book, status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!book) return <div>本が見つかりません。</div>;

  const currentStatus = book.status || 'reading'; // statusがない場合は 'reading' をデフォルトに

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, pb: '56px' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={currentStatus === 'reading' ? '読書中' : '読了'} 
            color={currentStatus === 'reading' ? 'primary' : 'success'} 
          />
          <Button onClick={handleStatusChange} variant="outlined" disabled={updating}>
            {updating ? '更新中...' : (currentStatus === 'reading' ? '読了にする' : '読書中にする')}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={`${book.title}の表紙`} style={{ maxHeight: '250px', width: 'auto' }} />
          ) : (
            <Box sx={{
              border: '1px dashed grey',
              height: 250,
              width: 167,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto'
            }}>
              <Typography variant="body1" color="text.secondary">書影なし</Typography>
            </Box>
          )}
        </Box>
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