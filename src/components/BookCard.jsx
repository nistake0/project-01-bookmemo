import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { 
  getBookStatusLabel,
  getBookStatusColor,
  DEFAULT_BOOK_STATUS
} from '../constants/bookStatus';

/**
 * 書籍カードコンポーネント
 * 検索・タグページと書籍一覧ページで共通使用
 * モバイル最適化対応版
 * 
 * @param {Object} props
 * @param {Object} props.book - 書籍データ
 * @param {Function} props.onClick - クリック時のコールバック
 * @param {string} props.testId - テスト用ID
 */
function BookCard({ book, onClick, testId }) {
  // ステータス表示は定数定義を使用

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: '140px', sm: '160px' }
      }}
      onClick={onClick}
      data-testid={testId || `book-card-${book.id}`}
    >
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: { xs: 1.5, sm: 2 },
        '&:last-child': { pb: { xs: 1.5, sm: 2 } }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: { xs: 1.5, sm: 2 },
          height: '100%'
        }}>
          {book.coverImageUrl && (
            <CardMedia
              component="img"
              sx={{ 
                width: { xs: 50, sm: 60 }, 
                height: { xs: 70, sm: 80 }, 
                objectFit: 'cover',
                flexShrink: 0,
                borderRadius: 1
              }}
              image={book.coverImageUrl}
              alt={book.title}
            />
          )}
          <Box sx={{ 
            flex: 1, 
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                lineHeight: 1.2,
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {book.title || "タイトル未設定"}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {book.author || "著者未設定"}
            </Typography>
            
            {/* ステータスチップ */}
            <Box sx={{ mb: 1 }}>
              <Chip
                label={getBookStatusLabel(book.status || DEFAULT_BOOK_STATUS)}
                color={getBookStatusColor(book.status || DEFAULT_BOOK_STATUS)}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  height: { xs: '18px', sm: '20px', md: '22px' },
                  '& .MuiChip-label': {
                    px: { xs: 0.5, sm: 0.75 }
                  }
                }}
              />
            </Box>
            
            {(book.publisher || book.publishedDate) && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {book.publisher} {book.publisher && book.publishedDate && '•'} {book.publishedDate}
              </Typography>
            )}
            
            {/* タグエリア - 固定高さで統一 */}
            <Box sx={{ 
              minHeight: { xs: '32px', sm: '36px' },
              mb: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5
            }}>
              {book.tags && book.tags.length > 0 ? (
                book.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                      height: { xs: '18px', sm: '20px', md: '22px' },
                      '& .MuiChip-label': {
                        px: { xs: 0.5, sm: 0.75 }
                      }
                    }}
                  />
                ))
              ) : (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    alignSelf: 'center'
                  }}
                >
                  タグなし
                </Typography>
              )}
            </Box>
            
            {/* ステータス - 下部に固定 */}
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 'auto',
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                fontWeight: 500
              }}
            >
              ステータス: {getBookStatusLabel(book.status || DEFAULT_BOOK_STATUS)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default BookCard;
