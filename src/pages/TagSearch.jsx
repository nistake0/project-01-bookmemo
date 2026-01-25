import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Alert
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import TabPanel from '../components/common/TabPanel';
import PageHeader from '../components/common/PageHeader';
import TagList from '../components/tags/TagList';
import TagStats from '../components/tags/TagStats';
import AdvancedSearchForm from '../components/search/AdvancedSearchForm';
import SearchResults from '../components/search/SearchResults';
import FullTextSearch from '../components/search/FullTextSearch';
import { useSearch } from '../hooks/useSearch';
import { useSearchResultHandler } from '../hooks/useSearchResultHandler.jsx';

export default function TagSearch() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  
  // 検索条件を親コンポーネントで管理（タブ間で共有）
  const [searchConditions, setSearchConditions] = useState({
    text: '',
    status: 'all',
    dateRange: { type: 'none' },
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const { results, loading, error, executeSearch, clearResults, setResults } = useSearch();

  // useSearchResultHandlerフックを使用（Phase 3-C）
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);

  // Phase 3対応: location.stateから検索状態を復元
  useEffect(() => {
    const restoreSearchState = location.state?.restoreSearch;
    if (restoreSearchState?.results) {
      console.log('[TagSearch] Restoring search state:', restoreSearchState);
      // 検索結果を復元
      setResults(restoreSearchState.results);
    }
  }, [location.state, setResults]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchConditionsChange = (newConditions) => {
    setSearchConditions(newConditions);
  };

  const handleSearch = (conditions) => {
    console.log('検索実行:', conditions);
    executeSearch(conditions);
  };

  const handleClearSearch = () => {
    clearResults();
    setSearchConditions({
      text: '',
      status: 'all',
      dateRange: { type: 'none' },
      selectedTags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  // タグクリック時の処理
  const handleTagClick = (tag) => {
    console.log('タグがクリックされました:', tag);
    
    // 検索条件を更新（選択されたタグを設定）
    const newSearchConditions = {
      ...searchConditions,
      selectedTags: [tag], // クリックされたタグを選択
      text: '' // テキスト検索はクリア
    };
    
    setSearchConditions(newSearchConditions);
    
    // 詳細検索タブに切り替え（index 1）
    setActiveTab(1);
    
    // 検索を実行
    executeSearch(newSearchConditions);
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
        <Typography variant="h6" color="error">
          ログインが必要です
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mb: 4, pb: "56px" }}>
      {/* 統一されたヘッダー */}
      <PageHeader 
        title="検索・タグ"
        subtitle="高度な検索とタグ管理"
      />
      
      {/* メインコンテンツ */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 0 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, position: 'sticky', top: 0, zIndex: 1100, backgroundColor: 'background.paper' }} data-testid="tag-search-tabs-container" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            data-testid="tag-search-tabs"
          >
            <Tab 
              label="全文検索" 
              id="tag-search-tab-0"
              aria-controls="tag-search-tabpanel-0"
              data-testid="full-text-search-tab"
            />
            <Tab 
              label="詳細検索" 
              id="tag-search-tab-1"
              aria-controls="tag-search-tabpanel-1"
              data-testid="advanced-search-tab"
            />
            <Tab 
              label="タグ管理" 
              id="tag-search-tab-2"
              aria-controls="tag-search-tabpanel-2"
              data-testid="tag-management-tab"
            />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0} data-testid="full-text-search-tab-panel">
          <FullTextSearchTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1} data-testid="advanced-search-tab-panel">
          <AdvancedSearchTab 
            searchConditions={searchConditions}
            onSearchConditionsChange={handleSearchConditionsChange}
            onSearch={handleSearch}
            results={results}
            loading={loading}
            error={error}
            onResultClick={handleResultClick}
            onClearSearch={handleClearSearch}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2} data-testid="tag-management-tab-panel">
          <TagManagementTab onTagClick={handleTagClick} />
        </TabPanel>

        {/* メモ詳細ダイアログ（Phase 3-C: useSearchResultHandlerで管理） */}
        <MemoDialog />
      </Box>
    </Box>
  );
}

// 全文検索タブのコンテンツ
function FullTextSearchTab() {
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>全文検索</Typography>
        <Typography variant="body2" color="text.secondary">
          シンプルな検索で書籍・メモを素早く見つけられます。
        </Typography>
      </Paper>
      
      {/* FullTextSearchコンポーネントが自己完結（メモダイアログも内部管理） */}
      <FullTextSearch />
    </Box>
  );
}

// 詳細検索タブのコンテンツ
function AdvancedSearchTab({ 
  searchConditions, 
  onSearchConditionsChange, 
  onSearch, 
  results, 
  loading, 
  error, 
  onResultClick, 
  onClearSearch 
}) {
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>詳細検索</Typography>
        <Typography variant="body2" color="text.secondary">
          タイトル・著者・タグ・メモ内容・日付などで詳細に絞り込みできます。
        </Typography>
      </Paper>
      
      <AdvancedSearchForm
        searchConditions={searchConditions}
        onSearchConditionsChange={onSearchConditionsChange}
        onSearch={onSearch}
      />

      {/* エラー表示 */}
      {error && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* 検索結果表示 */}
      {(results.length > 0 || loading) && (
        <Box sx={{ mt: 4 }}>
          <SearchResults
            results={results}
            loading={loading}
            searchQuery={searchConditions.text}
            onResultClick={onResultClick}
          />
        </Box>
      )}

      {/* 検索結果がある場合のクリアボタン */}
      {results.length > 0 && !loading && (
        <Paper sx={{ p: 1.5, mt: 2, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={onClearSearch}
          >
            検索結果をクリア
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

// タグ管理タブのコンテンツ
function TagManagementTab({ onTagClick }) {
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>タグ管理</Typography>
        <Typography variant="body2" color="text.secondary">
          統計を確認し、タグクリックで検索できます。
        </Typography>
      </Paper>
      
      <TagStats onTagClick={onTagClick} />
    </Box>
  );
} 