import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper 
} from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import TabPanel from '../components/common/TabPanel';
import TagList from '../components/tags/TagList';
import AdvancedSearchForm from '../components/search/AdvancedSearchForm';

// 検索タブのコンテンツ
function SearchTab() {
  const [searchConditions, setSearchConditions] = useState({
    text: '',
    status: 'all',
    dateRange: { type: 'none' },
    memoContent: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const handleSearchConditionsChange = (newConditions) => {
    setSearchConditions(newConditions);
  };

  const handleSearch = (conditions) => {
    console.log('検索実行:', conditions);
    // TODO: 実際の検索ロジックを実装
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>高度な検索</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        複数条件での絞り込み検索機能を実装予定です。
      </Typography>
      
      <AdvancedSearchForm
        searchConditions={searchConditions}
        onSearchConditionsChange={handleSearchConditionsChange}
        onSearch={handleSearch}
      />
    </Box>
  );
}

// タグ管理タブのコンテンツ
function TagManagementTab() {
  const handleTagClick = (tag) => {
    console.log('タグがクリックされました:', tag);
    // TODO: タグクリックで検索タブに遷移し、そのタグで検索
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>タグ管理</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        タグ一覧・統計・管理機能を実装予定です。
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>実装予定機能</Typography>
          <Typography variant="body2" component="ul">
            <li>タグ統計表示（使用頻度グラフ）</li>
            <li>タグの編集・削除機能</li>
            <li>タグ使用頻度の可視化</li>
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <TagList 
            type="book" 
            onTagClick={handleTagClick}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TagList 
            type="memo" 
            onTagClick={handleTagClick}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function TagSearch() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <SearchTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1} data-testid="tag-management-tab-panel">
        <TagManagementTab />
      </TabPanel>
    </Box>
  );
} 