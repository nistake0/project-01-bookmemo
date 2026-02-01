import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import {
  getBookStatusLabel,
  getBookStatusColor,
  DEFAULT_BOOK_STATUS,
} from '../constants/bookStatus';
import DecorativeCorner from './common/DecorativeCorner';
import { getBookCardSx, getBookAccent, getBookDecorations } from '../theme/cardStyles';

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
const defaultTypo = {
  cardTitle: { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
  cardSubtext: { fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' } },
  cardCaption: { fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } },
  chipLabel: { fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, height: { xs: 18, sm: 20, md: 22 } },
};

function BookCard({ book, onClick, testId }) {
  const theme = useTheme();
  const typo = theme.custom?.typographyOverrides ?? defaultTypo;
  const coverSize = theme.custom?.sizes?.bookCoverCard ?? { width: { xs: 50, sm: 60 }, height: { xs: 70, sm: 80 } };
  const cardPadding = theme.custom?.spacing?.cardPadding ?? { xs: 1.5, sm: 2 };
  const bookCardSize = theme.custom?.sizes?.bookCard ?? { minHeight: { xs: 140, sm: 160 }, tagAreaMinHeight: { xs: 32, sm: 36 } };
  const cardSx = getBookCardSx(theme, {
    overrides: {
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      minHeight: bookCardSize.minHeight,
    },
  });
  const { key: accentKey } = getBookAccent(theme);
  const decorations = getBookDecorations(theme);

  return (
    <Card 
      sx={cardSx}
      onClick={onClick}
      data-testid={testId || `book-card-${book.id}`}
    >
      {decorations.corners && (
        <>
          <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
          <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
        </>
      )}
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: cardPadding,
        position: 'relative',
        zIndex: 1,
        '&:last-child': { pb: cardPadding }
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
                width: coverSize.width, 
                height: coverSize.height, 
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
                ...typo.cardTitle,
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
                ...typo.cardSubtext,
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
                  fontSize: typo.chipLabel.fontSize,
                  height: typo.chipLabel.height,
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
                  ...typo.cardCaption,
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
              minHeight: bookCardSize.tagAreaMinHeight,
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
                      fontSize: typo.chipLabel.fontSize,
                      height: typo.chipLabel.height,
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
                    ...typo.chipLabel,
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
                ...typo.chipLabel,
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
