import { useState, useEffect, useContext } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where, setDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { TextField, Button, Box, Typography, Grid } from "@mui/material";
import axios from "axios";
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';

export default function BookForm({ onBookAdded }) {
  const { user } = useAuth();
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [inputTagValue, setInputTagValue] = useState("");
  const { setGlobalError } = useContext(ErrorDialogContext) || { setGlobalError: () => {} };

  useEffect(() => {
    // Firestoreからタグ履歴（bookTagHistory）を取得（updatedAt降順）
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
        console.error("タグ履歴の取得に失敗", e);
      }
    };
    fetchTagHistory();
  }, [user]);

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
      
      if (bookData && bookData.summary) {
        setTitle(bookData.summary.title || "");
        setAuthor(bookData.summary.author || "");
        setPublisher(bookData.summary.publisher || "");
        setPublishedDate(bookData.summary.pubdate || "");

        let coverUrl = bookData.summary.cover || "";
        let googleBookData = null;
        // カバー画像が無い場合のみGoogle Books APIを呼ぶ
        if (!coverUrl) {
          try {
            const googleResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            googleBookData = googleResponse.data;
            if (googleBookData.items && googleBookData.items.length > 0) {
              const imageLinks = googleBookData.items[0].volumeInfo.imageLinks;
              if (imageLinks) {
                coverUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
              }
            }
          } catch (googleErr) {
            console.error("Failed to fetch from Google Books API", googleErr);
          }
        }
        setCoverImageUrl(coverUrl);

        // Google Books API categoriesとopenBD subject/ndcをマージしてタグ候補に
        let nextTags = [];
        if (googleBookData && googleBookData.items && googleBookData.items.length > 0) {
          const categories = googleBookData.items[0].volumeInfo.categories;
          if (categories && categories.length > 0) {
            nextTags = categories;
          }
        }
        // openBD
        const openbdTags = [];
        if (bookData.summary.subject) openbdTags.push(bookData.summary.subject);
        if (bookData.summary.ndc) openbdTags.push(bookData.summary.ndc);
        // マージ（重複除去）
        nextTags = Array.from(new Set([...nextTags, ...openbdTags]));
        setTags(nextTags);

      } else {
        setGlobalError("書籍情報が見つかりませんでした");
        setTitle("");
        setAuthor("");
        setPublisher("");
        setPublishedDate("");
        setCoverImageUrl("");
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
    <Box component="form" onSubmit={handleAdd} sx={{ mt: 2 }} role="form">
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="例: 9784873119485"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            onClick={handleFetchBookInfo}
            variant="outlined"
            disabled={loading}
            sx={{ mt: 2 }}
            fullWidth
          >
            {loading ? '取得中...' : 'ISBNで書籍情報取得'}
          </Button>
        </Grid>
      </Grid>

      {coverImageUrl && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <img src={coverImageUrl} alt="表紙" style={{ maxHeight: '200px', width: 'auto' }} />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="著者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="出版社"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="出版日"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            fullWidth
            margin="normal"
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
          <TextField {...params} label="タグ" margin="normal" fullWidth placeholder="例: 小説,名作,技術書" />
        )}
      />

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        本を追加
      </Button>
    </Box>
  );
} 