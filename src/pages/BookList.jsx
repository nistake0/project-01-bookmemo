import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { Typography, List, ListItem, ListItemText, Box, Button, Tabs, Tab, Chip, Stack } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

export default function BookList() {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'reading', 'finished'
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "books"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllBooks(data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [user]);

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };

  const filteredBooks = allBooks.filter(book => {
    if (filter === 'all') return true;
    const status = book.status || 'reading';
    return status === filter;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>本一覧</Typography>
        <Button variant="contained" onClick={() => navigate("/add")}>本を追加</Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={filter} onChange={handleFilterChange} centered>
          <Tab label="すべて" value="all" />
          <Tab label="読書中" value="reading" />
          <Tab label="読了" value="finished" />
        </Tabs>
      </Box>

      <List>
        {filteredBooks.length === 0 && <ListItem><ListItemText primary="該当する本がありません" /></ListItem>}
        {filteredBooks.map(book => (
          <ListItem key={book.id} component={Link} to={`/book/${book.id}`}>
            <ListItemText
              primary={book.title || "タイトル未設定"}
              secondary={
                <Box component="span">
                  {book.author || ""}
                  {Array.isArray(book.tags) && book.tags.length > 0 && (
                    <Box component="span" sx={{ mt: 1, display: 'inline-flex', flexWrap: 'wrap', gap: 1 }}>
                      {book.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" color="primary" component="span" />
                      ))}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 