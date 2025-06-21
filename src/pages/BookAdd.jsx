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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
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
    try {
      const response = await axios.get(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
      const bookData = response.data[0];
      if (bookData) {
        setTitle(bookData.summary.title);
        setAuthor(bookData.summary.author);
      } else {
        setError("書籍情報が見つかりませんでした");
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
        <Grid item xs>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item>
          <IconButton color="primary" onClick={() => setScannerOpen(true)}>
            <CameraAltIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Button onClick={handleFetchBookInfo} variant="outlined" disabled={loading} fullWidth sx={{ my: 1 }}>
        {loading ? '検索中...' : 'ISBNで書籍情報取得'}
      </Button>
      
      <TextField
        label="タイトル"
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="著者"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        fullWidth
        margin="normal"
      />
      {error && <Typography color="error" align="center">{error}</Typography>}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>追加</Button>

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