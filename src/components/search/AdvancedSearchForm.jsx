import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Paper,
  Typography,
  Button
} from '@mui/material';
import DateRangeSelector from './DateRangeSelector';
import TagSearchField from './TagSearchField';
import { 
  FILTER_STATUSES,
  FILTER_LABELS
} from '../../constants/bookStatus';

/**
 * 高度な検索フォームコンポーネント（アプローチ2：完全統合検索）
 * 
 * @param {Object} props
 * @param {Object} props.searchConditions - 検索条件
 * @param {Function} props.onSearchConditionsChange - 検索条件変更時のコールバック
 * @param {Function} props.onSearch - 検索実行時のコールバック
 */
function AdvancedSearchForm({ searchConditions, onSearchConditionsChange, onSearch }) {
  const [statusFilter, setStatusFilter] = useState(FILTER_STATUSES.ALL);

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

  const handleSearch = () => {
    onSearch?.(searchConditions);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom data-testid="advanced-search-title">検索条件</Typography>
        {/* 統合テキスト検索 */}
        <TextField 
          label="テキスト検索（タイトル・著者・メモ内容・タグ）" 
          value={searchConditions?.text || ''} 
          onChange={handleTextChange} 
          fullWidth 
          margin="normal" 
          placeholder="検索したいキーワードを入力"
          data-testid="text-search-field"
        />
        
        {/* ステータスフィルター */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom data-testid="status-filter-label">
            ステータス
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[FILTER_STATUSES.ALL, FILTER_STATUSES.TSUNDOKU, FILTER_STATUSES.READING_GROUP, FILTER_STATUSES.SUSPENDED, FILTER_STATUSES.FINISHED].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleStatusChange(null, status)}
                data-testid={`status-filter-${status}`}
              >
                {FILTER_LABELS[status]}
              </Button>
            ))}
          </Box>
        </Box>

        {/* 日時検索 */}
        <Box sx={{ mt: 2 }}>
          <DateRangeSelector 
            dateRange={searchConditions?.dateRange || { type: 'none' }}
            onDateRangeChange={handleDateRangeChange}
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