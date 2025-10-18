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
import { useFullTextSearch } from '../../hooks/useFullTextSearch';
import { useSearchResultHandler } from '../../hooks/useSearchResultHandler.jsx';
import { FULL_TEXT_SEARCH_CONFIG } from '../../config/fullTextSearchConfig';
import SearchResults from './SearchResults';

/**
 * 全文検索コンポーネント
 * 
 * シンプルな検索UI:
 * - 1つのテキストフィールド
 * - 検索ボタン（Enter押下も可）
 * - キャッシュ機能（自動）
 * - レート制限（自動）
 * - メモ詳細ダイアログ（useSearchResultHandlerで管理）
 * 
 * Phase 3-C: useSearchResultHandlerフックを使用して
 * 標準的なクリックハンドラーとメモダイアログ管理を実装
 */
export default function FullTextSearch() {
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
  
  // useSearchResultHandlerフックを使用（Phase 3-C）
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
  
  const { PLACEHOLDER, DESCRIPTION } = FULL_TEXT_SEARCH_CONFIG;
  
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
      
      {/* メモ詳細ダイアログ（Phase 3-C: useSearchResultHandlerで管理） */}
      <MemoDialog />
    </Box>
  );
}

