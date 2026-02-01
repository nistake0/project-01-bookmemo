import { 
  Box, 
  TextField, 
  Typography, 
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';

/**
 * メモ内容検索フィールドコンポーネント
 * 
 * @param {Object} props
 * @param {string} props.memoContent - メモ内容検索のテキスト
 * @param {boolean} props.includeMemoContent - メモ内容検索を含めるかどうか
 * @param {Function} props.onMemoContentChange - メモ内容変更時のコールバック
 * @param {Function} props.onIncludeMemoContentChange - メモ内容検索の有効/無効変更時のコールバック
 */
function MemoContentSearchField({ 
  memoContent = '', 
  includeMemoContent = false,
  onMemoContentChange, 
  onIncludeMemoContentChange 
}) {
  const handleMemoContentChange = (event) => {
    onMemoContentChange?.(event.target.value);
  };

  const handleIncludeMemoContentChange = (event) => {
    onIncludeMemoContentChange?.(event.target.checked);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        メモ内容検索
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        {/* メモ内容検索の有効/無効切り替え */}
        <FormControlLabel
          control={
            <Switch
              checked={includeMemoContent}
              onChange={handleIncludeMemoContentChange}
              size="small"
              data-testid="include-memo-content-switch"
            />
          }
          label="メモ内容も検索対象に含める"
        />

        {/* メモ内容検索フィールド */}
        {includeMemoContent && (
          <TextField
            label="メモ内容で検索"
            value={memoContent}
            onChange={handleMemoContentChange}
            fullWidth
            margin="normal"
            placeholder="メモの内容で検索したいキーワードを入力"
            multiline
            rows={3}
            data-testid="memo-content-search-field"
            helperText="メモのテキスト内容に含まれるキーワードで検索します"
          />
        )}

        {/* 説明テキスト */}
        {!includeMemoContent && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            スイッチをオンにすると、メモの内容も検索対象に含めることができます
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default MemoContentSearchField; 