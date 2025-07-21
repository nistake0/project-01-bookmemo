import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { Typography, List, ListItem, ListItemText, Box, Button, Tabs, Tab, Chip, Stack, TextField } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

// タグ正規化関数（小文字化＋全角英数字→半角）
function normalizeTag(tag) {
  if (!tag) return '';
  // 全角英数字→半角
  const zenkakuToHankaku = s => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
  return zenkakuToHankaku(tag).toLowerCase();
}

// ステータスを日本語テキストに変換する関数
function getStatusText(status) {
  switch (status) {
    case 'reading':
      return '読書中';
    case 'finished':
      return '読了';
    default:
      return '読書中';
  }
}

export default function BookList() {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'reading', 'finished'
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== BookList useEffect START ===');
    console.log('user:', user);
    console.log('user.uid:', user?.uid);
    
    if (!user) {
      console.log('=== BookList useEffect: no user, setting loading false ===');
      setLoading(false);
      return;
    }
    
    const fetchBooks = async () => {
      console.log('=== BookList fetchBooks START ===');
      setLoading(true);
      try {
        const q = query(
          collection(db, "books"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc")
        );
        console.log('=== BookList getDocs START ===');
        const querySnapshot = await getDocs(q);
        console.log('=== BookList getDocs END ===');
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('=== BookList setAllBooks START ===');
        setAllBooks(data);
        console.log('=== BookList setAllBooks END ===');
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        console.log('=== BookList setLoading false ===');
        setLoading(false);
      }
    };
    fetchBooks();
    console.log('=== BookList useEffect END ===');
  }, [user]);

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };

  const filteredBooks = allBooks.filter(book => {
    if (filter !== 'all') {
      const status = book.status || 'reading';
      if (status !== filter) return false;
    }
    if (!searchText.trim()) return true;
    const normalizedQuery = normalizeTag(searchText);
    // タイトル・著者・タグで部分一致（正規化）
    return (
      (book.title && normalizeTag(book.title).includes(normalizedQuery)) ||
      (book.author && normalizeTag(book.author).includes(normalizedQuery)) ||
      (Array.isArray(book.tags) && book.tags.some(tag => normalizeTag(tag).includes(normalizedQuery)))
    );
  });

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, pb: "56px" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom data-testid="book-list-title">本一覧</Typography>
        <Button variant="contained" data-testid="book-add-button" onClick={() => navigate("/add")}>本を追加</Button>
      </Box>

      <TextField
        label="検索（タイトル・著者・タグ）"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        fullWidth
        margin="normal"
        sx={{ mb: 2 }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={filter} onChange={handleFilterChange} centered>
          <Tab label="すべて" value="all" />
          <Tab label="読書中" value="reading" />
          <Tab label="読了" value="finished" />
        </Tabs>
      </Box>

      <List>
        {filteredBooks.length === 0 && <ListItem data-testid="no-books"><ListItemText primary="該当する本がありません" /></ListItem>}
        {filteredBooks.map(book => (
          <ListItem key={book.id} component={Link} to={`/book/${book.id}`}>
            <ListItemText
              primary={<span data-testid={`book-title-${book.id}`}>{book.title || "タイトル未設定"}</span>}
              secondary={
                <span>
                  <span>{book.author || "著者未設定"}</span>
                  <br />
                  <span data-testid={`book-tags-${book.id}`}>{book.tags?.join(", ") || "タグなし"}</span>
                  <br />
                  <span>ステータス: {getStatusText(book.status)}</span>
                </span>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 