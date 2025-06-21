import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { TextField, Button, Box, Typography, Grid } from "@mui/material";
import axios from "axios";

export default function BookAdd() {
  const { user } = useAuth();
  const [isbn, setIsbn] =useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={8}>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={4}>
          <Button onClick={handleFetchBookInfo} variant="outlined" disabled={loading} fullWidth sx={{ mb: '8px' }}>
            {loading ? '検索中...' : '情報取得'}
          </Button>
        </Grid>
      </Grid>
      
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
      {error && <Typography color="error">{error}</Typography>}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>追加</Button>
    </Box>
  );
} 