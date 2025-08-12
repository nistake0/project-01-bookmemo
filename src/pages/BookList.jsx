import { Typography, Box, Button, Tabs, Tab, TextField, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import { useBookList } from "../hooks/useBookList";

export default function BookList() {
  const navigate = useNavigate();
  const {
    filteredBooks,
    loading,
    error,
    filter,
    searchText,
    handleFilterChange,
    handleSearchChange,
  } = useBookList();

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

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
        onChange={handleSearchChange}
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