import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Typography, Box, Paper, Divider, Button, Chip, IconButton } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import MemoList from '../components/MemoList';
import MemoAdd from '../components/MemoAdd';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editTags, setEditTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

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

  // タグ履歴取得（書籍用）
  useEffect(() => {
    const fetchTagHistory = async () => {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "bookTagHistory"),
          orderBy("updatedAt", "desc")
        );
        const snap = await getDocs(q);
        const tags = snap.docs.map(doc => doc.data().tag).filter(Boolean);
        setTagOptions(tags);
      } catch (e) {
        console.error("書籍用タグ履歴の取得に失敗", e);
      }
    };
    fetchTagHistory();
  }, [user]);

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
      setGlobalError("ステータスの更新に失敗しました。");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditTags = () => {
    setEditTags(book.tags || []);
    setEditTagsOpen(true);
  };

  const handleSaveTags = async () => {
    if (!book) return;
    try {
      const docRef = doc(db, 'books', id);
      await updateDoc(docRef, {
        tags: editTags,
        updatedAt: serverTimestamp(),
      });
      setBook({ ...book, tags: editTags });
      setEditTagsOpen(false);
    } catch (error) {
      console.error("Error updating tags:", error);
      setGlobalError("タグの更新に失敗しました。");
    }
  };

  const handleSaveTagToHistory = async (newTags) => {
    if (!user?.uid) return;
    try {
      const { setDoc } = await import('firebase/firestore');
      const batch = [];
      for (const tag of newTags) {
        if (!tagOptions.includes(tag)) {
          const ref = doc(db, "users", user.uid, "bookTagHistory", tag);
          batch.push(setDoc(ref, {
            tag,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true }));
        } else {
          const ref = doc(db, "users", user.uid, "bookTagHistory", tag);
          batch.push(setDoc(ref, {
            updatedAt: serverTimestamp(),
          }, { merge: true }));
        }
      }
      await Promise.all(batch);
    } catch (error) {
      console.error("タグ履歴の保存に失敗", error);
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
        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              タグ:
            </Typography>
            <IconButton size="small" onClick={handleEditTags}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          {book.tags && book.tags.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {book.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              タグが設定されていません
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモ一覧</Typography>
        <MemoList bookId={book.id} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>メモを追加</Typography>
        <MemoAdd bookId={book.id} bookTags={book.tags || []} />
      </Paper>

      {/* タグ編集ダイアログ */}
      <Dialog open={editTagsOpen} onClose={() => setEditTagsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>タグを編集</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            freeSolo
            options={tagOptions}
            value={editTags}
            onChange={async (event, newValue) => {
              const normalized = (newValue || []).map(v => {
                if (typeof v === 'string') return v;
                if (v && typeof v === 'object') {
                  if ('inputValue' in v && v.inputValue) return v.inputValue;
                  if ('tag' in v && v.tag) return v.tag;
                }
                return '';
              }).filter(Boolean);
              setEditTags(normalized);
              await handleSaveTagToHistory(normalized);
            }}
            renderInput={(params) => (
              <TextField {...params} label="タグ" margin="normal" fullWidth placeholder="例: 小説,名作,技術書" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTagsOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveTags} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookDetail; 