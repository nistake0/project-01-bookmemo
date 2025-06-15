import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { TextField, Button, Box, Typography } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功時の処理（画面遷移など）
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin} sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>ログイン</Typography>
      <TextField
        label="メールアドレス"
        value={email}
        onChange={e => setEmail(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="パスワード"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>ログイン</Button>
    </Box>
  );
} 