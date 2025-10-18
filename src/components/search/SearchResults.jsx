import PropTypes from 'prop-types';
import { Typography, Box, Card, CardContent, Chip, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import BookCard from '../BookCard';
import { 
  getBookStatusLabel,
  getBookStatusColor
} from '../../constants/bookStatus';

/**
 * SearchResults - 検索結果表示コンポーネント
 * 
 * 書籍とメモの検索結果を統一的に表示します。
 * 各結果はクリック可能で、onResultClickコールバックを呼び出します。
 * 
 * @param {Object} props
 * @param {Array} props.results - 検索結果の配列（必須）
 *   - 各要素は { id, type, ... } の形式
 *   - type は 'book' または 'memo'
 *   - 書籍: { id, type: 'book', title, author, status, tags, updatedAt }
 *   - メモ: { id, type: 'memo', bookId, bookTitle, text, comment, page, tags, createdAt }
 * @param {boolean} props.loading - 読み込み中かどうか（デフォルト: false）
 * @param {string} props.searchQuery - 検索クエリ文字列（デフォルト: ''）
 * @param {Function} props.onResultClick - 結果クリック時のコールバック（必須）
 *   - 型: (type: 'book' | 'memo', bookId: string, memoId?: string) => void
 *   - typeが'book'の場合、memoIdは不要
 *   - typeが'memo'の場合、memoIdは必須
 *   - 提供されない場合、デフォルト動作（navigate）が実行される
 *   - 開発環境では警告が表示される
 * 
 * @example
 * // 推奨: useSearchResultHandlerフックを使用
 * import { useSearchResultHandler } from '../../hooks/useSearchResultHandler';
 * 
 * function MySearchPage() {
 *   const { results } = useSearch();
 *   const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
 *   
 *   return (
 *     <>
 *       <SearchResults 
 *         results={results}
 *         loading={false}
 *         onResultClick={handleResultClick}
 *       />
 *       <MemoDialog />
 *     </>
 *   );
 * }
 * 
 * @example
 * // カスタムハンドラーを使用する場合
 * <SearchResults 
 *   results={results}
 *   loading={false}
 *   onResultClick={(type, bookId, memoId) => {
 *     if (type === 'book') navigate(`/book/${bookId}`);
 *     else openCustomMemoDialog(bookId, memoId);
 *   }}
 * />
 */
function SearchResults({ results = [], loading = false, searchQuery = '', onResultClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // デフォルトのクリックハンドラー (Phase 3-A)
  const defaultOnResultClick = (type, bookId, memoId) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[SearchResults] onResultClick not provided, using default navigation behavior. ' +
        'Consider providing a custom handler for better control.'
      );
    }
    
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else if (type === 'memo') {
      // メモの場合は、書籍詳細 + クエリパラメータ
      navigate(`/book/${bookId}?memo=${memoId}`);
    }
  };
  
  // onResultClickが提供されていればそれを使い、なければデフォルトを使う
  const handleResultClick = onResultClick || defaultOnResultClick;

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
      onClick={() => handleResultClick('memo', memo.bookId, memo.id)}
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
            作成日: {memo.createdAt 
              ? (typeof memo.createdAt.toDate === 'function' 
                  ? new Date(memo.createdAt.toDate()).toLocaleDateString('ja-JP')
                  : new Date(memo.createdAt).toLocaleDateString('ja-JP'))
              : '不明'}
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
      onClick={() => handleResultClick('book', book.id)}
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
            label={getBookStatusLabel(book.status)}
            size="small"
            color={getBookStatusColor(book.status)}
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
            更新日: {book.updatedAt 
              ? (typeof book.updatedAt.toDate === 'function' 
                  ? new Date(book.updatedAt.toDate()).toLocaleDateString('ja-JP')
                  : new Date(book.updatedAt).toLocaleDateString('ja-JP'))
              : '不明'}
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

// PropTypes定義（Phase 5: 最終版）
SearchResults.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['book', 'memo']).isRequired,
      // 書籍の場合
      title: PropTypes.string,
      author: PropTypes.string,
      status: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      updatedAt: PropTypes.oneOfType([
        PropTypes.object,  // Firebase Timestamp
        PropTypes.string,  // Serialized date
        PropTypes.instanceOf(Date)
      ]),
      // メモの場合
      bookId: PropTypes.string,
      bookTitle: PropTypes.string,
      text: PropTypes.string,
      comment: PropTypes.string,
      page: PropTypes.number,
      createdAt: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
        PropTypes.instanceOf(Date)
      ])
    })
  ),
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func.isRequired  // Phase 5: 厳しく - 必須
};

// デフォルト props（onResultClickは必須なので含まない）
SearchResults.defaultProps = {
  results: [],
  loading: false,
  searchQuery: ''
};

export default SearchResults; 