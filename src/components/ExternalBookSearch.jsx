import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import { useExternalBookSearch } from '../hooks/useExternalBookSearch';
import { useBookDuplicateCheck } from '../hooks/useBookDuplicateCheck';
import { getBookCardSx } from '../theme/cardStyles';

/**
 * 外部書籍検索コンポーネント
 * Google Books APIとOpenBD APIを使用して書籍を検索・選択
 */
const ExternalBookSearch = ({ onBookSelect, onCancel }) => {
  const theme = useTheme();
  const bookCardSx = getBookCardSx(theme, {
    overrides: { mb: 2, cursor: 'pointer' },
  });
  const [searchType, setSearchType] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showHistory, setShowHistory] = useState(false); // 履歴表示状態
  const [duplicateCheckResults, setDuplicateCheckResults] = useState({}); // 重複チェック結果
  
  const {
    searchResults,
    filteredResults,
    loading,
    loadingStep,
    error,
    searchBooks,
    clearSearchResults,
    clearError,
    // 検索履歴関連
    searchHistory,
    loadSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    // フィルタリング関連
    filters,
    updateFilters,
    clearFilters
  } = useExternalBookSearch();

  const { checkDuplicate } = useBookDuplicateCheck();

  /**
   * 検索タイプの変更ハンドラー
   */
  const handleSearchTypeChange = useCallback((event, newSearchType) => {
    if (newSearchType !== null) {
      setSearchType(newSearchType);
      // 検索タイプ変更時は結果をクリア
      clearSearchResults();
    }
  }, [clearSearchResults]);

  /**
   * 検索クエリの変更ハンドラー
   */
  const handleSearchQueryChange = useCallback((event) => {
    setSearchQuery(event.target.value);
    // エラーがある場合はクリア
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  /**
   * 検索実行ハンドラー
   */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    // 重複チェック結果をリセット
    setDuplicateCheckResults({});
    
    await searchBooks(searchQuery.trim(), searchType);
  }, [searchQuery, searchType, searchBooks]);

  /**
   * 検索結果の重複チェック
   */
  const checkSearchResultsDuplicates = useCallback(async (results) => {
    if (!results || results.length === 0) return;

    const duplicateResults = {};
    
    // 各検索結果に対して重複チェックを実行
    for (const book of results) {
      if (book.isbn) {
        try {
          const duplicateBook = await checkDuplicate(book.isbn);
          if (duplicateBook) {
            duplicateResults[book.id] = duplicateBook;
          }
        } catch (error) {
          console.error('Error checking duplicate for book:', book.title, error);
        }
      }
    }
    
    setDuplicateCheckResults(duplicateResults);
  }, [checkDuplicate]);

  /**
   * 書籍選択ハンドラー
   */
  const handleBookSelect = useCallback((book) => {
    // 重複チェック結果をクリア
    setDuplicateCheckResults({});
    onBookSelect(book);
  }, [onBookSelect]);

  /**
   * キャンセルハンドラー
   */
  const handleCancel = useCallback(() => {
    clearSearchResults();
    setSearchQuery('');
    setDuplicateCheckResults({});
    onCancel();
  }, [clearSearchResults, onCancel]);

  /**
   * 履歴から検索を実行
   */
  const handleHistorySearch = useCallback((query, type) => {
    setSearchQuery(query);
    setSearchType(type);
    setShowHistory(false);
    setDuplicateCheckResults({});
    searchBooks(query, type);
  }, [searchBooks]);

  /**
   * 履歴項目の削除
   */
  const handleRemoveHistoryItem = useCallback((index) => {
    removeFromSearchHistory(index);
  }, [removeFromSearchHistory]);

  /**
   * 履歴のクリア
   */
  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
  }, [clearSearchHistory]);

  /**
   * 履歴表示の切り替え
   */
  const handleToggleHistory = useCallback(() => {
    if (!showHistory) {
      loadSearchHistory();
    }
    setShowHistory(!showHistory);
  }, [showHistory, loadSearchHistory]);

  /**
   * 検索結果の並び替え
   */
  const sortResults = useCallback((results) => {
    if (!results || results.length === 0) return results;
    
    const sortedResults = [...results];
    
    switch (sortBy) {
      case 'title':
        return sortedResults.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
      case 'author':
        return sortedResults.sort((a, b) => a.author.localeCompare(b.author, 'ja'));
      case 'date':
        return sortedResults.sort((a, b) => {
          const dateA = new Date(a.publishedDate || '1900-01-01');
          const dateB = new Date(b.publishedDate || '1900-01-01');
          return dateB - dateA; // 新しい順
        });
      case 'relevance':
      default:
        return sortedResults.sort((a, b) => b.confidence - a.confidence);
    }
  }, [sortBy]);

  // 検索結果が取得されたら重複チェックを実行
  React.useEffect(() => {
    if (filteredResults && filteredResults.length > 0 && !loading) {
      checkSearchResultsDuplicates(filteredResults);
    }
  }, [filteredResults, loading]);

  /**
   * 検索結果のレンダリング
   */
  const renderSearchResults = () => {

    if (loading) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 2, 
            color: 'primary.main',
            fontWeight: 'bold',
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            {loadingStep || '検索中...'}
          </Typography>
          {[...Array(3)].map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={60} height={80} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              再試行
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            「{searchQuery}」に一致する結果が見つかりませんでした。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            別のキーワードをお試しください。
          </Typography>
        </Box>
      );
    }

    if (searchResults.length === 0) {
      return (
        <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            検索キーワードを入力して検索を実行してください。
          </Typography>
          {searchHistory && searchHistory.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleToggleHistory}
                size="small"
              >
                検索履歴を表示
              </Button>
            </Box>
          )}
        </Box>
      );
    }

    const sortedResults = sortResults(filteredResults || []);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography variant="subtitle2" sx={{ 
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            検索結果 ({searchResults.length}件)
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>並び替え</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="並び替え"
            >
              <MenuItem value="relevance">関連度順</MenuItem>
              <MenuItem value="title">タイトル順</MenuItem>
              <MenuItem value="author">著者順</MenuItem>
              <MenuItem value="date">出版日順</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {sortedResults.map((book) => (
          <Card 
            key={book.id} 
            sx={bookCardSx}
            onClick={() => handleBookSelect(book)}
            data-testid={`search-result-${book.id}`}
          >
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* 表紙画像 */}
                <Box sx={{ flexShrink: 0 }}>
                  {book.coverImageUrl ? (
                    <CardMedia
                      component="img"
                      image={book.coverImageUrl}
                      alt={book.title}
                      sx={{
                        width: 60,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 80,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        表紙なし
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* 書籍情報 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    {book.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 0.5
                    }}
                  >
                    {book.author}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 1
                    }}
                  >
                    {book.publisher}
                    {book.publishedDate && ` - ${book.publishedDate}`}
                  </Typography>

                  {/* タグ表示 */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    flexWrap: 'wrap',
                    mb: { xs: 1, sm: 1.5 }
                  }}>
                    <Chip 
                      label={book.source === 'google' ? 'Google Books' : 'OpenBD'} 
                      size="small" 
                      color={book.source === 'google' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                    />
                    {book.isbn && (
                      <Chip 
                        label={`ISBN: ${book.isbn}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                      />
                    )}
                  </Box>
                </Box>

                {/* 選択ボタン */}
                <Box sx={{ 
                  flexShrink: 0, 
                  alignSelf: 'center',
                  mt: { xs: 1, sm: 0 }
                }}>
                  {duplicateCheckResults[book.id] ? (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled
                      data-testid={`duplicate-book-${book.id}`}
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                        minWidth: { xs: '100%', sm: 'auto' },
                        color: 'text.secondary',
                        borderColor: 'text.secondary'
                      }}
                    >
                      追加済み
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookSelect(book);
                      }}
                      data-testid={`select-book-${book.id}`}
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                        minWidth: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      選択
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  /**
   * フィルタリングUIコンポーネント
   */
  const renderFilters = () => {
    if (searchResults.length === 0) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="subtitle2" color="text.secondary">
            フィルター
          </Typography>
          <Button
            size="small"
            onClick={clearFilters}
            disabled={!filters?.author && !filters?.publisher && !filters?.yearFrom && !filters?.yearTo}
          >
            クリア
          </Button>
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 2
        }}>
          <TextField
            label="著者"
            value={filters?.author || ''}
            onChange={(e) => updateFilters({ author: e.target.value })}
            size="small"
            placeholder="著者名で絞り込み"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          />
          <TextField
            label="出版社"
            value={filters?.publisher || ''}
            onChange={(e) => updateFilters({ publisher: e.target.value })}
            size="small"
            placeholder="出版社で絞り込み"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          />
          <TextField
            label="出版年（開始）"
            type="number"
            value={filters?.yearFrom || ''}
            onChange={(e) => updateFilters({ yearFrom: e.target.value })}
            size="small"
            placeholder="例: 2020"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          />
          <TextField
            label="出版年（終了）"
            type="number"
            value={filters?.yearTo || ''}
            onChange={(e) => updateFilters({ yearTo: e.target.value })}
            size="small"
            placeholder="例: 2024"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {filteredResults?.length || 0}件の結果（全{searchResults?.length || 0}件中）
        </Typography>
      </Box>
    );
  };

  /**
   * 検索履歴表示コンポーネント
   */
  const renderSearchHistory = () => {
    if (!showHistory || !searchHistory || searchHistory.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1
        }}>
          <Typography variant="subtitle2" color="text.secondary">
            検索履歴
          </Typography>
          <Box>
            <Button
              size="small"
              onClick={handleClearHistory}
              startIcon={<ClearIcon />}
              sx={{ mr: 1 }}
            >
              クリア
            </Button>
            <Button
              size="small"
              onClick={() => setShowHistory(false)}
            >
              閉じる
            </Button>
          </Box>
        </Box>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {searchHistory.map((entry, index) => (
            <ListItem
              key={`${entry.query}-${entry.timestamp}`}
              sx={{ px: 1 }}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveHistoryItem(index)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                onClick={() => handleHistorySearch(entry.query, entry.searchType)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={entry.query}
                  secondary={`${entry.searchType === 'title' ? 'タイトル' : 
                            entry.searchType === 'author' ? '著者' : '出版社'}検索`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 }, 
      border: 1, 
      borderColor: 'primary.main', 
      borderRadius: 1,
      bgcolor: 'primary.50',
      mt: { xs: 1.5, sm: 2 },
      // レスポンシブ対応: モバイルでの表示最適化
      maxWidth: '100%',
      overflow: 'hidden'
    }} data-testid="external-book-search">
      <Typography variant="h6" sx={{ 
        mb: { xs: 1.5, sm: 2 }, 
        fontSize: { xs: '1rem', sm: '1.25rem' } 
      }}>
        🔍 外部検索モード
      </Typography>
      
      {/* 検索タイプ選択 */}
      <Box sx={{ 
        mb: { xs: 1.5, sm: 2 }, 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <ToggleButtonGroup
          value={searchType}
          exclusive
          onChange={handleSearchTypeChange}
          aria-label="search type"
          size="small"
        >
          <ToggleButton value="title" aria-label="title" data-testid="search-type-title">タイトル</ToggleButton>
          <ToggleButton value="author" aria-label="author" data-testid="search-type-author">著者</ToggleButton>
          <ToggleButton value="publisher" aria-label="publisher" data-testid="search-type-publisher">出版社</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 検索入力 */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 0.5, sm: 1 }, 
        mb: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <TextField
          fullWidth
          placeholder={`${searchType === 'title' ? 'タイトル' : searchType === 'author' ? '著者名' : '出版社名'}を入力`}
          value={searchQuery}
          onChange={handleSearchQueryChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          data-testid="search-query-input"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!searchQuery.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
          data-testid="search-button"
          sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            minWidth: { xs: '100%', sm: 'auto' }
          }}
        >
          {loading ? '検索中...' : '検索'}
        </Button>
      </Box>

      {/* 検索履歴 */}
      {renderSearchHistory()}

      {/* フィルタリング */}
      {renderFilters()}

      {/* 検索結果 */}
      {renderSearchResults()}

      {/* キャンセルボタン */}
      <Box sx={{ 
        mt: { xs: 2, sm: 3 }, 
        textAlign: 'right' 
      }}>
        <Button 
          onClick={handleCancel}
          data-testid="cancel-button"
          sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          ← ISBN検索に戻る
        </Button>
      </Box>
    </Box>
  );
};

export default ExternalBookSearch;
