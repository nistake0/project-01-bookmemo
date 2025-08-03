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

        {/* 日時検索（仮実装） */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            読了日時（実装予定）
          </Typography>
          <Typography variant="body2" color="text.secondary">
            年別・年月別・直近期間での検索機能を実装予定です。
          </Typography>
        </Box>

        {/* タグ検索（仮実装） */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            タグ検索（実装予定）
          </Typography>
          <Typography variant="body2" color="text.secondary">
            複数タグでの絞り込み機能を実装予定です。
          </Typography>
        </Box>

        {/* メモ内容検索（仮実装） */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            メモ内容検索（実装予定）
          </Typography>
          <Typography variant="body2" color="text.secondary">
            メモのテキスト内容での検索機能を実装予定です。
          </Typography>
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