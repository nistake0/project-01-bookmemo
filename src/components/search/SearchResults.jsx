import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import BookCard from '../BookCard';
import TabPanel from '../common/TabPanel';

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
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
        flexDirection: 'column'
      }}
      onClick={() => onResultClick?.('memo', memo.bookId, memo.id)}
      data-testid={`memo-result-${memo.id}`}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 書籍タイトルとページ情報 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {memo.bookTitle || 'メモ'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>📖</span>
            <span>ページ: {memo.page || '未設定'}</span>
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
            <Typography variant="body2" color="text.secondary" sx={{ 
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
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              タグ:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {memo.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.75rem',
                    height: '20px'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 作成日時 */}
        {memo.createdAt && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              📅 {new Date(memo.createdAt.toDate()).toLocaleDateString('ja-JP')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

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

      {/* タブ切り替え */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          centered
          data-testid="search-results-tabs"
        >
          <Tab 
            label={`統合 (${results.length})`}
            id="search-results-tab-0"
            aria-controls="search-results-tabpanel-0"
            data-testid="integrated-tab"
          />
          <Tab 
            label={`書籍 (${books.length})`}
            id="search-results-tab-1"
            aria-controls="search-results-tabpanel-1"
            data-testid="books-tab"
          />
          <Tab 
            label={`メモ (${memos.length})`}
            id="search-results-tab-2"
            aria-controls="search-results-tabpanel-2"
            data-testid="memos-tab"
          />
        </Tabs>
      </Box>

      {/* 統合タブ */}
      <TabPanel value={activeTab} index={0} data-testid="integrated-tab-panel">
        <IntegratedResults 
          books={books}
          memos={memos}
          onResultClick={onResultClick}
          renderMemoResult={renderMemoResult}
        />
      </TabPanel>

      {/* 書籍タブ */}
      <TabPanel value={activeTab} index={1} data-testid="books-tab-panel">
        <BookResults 
          books={books}
          onResultClick={onResultClick}
        />
      </TabPanel>

      {/* メモタブ */}
      <TabPanel value={activeTab} index={2} data-testid="memos-tab-panel">
        <MemoResults 
          memos={memos}
          onResultClick={onResultClick}
          renderMemoResult={renderMemoResult}
        />
      </TabPanel>
    </Box>
  );
}

// 統合結果表示コンポーネント
function IntegratedResults({ books, memos, onResultClick, renderMemoResult }) {
  if (books.length === 0 && memos.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          検索結果がありません。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* 本の検索結果 */}
      {books.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            本 ({books.length}件)
          </Typography>
          <Grid container spacing={2} data-testid="integrated-book-results-grid">
            {books.map((book) => (
              <Grid key={book.id} item xs={12} sm={6} md={4} data-testid={`integrated-book-grid-item-${book.id}`}>
                <BookCard 
                  book={book}
                  onClick={() => onResultClick?.('book', book.id)}
                  testId={`integrated-book-result-${book.id}`}
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
          <Grid container spacing={2} data-testid="integrated-memo-results-grid">
            {memos.map((memo) => (
              <Grid key={memo.id} item xs={12} sm={6} md={4} data-testid={`integrated-memo-grid-item-${memo.id}`}>
                {renderMemoResult(memo)}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

// 書籍結果表示コンポーネント
function BookResults({ books, onResultClick }) {
  if (books.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          書籍の検索結果がありません。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        書籍 ({books.length}件)
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
  );
}

// メモ結果表示コンポーネント
function MemoResults({ memos, onResultClick, renderMemoResult }) {
  if (memos.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          メモの検索結果がありません。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
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
  );
}

export default SearchResults; 