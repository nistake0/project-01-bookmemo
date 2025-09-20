import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper,
  Skeleton
} from '@mui/material';
import { useBookStatusHistory } from '../hooks/useBookStatusHistory';
import { getBookStatusLabel, getBookStatusColor } from '../constants/bookStatus';

/**
 * 最新ステータス履歴表示コンポーネント
 * 書籍詳細ページのトップに表示される
 */
const LatestStatusHistory = ({ bookId }) => {
  const { latestHistory, loading, error } = useBookStatusHistory(bookId);

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 最新ステータス履歴
        </Typography>
        <Skeleton variant="rectangular" height={40} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 最新ステータス履歴
        </Typography>
        <Typography color="error">
          履歴の取得に失敗しました
        </Typography>
      </Paper>
    );
  }

  if (!latestHistory) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 最新ステータス履歴
        </Typography>
        <Typography color="text.secondary">
          履歴がありません
        </Typography>
      </Paper>
    );
  }

  const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        📊 最新ステータス履歴
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(latestHistory.changedAt)}
        </Typography>
        
        <Chip
          label={getBookStatusLabel(latestHistory.status)}
          color={getBookStatusColor(latestHistory.status)}
          size="small"
        />
        
        {latestHistory.previousStatus && (
          <>
            <Typography variant="body2" color="text.secondary">
              ←
            </Typography>
            <Chip
              label={getBookStatusLabel(latestHistory.previousStatus)}
              color={getBookStatusColor(latestHistory.previousStatus)}
              size="small"
              variant="outlined"
            />
          </>
        )}
      </Box>
    </Paper>
  );
};

export default LatestStatusHistory;
