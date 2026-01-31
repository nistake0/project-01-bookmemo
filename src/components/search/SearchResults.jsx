import PropTypes from 'prop-types';
import { Typography, Box, Card, CardContent, Chip, Alert, Paper, useTheme } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import BookCard from '../BookCard';
import LoadingIndicator from '../common/LoadingIndicator';
import DecorativeCorner from '../common/DecorativeCorner';
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
const FALLBACK_BROWN = { light: 'rgba(139, 69, 19, 0.2)', lighter: 'rgba(139, 69, 19, 0.1)', borderHover: 'rgba(139, 69, 19, 0.3)' };
const FALLBACK_MEMO = { light: 'rgba(123, 104, 238, 0.25)', lighter: 'rgba(123, 104, 238, 0.12)', borderHover: 'rgba(123, 104, 238, 0.4)' };

function SearchResults({ results = [], loading = false, searchQuery = '', onResultClick }) {
  const theme = useTheme();
  const accentKey = theme.custom?.cardAccent || 'brown';
  const bookAccent = theme.palette?.decorative?.[accentKey] || FALLBACK_BROWN;
  const memoAccent = theme.palette?.decorative?.memo || FALLBACK_MEMO;
  const decorations = theme.custom?.cardDecorations ?? { corners: true, innerBorder: true, centerLine: true };
  const glass = theme.custom?.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };

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
      <LoadingIndicator
        variant="inline"
        message="検索中..."
        data-testid="search-results-loading"
      />
    );
  }

  if (!results || results.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" data-testid="search-results-empty-message">
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
        backdropFilter: `blur(${glass.blur}) saturate(${glass.saturate})`,
        border: `2px solid ${memoAccent.light}`,
        borderRadius: 2,
        boxShadow: `
          0 6px 24px rgba(0, 0, 0, 0.1),
          0 2px 8px rgba(123, 104, 238, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.6)
        `,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `
            0 10px 32px rgba(0, 0, 0, 0.12),
            0 4px 12px rgba(123, 104, 238, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.65)
          `,
          borderColor: memoAccent.borderHover || memoAccent.light,
        },
        ...(decorations.innerBorder && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            border: `1px solid ${memoAccent.lighter}`,
            borderRadius: 1.5,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }),
      }}
      onClick={() => handleResultClick('memo', memo.bookId, memo.id)}
      data-testid={`memo-result-${memo.id}`}
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
      }}>
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
        backdropFilter: `blur(${glass.blur}) saturate(${glass.saturate})`,
        border: `2px solid ${bookAccent.light}`,
        borderRadius: 3,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.12),
          0 2px 8px rgba(0, 0, 0, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.5)
        `,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.16),
            0 4px 12px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `,
          borderColor: bookAccent.borderHover || bookAccent.light,
        },
        ...(decorations.innerBorder && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            border: `1px solid ${bookAccent.lighter}`,
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }),
        ...(decorations.centerLine && {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 1,
            height: '100%',
            background: `linear-gradient(to bottom, transparent, ${bookAccent.lighter}, transparent)`,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }),
      }}
      onClick={() => handleResultClick('book', book.id)}
      data-testid={`book-result-${book.id}`}
    >
      {decorations.corners && (
        <>
          <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
          <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
        </>
      )}
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
      }}>
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
      {/* 検索結果統計（背景画像対策でPaperで囲む） */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>検索結果 ({results.length}件)</Typography>
        <Typography variant="body2" color="text.secondary">📚 書籍: {books.length}件, 📝 メモ: {memos.length}件</Typography>
      </Paper>

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