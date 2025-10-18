import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CachedIcon from '@mui/icons-material/Cached';
import { useNavigate } from 'react-router-dom';
import { useFullTextSearch } from '../../hooks/useFullTextSearch';
import { FULL_TEXT_SEARCH_CONFIG } from '../../config/fullTextSearchConfig';
import SearchResults from './SearchResults';
import MemoEditor from '../MemoEditor';

/**
 * 全文検索コンポーネント
 * 
 * シンプルな検索UI:
 * - 1つのテキストフィールド
 * - 検索ボタン（Enter押下も可）
 * - キャッシュ機能（自動）
 * - レート制限（自動）
 * - メモ詳細ダイアログ（内部管理）
 * 
 * @param {Object} props
 * @param {Function} props.onBookClick - 書籍クリック時のコールバック（省略可）
 * @param {Function} props.onMemoClick - メモクリック時のコールバック（省略可）
 */
export default function FullTextSearch({ onBookClick, onMemoClick }) {
  const navigate = useNavigate();
  
  const {
    searchText,
    error,
    loading,
    results,
    handleSearch,
    handleSearchTextChange,
    clearResults,
    clearCache,
    getCacheStats,
    canSearch
  } = useFullTextSearch();
  
  // メモ詳細ダイアログの状態
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedMemoBookId, setSelectedMemoBookId] = useState(null);
  
  const { PLACEHOLDER, DESCRIPTION } = FULL_TEXT_SEARCH_CONFIG;
  
  // 検索結果クリックハンドラー
  const handleResultClick = (type, bookId, memoId) => {
    if (type === 'book') {
      // 書籍クリック: コールバックがあれば実行、なければ直接遷移
      if (onBookClick) {
        onBookClick(bookId);
      } else {
        navigate(`/book/${bookId}`);
      }
    } else if (type === 'memo') {
      // メモクリック: ダイアログを開く
      const memo = (results || []).find(r => r.type === 'memo' && r.id === memoId);
      if (memo) {
        setSelectedMemo(memo);
        setSelectedMemoBookId(bookId);
        setMemoDialogOpen(true);
      } else {
        // フォールバック: コールバックまたは直接遷移
        if (onMemoClick) {
          onMemoClick(bookId, memoId);
        } else {
          navigate(`/book/${bookId}?memo=${memoId}`);
        }
      }
    }
  };
  
  const handleCloseMemoDialog = () => {
    setMemoDialogOpen(false);
    setSelectedMemo(null);
    setSelectedMemoBookId(null);
  };
  
  // Enterキー押下で検索実行
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canSearch) {
      handleSearch();
    }
  };
  
  // キャッシュ統計
  const cacheStats = getCacheStats();
  
  return (
    <Box data-testid="full-text-search">
      {/* 説明文 */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 2 }}
        data-testid="full-text-search-description"
      >
        {DESCRIPTION}
      </Typography>
      
      {/* 検索フォーム */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="検索キーワード"
          placeholder={PLACEHOLDER}
          value={searchText}
          onChange={(e) => handleSearchTextChange(e.target.value)}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error}
          autoFocus
          disabled={loading}
          data-testid="full-text-search-input"
          InputProps={{
            endAdornment: searchText && (
              <IconButton
                size="small"
                onClick={clearResults}
                data-testid="full-text-search-clear-input"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
        
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!canSearch}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          data-testid="full-text-search-button"
          sx={{ minWidth: 100 }}
        >
          {loading ? '検索中...' : '検索'}
        </Button>
      </Box>
      
      {/* キャッシュ情報 */}
      {cacheStats.totalItems > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            data-testid="full-text-search-cache-info"
          >
            キャッシュ: {cacheStats.validItems}/{cacheStats.maxItems} 件
          </Typography>
          <Tooltip title="キャッシュをクリア">
            <IconButton
              size="small"
              onClick={clearCache}
              data-testid="full-text-search-clear-cache"
            >
              <CachedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      {/* 検索結果 */}
      {!loading && results && results.length > 0 && (
        <Box data-testid="full-text-search-results">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {results.length} 件の結果
          </Typography>
          <SearchResults 
            results={results}
            onResultClick={handleResultClick}
          />
        </Box>
      )}
      
      {/* 結果なしメッセージ */}
      {!loading && results && results.length === 0 && (
        <Alert 
          severity="info" 
          data-testid="full-text-search-no-results"
        >
          検索結果が見つかりませんでした
        </Alert>
      )}
      
      {/* 初期状態メッセージ */}
      {!loading && !results && !error && (
        <Alert 
          severity="info" 
          data-testid="full-text-search-initial"
        >
          キーワードを入力して検索してください
        </Alert>
      )}
      
      {/* メモ詳細ダイアログ */}
      <MemoEditor 
        open={memoDialogOpen}
        memo={selectedMemo}
        bookId={selectedMemoBookId}
        onClose={handleCloseMemoDialog}
        onUpdate={handleCloseMemoDialog}
        onDelete={handleCloseMemoDialog}
      />
    </Box>
  );
}

