import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, TextField, Button, Typography, Grid, Autocomplete } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useContext } from 'react';

export default function BookForm({ onBookAdded }) {
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [inputTagValue, setInputTagValue] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // タグ履歴取得（updatedAt降順）
  const fetchTagHistory = useCallback(async () => {
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
      console.error("タグ履歴の取得に失敗", e);
    }
  }, [user]);

  useEffect(() => {
    fetchTagHistory();
  }, [fetchTagHistory]);

  const handleFetchBookInfo = async () => {
    if (!isbn) {
      setError("ISBNを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    setSearchPerformed(true);
    try {
      const openbdResponse = await axios.get(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
      const bookData = openbdResponse.data[0];
      
      let title = "";
      let author = "";
      let publisher = "";
      let publishedDate = "";
      let coverUrl = "";
      let nextTags = [];

      // openBDで書籍情報が見つかった場合
      if (bookData && bookData.summary) {
        title = bookData.summary.title || "";
        author = bookData.summary.author || "";
        publisher = bookData.summary.publisher || "";
        publishedDate = bookData.summary.pubdate || "";
        coverUrl = bookData.summary.cover || "";

        // openBDのタグ情報を追加
        if (bookData.summary.subject) nextTags.push(bookData.summary.subject);
        if (bookData.summary.ndc) nextTags.push(bookData.summary.ndc);
      }

      // カバー画像が無い場合、またはopenBDで書籍情報が見つからない場合はGoogle Books APIを呼ぶ
      if (!coverUrl || !title) {
        try {
          const googleResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
          const googleBookData = googleResponse.data;
          
          if (googleBookData.items && googleBookData.items.length > 0) {
            const volumeInfo = googleBookData.items[0].volumeInfo;
            
            // openBDで取得できなかった情報をGoogle Booksから補完
            if (!title) title = volumeInfo.title || "";
            if (!author) author = volumeInfo.authors ? volumeInfo.authors.join(", ") : "";
            if (!publisher) publisher = volumeInfo.publisher || "";
            if (!publishedDate) publishedDate = volumeInfo.publishedDate || "";
            
            // カバー画像
            if (!coverUrl && volumeInfo.imageLinks) {
              coverUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || "";
            }
            
            // Google Booksのカテゴリをタグに追加
            if (volumeInfo.categories && volumeInfo.categories.length > 0) {
              nextTags = [...nextTags, ...volumeInfo.categories];
            }
          }
        } catch (googleErr) {
          console.error("Failed to fetch from Google Books API", googleErr);
        }
      }

      // 最終的に書籍情報が取得できたかチェック
      if (title) {
        setTitle(title);
        setAuthor(author);
        setPublisher(publisher);
        setPublishedDate(publishedDate);
        setCoverImageUrl(coverUrl);
        setTags(Array.from(new Set(nextTags))); // 重複除去
      } else {
        setGlobalError("書籍情報が見つかりませんでした");
        setTitle("");
        setAuthor("");
        setPublisher("");
        setPublishedDate("");
        setCoverImageUrl("");
        setTags([]);
      }
    } catch (err) {
      setGlobalError("書籍情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!title) {
      setError("タイトルは必須です");
      return;
    }
    // 空文字・空白タグを除去し、未確定inputValueも考慮
    let tagsToSave = tags.filter(tag => tag && tag.trim() !== "");
    if (inputTagValue && !tagsToSave.includes(inputTagValue.trim())) {
      tagsToSave = [...tagsToSave, inputTagValue.trim()];
    }
    tagsToSave = tagsToSave.filter(tag => tag && tag.trim() !== "");
    try {
      const docRef = await addDoc(collection(db, "books"), {
        userId: user.uid,
        isbn,
        title,
        author,
        publisher,
        publishedDate,
        coverImageUrl,
        tags: tagsToSave,
        status: 'reading',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await saveNewTagsToHistory(tagsToSave);
      onBookAdded(docRef.id);
    } catch (err) {
      setError("追加に失敗しました: " + err.message);
    }
  };

  // タグ履歴に新規タグを保存
  const saveNewTagsToHistory = async (newTags) => {
    if (!user?.uid) return;
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
    try {
      await Promise.all(batch);
    } catch (e) {
      console.error('bookTagHistory保存エラー:', e);
    }
  };

  return (
    <Box component="form" onSubmit={handleAdd} sx={{ mt: 2 }} role="form" data-testid="book-form">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="例: 9784873119485"
            inputProps={{ "data-testid": "book-isbn-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Button
            onClick={handleFetchBookInfo}
            variant="outlined"
            disabled={loading}
            sx={{ mt: 2 }}
            fullWidth
            data-testid="book-fetch-button"
          >
            {loading ? '取得中...' : 'ISBNで書籍情報取得'}
          </Button>
        </Grid>
      </Grid>

      {coverImageUrl && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <img src={coverImageUrl} alt="表紙" style={{ maxHeight: '200px', width: 'auto' }} data-testid="book-cover-image" />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
            inputProps={{ "data-testid": "book-title-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="著者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ "data-testid": "book-author-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="出版社"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ "data-testid": "book-publisher-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="出版日"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ "data-testid": "book-publishdate-input" }}
          />
        </Grid>
      </Grid>

      <Autocomplete
        multiple
        freeSolo
        options={tagOptions}
        value={tags}
        getOptionLabel={option => typeof option === 'string' ? option : (option.inputValue || option.tag || '')}
        onChange={(event, newValue) => {
          const normalized = (newValue || []).map(v => {
            if (typeof v === 'string') return v;
            if (v && typeof v === 'object') {
              if ('inputValue' in v && v.inputValue) return v.inputValue;
              if ('tag' in v && v.tag) return v.tag;
            }
            return '';
          }).filter(Boolean);
          setTags(normalized);
        }}
        inputValue={inputTagValue}
        onInputChange={(event, newInputValue) => setInputTagValue(newInputValue)}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="タグ" 
            margin="normal" 
            fullWidth 
            placeholder="例: 小説,名作,技術書" 
            inputProps={{ 
              ...params.inputProps,
              'data-testid': 'book-tags-input' 
            }} 
          />
        )}
      />

      {error && (
        <Typography color="error" sx={{ mt: 1 }} data-testid="book-form-error">
          {error}
        </Typography>
      )}

      <Button type="submit" variant="contained" sx={{ mt: 2 }} data-testid="book-add-submit">
        本を追加
      </Button>
    </Box>
  );
} 