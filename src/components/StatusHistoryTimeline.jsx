import React, { useState } from 'react';
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
  Avatar,
  Button
} from '@mui/material';
import {
  BookmarkAdded,
  PlayArrow,
  Refresh,
  CheckCircle,
  Add
} from '@mui/icons-material';
import ManualHistoryAddDialog from './ManualHistoryAddDialog';
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
 * @param {boolean} showAddButton - 履歴追加ボタンを表示するか
 * @param {string} bookId - 書籍ID（履歴追加時に必要）
 * @param {function} onAddHistory - 履歴追加時のコールバック
 */
const StatusHistoryTimeline = ({ 
  history = [], 
  loading = false, 
  error = null,
  importantDates = {},
  readingDuration = null,
  showAddButton = false,
  bookId = null,
  onAddHistory = null,
  currentBookStatus = null
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddHistory = async (date, status, previousStatus, existingHistory) => {
    if (onAddHistory) {
      await onAddHistory(date, status, previousStatus, existingHistory);
    }
  };
  
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

  return (
    <Box sx={{ p: 2 }}>
      {renderImportantDates()}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          ステータス変更履歴
        </Typography>
        {showAddButton && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            data-testid="add-history-button"
          >
            履歴追加
          </Button>
        )}
      </Box>
      
      {(!history || history.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            履歴がありません
          </Typography>
          <Typography variant="body2" color="text.secondary">
            過去のステータス変更履歴を追加できます
          </Typography>
        </Box>
      )}
      
      <List>
        {(history || []).map((item, index) => (
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

      {/* 履歴追加ダイアログ */}
      {showAddButton && (
        <ManualHistoryAddDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onAdd={handleAddHistory}
          bookId={bookId}
          existingHistory={history}
          currentBookStatus={currentBookStatus}
        />
      )}
    </Box>
  );
};

export default StatusHistoryTimeline;
