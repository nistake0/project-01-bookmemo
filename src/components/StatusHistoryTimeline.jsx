import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  BookmarkAdded,
  PlayArrow,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import { 
  BOOK_STATUS, 
  getBookStatusLabel, 
  getBookStatusColor 
} from '../constants/bookStatus';

/**
 * ステータス変更履歴を表示するTimelineコンポーネント
 * @param {Array} history - ステータス変更履歴の配列
 * @param {boolean} loading - ローディング状態
 * @param {string} error - エラーメッセージ
 * @param {Object} importantDates - 重要な日付情報
 * @param {number} readingDuration - 読書期間（日数）
 */
const StatusHistoryTimeline = ({ 
  history = [], 
  loading = false, 
  error = null,
  importantDates = {},
  readingDuration = null 
}) => {
  
  // ステータスアイコンを取得
  const getStatusIcon = (status) => {
    switch (status) {
      case BOOK_STATUS.TSUNDOKU:
        return <BookmarkAdded />;
      case BOOK_STATUS.READING:
        return <PlayArrow />;
      case BOOK_STATUS.RE_READING:
        return <Refresh />;
      case BOOK_STATUS.FINISHED:
        return <CheckCircle />;
      default:
        return <BookmarkAdded />;
    }
  };

  // 日付フォーマット
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 重要日付の表示
  const renderImportantDates = () => {
    if (!importantDates || Object.keys(importantDates).length === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          重要日付
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          {importantDates.readingStartedAt && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                読書開始日
              </Typography>
              <Typography variant="body1">
                {formatDate(importantDates.readingStartedAt)}
              </Typography>
            </Box>
          )}
          
          {importantDates.reReadingStartedAt && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                再読開始日
              </Typography>
              <Typography variant="body1">
                {formatDate(importantDates.reReadingStartedAt)}
              </Typography>
            </Box>
          )}
          
          {importantDates.finishedAt && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                読了日
              </Typography>
              <Typography variant="body1">
                {formatDate(importantDates.finishedAt)}
              </Typography>
            </Box>
          )}
          
          {readingDuration && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                読書期間
              </Typography>
              <Typography variant="body1">
                {readingDuration}日間
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>履歴を読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">エラー: {error}</Typography>
      </Box>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          ステータス変更履歴がありません。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {renderImportantDates()}
      
      <Typography variant="h6" gutterBottom>
        ステータス変更履歴
      </Typography>
      
      <List>
        {history.map((item, index) => (
          <ListItem key={item.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getBookStatusColor(item.status) === 'primary' ? 'primary.main' :
                           getBookStatusColor(item.status) === 'secondary' ? 'secondary.main' :
                           getBookStatusColor(item.status) === 'success' ? 'success.main' : 'default',
                    width: 32, 
                    height: 32 
                  }}
                >
                  {getStatusIcon(item.status)}
                </Avatar>
              </ListItemIcon>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={getBookStatusLabel(item.status)}
                    color={getBookStatusColor(item.status)}
                    size="small"
                  />
                  {item.previousStatus && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        ←
                      </Typography>
                      <Chip
                        label={getBookStatusLabel(item.previousStatus)}
                        color={getBookStatusColor(item.previousStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {formatDate(item.changedAt)}
                </Typography>
                
                {item.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {item.notes}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {index < history.length - 1 && <Divider sx={{ width: '100%', mt: 1 }} />}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default StatusHistoryTimeline;
