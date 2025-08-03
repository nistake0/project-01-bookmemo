import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useTagHistory } from '../../hooks/useTagHistory';

/**
 * タグ一覧表示コンポーネント
 * 
 * @param {Object} props
 * @param {Function} props.onTagClick - タグクリック時のコールバック
 * @param {string} props.type - タグの種類 ('book' | 'memo')
 */
function TagList({ onTagClick, type = 'book' }) {
  const { user } = useAuth();
  const { tagOptions, loading, fetchTagHistory } = useTagHistory(type, user);

  useEffect(() => {
    if (user) {
      fetchTagHistory();
    }
  }, [user, fetchTagHistory]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tagOptions || tagOptions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          タグがまだ登録されていません。本やメモにタグを追加すると、ここに表示されます。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {type === 'book' ? '本のタグ' : 'メモのタグ'} ({tagOptions.length})
      </Typography>
      <List>
        {tagOptions.map((tag, index) => (
          <ListItem 
            key={index}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
            onClick={() => onTagClick?.(tag)}
            data-testid={`tag-item-${tag}`}
          >
            <ListItemText 
              primary={
                <Chip 
                  label={tag} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  clickable
                />
              }
              secondary={`使用回数: ${1}`} // TODO: 実際の使用回数を取得
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default TagList; 