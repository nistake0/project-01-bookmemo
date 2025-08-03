import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Tabs, 
  Tab, 
  Paper,
  Typography,
  Button
} from '@mui/material';
import DateRangeSelector from './DateRangeSelector';
import TagSearchField from './TagSearchField';
import MemoContentSearchField from './MemoContentSearchField';

/**
 * 高度な検索フォームコンポーネント
 * 
 * @param {Object} props
 * @param {Object} props.searchConditions - 検索条件
 * @param {Function} props.onSearchConditionsChange - 検索条件変更時のコールバック
 * @param {Function} props.onSearch - 検索実行時のコールバック
 */
function AdvancedSearchForm({ searchConditions, onSearchConditionsChange, onSearch }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const handleTextChange = (event) => {
    onSearchConditionsChange?.({
      ...searchConditions,
      text: event.target.value
    });
  };

  const handleStatusChange = (event, newValue) => {
    setStatusFilter(newValue);
    onSearchConditionsChange?.({
      ...searchConditions,
      status: newValue
    });
  };

  const handleDateRangeChange = (dateRange) => {
    onSearchConditionsChange?.({
      ...searchConditions,
      dateRange: dateRange
    });
  };

  const handleTagsChange = (selectedTags) => {
    onSearchConditionsChange?.({
      ...searchConditions,
      selectedTags: selectedTags
    });
  };

  const handleMemoContentChange = (memoContent) => {
    onSearchConditionsChange?.({
      ...searchConditions,
      memoContent: memoContent
    });
  };

  const handleIncludeMemoContentChange = (includeMemoContent) => {
    onSearchConditionsChange?.({
      ...searchConditions,
      includeMemoContent: includeMemoContent
    });
  };

  const handleSearch = () => {
    onSearch?.(searchConditions);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>検索条件</Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* テキスト検索 */}
        <TextField
          label="テキスト検索（タイトル・著者・タグ）"
          value={searchConditions?.text || ''}
          onChange={handleTextChange}
          fullWidth
          margin="normal"
          placeholder="検索したいキーワードを入力"
          data-testid="text-search-field"
        />

        {/* ステータスフィルター */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ステータス
          </Typography>
          <Tabs 
            value={statusFilter} 
            onChange={handleStatusChange}
            data-testid="status-filter-tabs"
          >
            <Tab label="すべて" value="all" />
            <Tab label="読書中" value="reading" />
            <Tab label="読了" value="finished" />
          </Tabs>
        </Box>

        {/* 日時検索 */}
        <Box sx={{ mt: 2 }}>
          <DateRangeSelector
            value={searchConditions?.dateRange}
            onChange={handleDateRangeChange}
          />
        </Box>

        {/* タグ検索 */}
        <Box sx={{ mt: 2 }}>
          <TagSearchField
            selectedTags={searchConditions?.selectedTags || []}
            onTagsChange={handleTagsChange}
            type="book"
          />
        </Box>

        {/* メモ内容検索 */}
        <Box sx={{ mt: 2 }}>
          <MemoContentSearchField
            memoContent={searchConditions?.memoContent || ''}
            includeMemoContent={searchConditions?.includeMemoContent || false}
            onMemoContentChange={handleMemoContentChange}
            onIncludeMemoContentChange={handleIncludeMemoContentChange}
          />
        </Box>
      </Paper>

      {/* 検索ボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleSearch}
          data-testid="search-button"
        >
          検索実行
        </Button>
      </Box>
    </Box>
  );
}

export default AdvancedSearchForm; 