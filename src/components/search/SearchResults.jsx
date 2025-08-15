import { Typography, Box, Card, CardContent, Chip, Alert, CircularProgress } from "@mui/material";
import { useAuth } from '../../auth/AuthProvider';
import BookCard from '../BookCard';

/**
 * 検索結果表示コンポーネント（アプローチ2：完全統合検索）
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

  const books = results.filter(result => result.type === 'book');
  const memos = results.filter(result => result.type === 'memo');

  const renderMemoResult = (memo) => (
    <Card 
      key={memo.id} 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: 'purple.300',
        backgroundColor: 'purple.50'
      }}
      onClick={() => onResultClick?.('memo', memo.bookId, memo.id)}
      data-testid={`memo-result-${memo.id}`}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* メモアイコンと書籍タイトル */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>📝</span>
            <span>{memo.bookTitle || 'メモ'} - ページ{memo.page || '未設定'}</span>
          </Typography>
        </Box>

        {/* メモ内容 */}
        {memo.text && (
          <Box sx={{ mb: 2, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ 
              backgroundColor: 'grey.50', 
              p: 1, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              fontStyle: 'italic'
            }}>
              {memo.text.length > 120 ? `${memo.text.substring(0, 120)}...` : memo.text}
            </Typography>
          </Box>
        )}

        {/* コメント */}
        {memo.comment && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ 
              backgroundColor: 'primary.50', 
              p: 1, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              💭 {memo.comment.length > 100 ? `${memo.comment.substring(0, 100)}...` : memo.comment}
            </Typography>
          </Box>
        )}

        {/* タグ */}
        {memo.tags && memo.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {memo.tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 作成日時 */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            作成日: {memo.createdAt ? new Date(memo.createdAt.toDate()).toLocaleDateString('ja-JP') : '不明'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderBookResult = (book) => (
    <Card 
      key={book.id} 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: 'blue.300',
        backgroundColor: 'blue.50'
      }}
      onClick={() => onResultClick?.('book', book.id)}
      data-testid={`book-result-${book.id}`}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 書籍アイコンとタイトル */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>📚</span>
            <span>{book.title}</span>
          </Typography>
        </Box>

        {/* 著者とステータス */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {book.author || '著者不明'}
          </Typography>
          <Chip 
            label={
              book.status === 'reading' ? '読書中' :
              book.status === 'finished' ? '読了' :
              book.status === 'wish' ? '読みたい' : '未設定'
            }
            size="small"
            color={
              book.status === 'reading' ? 'primary' :
              book.status === 'finished' ? 'success' :
              book.status === 'wish' ? 'warning' : 'default'
            }
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>

        {/* タグ */}
        {book.tags && book.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {book.tags.map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 更新日時 */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            更新日: {book.updatedAt ? new Date(book.updatedAt.toDate()).toLocaleDateString('ja-JP') : '不明'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* 検索結果統計 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>検索結果 ({results.length}件)</Typography>
        <Typography variant="body2" color="text.secondary">📚 書籍: {books.length}件, 📝 メモ: {memos.length}件</Typography>
      </Box>

      {/* 統合検索結果 */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
        gap: 2
      }}>
        {results.map((result) => (
          <Box key={`${result.type}-${result.id}`}>
            {result.type === 'book' ? renderBookResult(result) : renderMemoResult(result)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default SearchResults; 