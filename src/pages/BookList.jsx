import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthProvider";
import { Typography, Box, Button, Tabs, Tab, TextField, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";

// タグ正規化関数（小文字化＋全角英数字→半角）
function normalizeTag(tag) {
  if (!tag) return '';
  // 全角英数字→半角
  const zenkakuToHankaku = s => s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
  return zenkakuToHankaku(tag).toLowerCase();
}

export default function BookList() {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('reading'); // 初期値を'reading'に変更
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

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
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
    <Box sx={{ 
      maxWidth: 1200, 
      mx: "auto", 
      mt: { xs: 2, sm: 4 }, 
      pb: "56px",
      px: { xs: 2, sm: 0 }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          data-testid="book-list-title"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          本一覧
        </Typography>
        <Button 
          variant="contained" 
          data-testid="book-add-button" 
          onClick={() => navigate("/add")}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          本を追加
        </Button>
      </Box>

      <TextField
        label="検索（タイトル・著者・タグ）"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={filter} onChange={handleFilterChange} centered>
          <Tab label="すべて" value="all" />
          <Tab label="読書中" value="reading" />
          <Tab label="読了" value="finished" />
        </Tabs>
      </Box>

      {filteredBooks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            該当する本がありません
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} data-testid="book-list-grid">
          {filteredBooks.map(book => (
            <Grid 
              key={book.id} 
              item
              xs={12} 
              sm={6} 
              md={4} 
              lg={3}
              data-testid={`book-grid-item-${book.id}`}
            >
              <BookCard 
                book={book}
                onClick={() => handleBookClick(book.id)}
                testId={`book-list-card-${book.id}`}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
} 