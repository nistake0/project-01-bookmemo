import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, getDocs, query, where, setDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { TextField, Button, Box, Typography, Grid, Modal, IconButton } from "@mui/material";
import axios from "axios";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BarcodeScanner from "../components/BarcodeScanner";
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function BookAdd() {
  const { user } = useAuth();
  const [isbn, setIsbn] =useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [inputTagValue, setInputTagValue] = useState("");
  const navigate = useNavigate();
  const { setGlobalError } = useContext(ErrorDialogContext);

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

  const handleScanDetected = (code) => {
    setIsbn(code);
    setScannerOpen(false);
  };
  
  const handleScanError = (errorMessage) => {
    setError(`スキャナーエラー: ${errorMessage}`);
    setScannerOpen(false);
    console.log('[BookAdd] setGlobalError呼び出し', errorMessage);
    setGlobalError(errorMessage);
  };

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
      await addDoc(collection(db, "books"), {
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
      navigate("/");
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
    <Box component="form" onSubmit={handleAdd} sx={{ maxWidth: 500, mx: "auto", mt: 8, pb: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>本を追加</Typography>

      <Grid container spacing={1} alignItems="center">
        <Grid xs>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ 'data-testid': 'book-isbn-input' }}
          />
        </Grid>
        <Grid>
          <IconButton color="primary" onClick={() => setScannerOpen(true)}>
            <CameraAltIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Button onClick={handleFetchBookInfo} variant="outlined" disabled={loading} fullWidth sx={{ my: 1 }}>
        {loading ? '検索中...' : 'ISBNで書籍情報取得'}
      </Button>
      
      {searchPerformed && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="表紙" style={{ maxWidth: '150px', height: 'auto' }} />
          ) : (
            <Box sx={{ 
              border: '1px dashed grey', 
              width: 150, 
              height: 225, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mx: 'auto' 
            }}>
              <Typography variant="caption" color="text.secondary">書影なし</Typography>
            </Box>
          )}
        </Box>
      )}

      <TextField
        label="タイトル"
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
        margin="normal"
        required
        inputProps={{ 'data-testid': 'book-title-input' }}
      />
      <TextField
        label="著者"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        fullWidth
        margin="normal"
        inputProps={{ 'data-testid': 'book-author-input' }}
      />
      <TextField
        label="出版社"
        value={publisher}
        onChange={e => setPublisher(e.target.value)}
        fullWidth
        margin="normal"
        inputProps={{ 'data-testid': 'book-publisher-input' }}
      />
      <TextField
        label="出版日"
        value={publishedDate}
        onChange={e => setPublishedDate(e.target.value)}
        fullWidth
        margin="normal"
        inputProps={{ 'data-testid': 'book-publishdate-input' }}
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
        onInputChange={(event, newInputValue) => {
          // カンマで区切られた場合、自動的にtagsに追加
          if (newInputValue.endsWith(',')) {
            const newTag = newInputValue.slice(0, -1).trim();
            if (newTag && !tags.includes(newTag)) {
              setTags([...tags, newTag]);
            }
            setInputTagValue('');
          } else {
            setInputTagValue(newInputValue);
          }
        }}
        renderInput={(params) => {
          return (
            <TextField {...params} label="タグ" margin="normal" fullWidth inputProps={{ ...params.inputProps, 'data-testid': 'book-tags-input' }} />
          );
        }}
      />
      {/* エラーはグローバルダイアログで表示するため、ここでは非表示 */}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} data-testid="book-add-submit">追加</Button>

      <Modal
        open={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        aria-labelledby="barcode-scanner-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="barcode-scanner-modal" variant="h6" component="h2">
            バーコードをスキャン
          </Typography>
          <BarcodeScanner 
            onDetected={handleScanDetected}
            onError={handleScanError}
          />
          <Button onClick={() => setScannerOpen(false)} sx={{ mt: 2 }}>キャンセル</Button>
        </Box>
      </Modal>
    </Box>
  );
} 