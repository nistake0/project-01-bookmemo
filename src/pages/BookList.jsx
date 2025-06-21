import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { Typography, List, ListItem, ListItemText, Box, Button } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

export default function BookList() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchBooks = async () => {
      setLoading(true);
      const q = query(
        collection(db, "books"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(data);
      setLoading(false);
    };
    fetchBooks();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>本一覧</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => navigate("/add")}>本を追加</Button>
      <List>
        {books.length === 0 && <ListItem><ListItemText primary="本がありません" /></ListItem>}
        {books.map(book => (
          <ListItem key={book.id} button component={Link} to={`/book/${book.id}`}>
            <ListItemText
              primary={book.title || "タイトル未設定"}
              secondary={book.author || ""}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 