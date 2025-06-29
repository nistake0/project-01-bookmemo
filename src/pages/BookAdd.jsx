import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { TextField, Button, Box, Typography, Grid, Modal, IconButton } from "@mui/material";
import axios from "axios";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BarcodeScanner from "../components/BarcodeScanner";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const navigate = useNavigate();

  const handleScanDetected = (code) => {
    setIsbn(code);
    setScannerOpen(false);
  };
  
  const handleScanError = (errorMessage) => {
    setError(`スキャナーエラー: ${errorMessage}`);
    setScannerOpen(false);
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

        if (!coverUrl) {
          console.log("No cover from openBD, trying Google Books API...");
          try {
            const googleResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const googleBookData = googleResponse.data;
            if (googleBookData.items && googleBookData.items.length > 0) {
              const imageLinks = googleBookData.items[0].volumeInfo.imageLinks;
              if (imageLinks) {
                coverUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
                console.log("Found cover from Google Books API:", coverUrl);
              }
            }
          } catch (googleErr) {
            console.error("Failed to fetch from Google Books API", googleErr);
          }
        }
        setCoverImageUrl(coverUrl);

      } else {
        setError("書籍情報が見つかりませんでした");
        setTitle("");
        setAuthor("");
        setPublisher("");
        setPublishedDate("");
        setCoverImageUrl("");
      }
    } catch (err) {
      setError("書籍情報の取得に失敗しました");
      console.error(err);
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
    try {
      await addDoc(collection(db, "books"), {
        userId: user.uid,
        isbn,
        title,
        author,
        publisher,
        publishedDate,
        coverImageUrl,
        status: 'reading',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError("追加に失敗しました: " + err.message);
    }
  };

  return (
    <Box component="form" onSubmit={handleAdd} sx={{ maxWidth: 500, mx: "auto", mt: 8 }}>
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
      {error && <Typography color="error" align="center">{error}</Typography>}
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