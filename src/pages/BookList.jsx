import { Typography, Box, Tabs, Tab, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import PageHeader from "../components/common/PageHeader";
import { useBookList } from "../hooks/useBookList";
import { FILTER_STATUSES, FILTER_LABELS } from "../constants/bookStatus";

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
      pb: { xs: "72px", sm: "80px" }
    }}>
      {/* 統一されたヘッダー */}
      <PageHeader 
        title="本一覧"
        subtitle="あなたの読書ライブラリ"
        data-testid="book-list-header"
      />
      
      {/* メインコンテンツ */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 0 } }}>


        {/* 検索フィールド */}
        <TextField
          label="検索（タイトル・著者・タグ）"
          value={searchText}
          onChange={handleSearchChange}
          fullWidth
          size="small"
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            '& .MuiOutlinedInput-root': {
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }
          }}
        />

        {/* タブナビゲーション */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: { xs: 1.5, sm: 2 },
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backgroundColor: 'background.paper'
        }} data-testid="book-list-tabs-container" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
          <Tabs 
            value={filter} 
            onChange={handleFilterChange} 
            variant={{ xs: "scrollable", sm: "standard" }}
            scrollButtons="auto"
            allowScrollButtonsMobile
            centered={{ sm: true }}
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                minHeight: { xs: '40px', sm: '48px' },
                minWidth: { xs: '60px', sm: 'auto' },
                px: { xs: 1, sm: 2 }
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab label={FILTER_LABELS[FILTER_STATUSES.ALL]} value={FILTER_STATUSES.ALL} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.TSUNDOKU]} value={FILTER_STATUSES.TSUNDOKU} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.READING]} value={FILTER_STATUSES.READING} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.SUSPENDED]} value={FILTER_STATUSES.SUSPENDED} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.RE_READING]} value={FILTER_STATUSES.RE_READING} />
            <Tab label={FILTER_LABELS[FILTER_STATUSES.FINISHED]} value={FILTER_STATUSES.FINISHED} />
          </Tabs>
        </Box>

        {/* 書籍一覧 */}
        {filteredBooks.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 3, sm: 4 },
            px: { xs: 2, sm: 0 }
          }}>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              該当する本がありません
            </Typography>
          </Box>
        ) : (
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: { xs: 1.5, sm: 2 },
              dataTestid: 'book-list-grid'
            }}
            data-testid="book-list-grid"
          >
            {filteredBooks.map(book => (
              <Box 
                key={book.id} 
                data-testid={`book-grid-item-${book.id}`}
              >
                <BookCard 
                  book={book}
                  onClick={() => handleBookClick(book.id)}
                  testId={`book-list-card-${book.id}`}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
} 