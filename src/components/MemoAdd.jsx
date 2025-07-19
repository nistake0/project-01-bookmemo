import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, TextField, Box, Typography, Chip } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';

const MemoAdd = ({ bookId, bookTags = [] }) => {
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState([]); // タグ配列
  const [tagOptions, setTagOptions] = useState([]); // サジェスト候補
  const [inputTagValue, setInputTagValue] = useState("");

  // タグ履歴取得（updatedAt降順）
  useEffect(() => {
    const fetchTagHistory = async () => {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "memoTagHistory"),
          orderBy("updatedAt", "desc")
        );
        const snap = await getDocs(q);
        const tags = snap.docs.map(doc => doc.data().tag).filter(Boolean);
        setTagOptions(tags);
      } catch (e) {
        console.error("メモ用タグ履歴の取得に失敗", e);
        setGlobalError("タグ履歴の取得に失敗しました。");
      }
    };
    fetchTagHistory();
  }, [user, setGlobalError]);

  // 書籍のタグを初期値として設定
  useEffect(() => {
    if (bookTags && bookTags.length > 0) {
      setTags(bookTags);
    }
  }, [bookTags]);

  // タグ履歴に新規タグを保存
  const saveNewTagsToHistory = async (newTags) => {
    if (!user?.uid) return;
    try {
      const batch = [];
      for (const tag of newTags) {
        if (!tagOptions.includes(tag)) {
          const ref = doc(db, "users", user.uid, "memoTagHistory", tag);
          batch.push(setDoc(ref, {
            tag,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true }));
        } else {
          const ref = doc(db, "users", user.uid, "memoTagHistory", tag);
          batch.push(setDoc(ref, {
            updatedAt: serverTimestamp(),
          }, { merge: true }));
        }
      }
      await Promise.all(batch);
    } catch (error) {
      console.error("タグ履歴の保存に失敗", error);
      setGlobalError("タグ履歴の保存に失敗しました。");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // 未確定のタグ入力があればtagsに追加
    let tagsToSave = tags;
    if (inputTagValue && !tags.includes(inputTagValue)) {
      tagsToSave = [...tags, inputTagValue];
    }
    try {
      const memosRef = collection(db, 'books', bookId, 'memos');
      await addDoc(memosRef, {
        text,
        comment,
        page: Number(page) || null,
        tags: tagsToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await saveNewTagsToHistory(tagsToSave);
      setText('');
      setComment('');
      setPage('');
      setTags([]);
      setInputTagValue('');
    } catch (error) {
      console.error("Error adding memo: ", error);
      setGlobalError("メモの追加に失敗しました。");
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
        inputProps={{ 'data-testid': 'memo-text-input' }}
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
      <Autocomplete
        multiple
        freeSolo
        options={tagOptions}
        value={tags}
        getOptionLabel={option => typeof option === 'string' ? option : (option.inputValue || option.tag || '')}
        onChange={async (event, newValue) => {
          const normalized = (newValue || []).map(v => {
            if (typeof v === 'string') return v;
            if (v && typeof v === 'object') {
              if ('inputValue' in v && v.inputValue) return v.inputValue;
              if ('tag' in v && v.tag) return v.tag;
            }
            return '';
          }).filter(Boolean);
          setTags(normalized);
          await saveNewTagsToHistory(normalized);
        }}
        inputValue={inputTagValue}
        onInputChange={(event, newInputValue) => setInputTagValue(newInputValue)}
        renderInput={(params) => (
          <TextField {...params} label="タグ" margin="normal" fullWidth placeholder="例: 名言,感想,引用" />
        )}
      />
      <Button type="submit" variant="contained" data-testid="memo-add-submit">メモを追加</Button>
    </Box>
  );
};

export default MemoAdd; 