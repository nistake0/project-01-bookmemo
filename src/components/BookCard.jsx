import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia,
  Typography,
  Chip,
  Box
} from '@mui/material';

/**
 * 書籍カードコンポーネント
 * 検索・タグページと書籍一覧ページで共通使用
 * 
 * @param {Object} props
 * @param {Object} props.book - 書籍データ
 * @param {Function} props.onClick - クリック時のコールバック
 * @param {string} props.testId - テスト用ID
 */
function BookCard({ book, onClick, testId }) {
  const getStatusText = (status) => {
    switch (status) {
      case 'reading':
        return '読書中';
      case 'finished':
        return '読了';
      default:
        return '読書中';
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
      data-testid={testId || `book-card-${book.id}`}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {book.coverImageUrl && (
            <CardMedia
              component="img"
              sx={{ 
                width: 60, 
                height: 80, 
                objectFit: 'cover',
                flexShrink: 0
              }}
              image={book.coverImageUrl}
              alt={book.title}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.2
              }}
            >
              {book.title || "タイトル未設定"}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
            >
              {book.author || "著者未設定"}
            </Typography>
            {(book.publisher || book.publishedDate) && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
              >
                {book.publisher} {book.publisher && book.publishedDate && '•'} {book.publishedDate}
              </Typography>
            )}
            <Box sx={{ mt: 1, mb: 1 }}>
              {book.tags && book.tags.length > 0 ? (
                book.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mr: 0.5, 
                      mb: 0.5,
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      height: { xs: '20px', sm: '24px' }
                    }}
                  />
                ))
              ) : (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                >
                  タグなし
                </Typography>
              )}
            </Box>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 'auto',
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            >
              ステータス: {getStatusText(book.status)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default BookCard;
