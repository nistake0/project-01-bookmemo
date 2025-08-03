import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Autocomplete, 
  Chip,
  Typography,
  Paper
} from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useTagHistory } from '../../hooks/useTagHistory';

/**
 * タグ検索フィールドコンポーネント
 * 
 * @param {Object} props
 * @param {Array} props.selectedTags - 選択されたタグの配列
 * @param {Function} props.onTagsChange - タグ変更時のコールバック
 * @param {string} props.type - タグの種類 ('book' | 'memo')
 */
function TagSearchField({ selectedTags = [], onTagsChange, type = 'book' }) {
  const { user } = useAuth();
  const { tagOptions, loading, fetchTagHistory } = useTagHistory(type, user);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (user) {
      fetchTagHistory();
    }
  }, [user, fetchTagHistory]);

  const handleTagAdd = (event, newValue) => {
    if (newValue && !selectedTags.includes(newValue)) {
      const updatedTags = [...selectedTags, newValue];
      onTagsChange?.(updatedTags);
      setInputValue('');
    }
  };

  const handleTagDelete = (tagToDelete) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToDelete);
    onTagsChange?.(updatedTags);
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        タグ検索
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        {/* タグ入力フィールド */}
        <Autocomplete
          freeSolo
          multiple
          options={tagOptions || []}
          value={selectedTags}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleTagAdd}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  {...tagProps}
                  onDelete={() => handleTagDelete(option)}
                  color="primary"
                  variant="outlined"
                  data-testid={`selected-tag-${option}`}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="タグを選択または入力"
              placeholder="タグを入力..."
              fullWidth
              data-testid="tag-search-input"
            />
          )}
          loading={loading}
          noOptionsText="タグが見つかりません"
          data-testid="tag-autocomplete"
        />

        {/* 説明テキスト */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {selectedTags.length > 0 
            ? `選択されたタグ: ${selectedTags.join(', ')}`
            : 'タグを選択すると、そのタグを持つ本やメモを検索できます'
          }
        </Typography>
      </Paper>
    </Box>
  );
}

export default TagSearchField; 