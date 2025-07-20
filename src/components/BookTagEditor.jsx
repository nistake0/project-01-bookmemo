import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, getDocs, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { Typography, Box, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import { ErrorDialogContext } from './CommonErrorDialog';

const BookTagEditor = ({ book, bookId, onTagsChange }) => {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editTags, setEditTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

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

  const handleEditTags = () => {
    setEditTags(book.tags || []);
    setEditTagsOpen(true);
  };

  const handleSaveTags = async () => {
    if (!book) return;
    try {
      const docRef = doc(db, 'books', bookId);
      await updateDoc(docRef, {
        tags: editTags,
        updatedAt: serverTimestamp(),
      });
      onTagsChange(editTags);
      setEditTagsOpen(false);
    } catch (error) {
      console.error("Error updating tags:", error);
      setGlobalError("タグの更新に失敗しました。");
    }
  };

  const handleSaveTagToHistory = async (newTags) => {
    if (!user?.uid) return;
    try {
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

  if (!book) return null;

  return (
    <>
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
    </>
  );
};

export default BookTagEditor; 