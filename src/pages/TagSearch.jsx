import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Alert
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import TabPanel from '../components/common/TabPanel';
import TagList from '../components/tags/TagList';
import TagStats from '../components/tags/TagStats';
import AdvancedSearchForm from '../components/search/AdvancedSearchForm';
import SearchResults from '../components/search/SearchResults';
import { useSearch } from '../hooks/useSearch';
import { useNavigate } from 'react-router-dom';

export default function TagSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  
  // 検索条件を親コンポーネントで管理（タブ間で共有）
  const [searchConditions, setSearchConditions] = useState({
    text: '',
    status: 'all',
    dateRange: { type: 'none' },
    memoContent: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const { results, loading, error, executeSearch, clearResults } = useSearch();

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

  const handleResultClick = (type, bookId, memoId) => {
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else if (type === 'memo') {
      navigate(`/book/${bookId}?memo=${memoId}`);
    }
  };

  const handleClearSearch = () => {
    clearResults();
    setSearchConditions({
      text: '',
      status: 'all',
      dateRange: { type: 'none' },
      memoContent: '',
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
      text: '', // テキスト検索はクリア
      memoContent: '' // メモ内容検索もクリア
    };
    
    setSearchConditions(newSearchConditions);
    
    // 検索タブに切り替え
    setActiveTab(0);
    
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
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4, pb: "56px" }}>
      <Typography variant="h4" gutterBottom data-testid="tag-search-title">
        検索・タグ
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          centered
          data-testid="tag-search-tabs"
        >
          <Tab 
            label="高度な検索" 
            id="tag-search-tab-0"
            aria-controls="tag-search-tabpanel-0"
            data-testid="search-tab"
          />
          <Tab 
            label="タグ管理" 
            id="tag-search-tab-1"
            aria-controls="tag-search-tabpanel-1"
            data-testid="tag-management-tab"
          />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0} data-testid="search-tab-panel">
        <SearchTab 
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
      
      <TabPanel value={activeTab} index={1} data-testid="tag-management-tab-panel">
        <TagManagementTab onTagClick={handleTagClick} />
      </TabPanel>
    </Box>
  );
}

// 検索タブのコンテンツ
function SearchTab({ 
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
      <Typography variant="h5" gutterBottom>高度な検索</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        複数条件での絞り込み検索ができます。本のタイトル・著者・タグ、メモ内容などで検索できます。
      </Typography>
      
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
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={onClearSearch}
          >
            検索結果をクリア
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// タグ管理タブのコンテンツ
function TagManagementTab({ onTagClick }) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>タグ管理</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        タグの統計情報を確認し、タグをクリックして検索を実行できます。
      </Typography>
      
      <TagStats onTagClick={onTagClick} />
    </Box>
  );
} 