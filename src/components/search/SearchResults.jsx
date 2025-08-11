import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import BookCard from '../BookCard';

/**
 * 検索結果表示コンポーネント
 * 
 * @param {Object} props
 * @param {Array} props.results - 検索結果の配列
 * @param {boolean} props.loading - 読み込み中かどうか
 * @param {string} props.searchQuery - 検索クエリ
 * @param {Function} props.onResultClick - 結果クリック時のコールバック
 */
function SearchResults({ results = [], loading = false, searchQuery = '', onResultClick }) {
  const { user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          {searchQuery 
            ? `「${searchQuery}」に一致する結果が見つかりませんでした。`
            : '検索条件を設定して検索を実行してください。'
          }
        </Alert>
      </Box>
    );
  }

  const renderMemoResult = (memo) => (
    <Card 
      key={memo.id} 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => onResultClick?.('memo', memo.bookId, memo.id)}
      data-testid={`memo-result-${memo.id}`}
    >
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {memo.bookTitle || 'メモ'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ページ: {memo.page}
        </Typography>
        {memo.text && (
          <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
            {memo.text.length > 100 ? `${memo.text.substring(0, 100)}...` : memo.text}
          </Typography>
        )}
        {memo.comment && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {memo.comment.length > 150 ? `${memo.comment.substring(0, 150)}...` : memo.comment}
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          {memo.tags && memo.tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const books = results.filter(result => result.type === 'book');
  const memos = results.filter(result => result.type === 'memo');

  return (
    <Box>
      {/* 検索結果統計 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          検索結果 ({results.length}件)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          本: {books.length}件, メモ: {memos.length}件
        </Typography>
      </Box>

      {/* 本の検索結果 */}
      {books.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            本 ({books.length}件)
          </Typography>
          <Grid container spacing={2} data-testid="book-results-grid">
            {books.map((book) => (
              <Grid key={book.id} item xs={12} sm={6} md={4} data-testid={`book-grid-item-${book.id}`}>
                <BookCard 
                  book={book}
                  onClick={() => onResultClick?.('book', book.id)}
                  testId={`book-result-${book.id}`}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* メモの検索結果 */}
      {memos.length > 0 && (
        <Box>
          {books.length > 0 && <Divider sx={{ my: 3 }} />}
          <Typography variant="h6" gutterBottom>
            メモ ({memos.length}件)
          </Typography>
          <Grid container spacing={2} data-testid="memo-results-grid">
            {memos.map((memo) => (
              <Grid key={memo.id} item xs={12} sm={6} md={4} data-testid={`memo-grid-item-${memo.id}`}>
                {renderMemoResult(memo)}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default SearchResults; 