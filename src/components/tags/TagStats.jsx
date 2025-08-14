import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { useTagStats } from '../../hooks/useTagStats';
import useTagManagement from '../../hooks/useTagManagement';
import TagEditDialog from './TagEditDialog';
import { useAuth } from '../../auth/AuthProvider';

/**
 * タグ統計表示コンポーネント
 * 
 * @param {Object} props
 * @param {Function} props.onTagClick - タグクリック時のコールバック
 */
function TagStats({ onTagClick }) {
  const { user } = useAuth();
  const { tagStats, loading, error, getSortedTagStats } = useTagStats(user);
  const { loading: managing, renameTag, deleteTag } = useTagManagement();
  
  const [sortBy, setSortBy] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editOpen, setEditOpen] = useState(false);
  const [targetTag, setTargetTag] = useState('');

  // ソートされたタグ統計を取得
  const sortedStats = getSortedTagStats(sortBy, sortOrder);

  // 統計サマリーを計算
  const totalTags = Object.keys(tagStats).length;
  const totalBooks = Object.values(tagStats).reduce((sum, stat) => sum + stat.bookCount, 0);
  const totalMemos = Object.values(tagStats).reduce((sum, stat) => sum + stat.memoCount, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          タグ統計の取得に失敗しました: {error.message}
        </Alert>
      </Box>
    );
  }

  if (totalTags === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          タグがまだ登録されていません。本にタグを追加すると、ここに統計が表示されます。
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* 統計サマリー */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          タグ統計サマリー
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalTags}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総タグ数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary">
                {totalBooks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                本の総件数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {totalMemos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                メモの総件数
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ソート設定 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6">
          タグ一覧 ({totalTags}件)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>ソート基準</InputLabel>
          <Select
            value={sortBy}
            label="ソート基準"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="count">使用頻度</MenuItem>
            <MenuItem value="name">名前順</MenuItem>
            <MenuItem value="lastUsed">最終使用日</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>順序</InputLabel>
          <Select
            value={sortOrder}
            label="順序"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <MenuItem value="desc">降順</MenuItem>
            <MenuItem value="asc">昇順</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* タグ統計一覧 */}
      <Grid container spacing={2}>
        {sortedStats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.tag}>
            <Card data-testid={`tag-stat-card-${stat.tag}`} onClick={() => onTagClick?.(stat.tag)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ wordBreak: 'break-all' }}>
                    {stat.tag}
                  </Typography>
                  <Chip 
                    label={stat.type} 
                    size="small" 
                    color={
                      stat.type === 'both' ? 'primary' : 
                      stat.type === 'book' ? 'secondary' : 'info'
                    }
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    本: {stat.bookCount}件
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    メモ: {stat.memoCount}件
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                    合計: {stat.totalCount}件
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip size="small" label="編集" onClick={(e) => { e.stopPropagation(); setTargetTag(stat.tag); setEditOpen(true); }} clickable color="primary" variant="outlined" data-testid={`tag-edit-${stat.tag}`} />
                  </Box>
                </Box>
                
                {stat.lastUsed && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    最終使用: {stat.lastUsed.toLocaleDateString('ja-JP')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TagEditDialog
        open={editOpen}
        tag={targetTag}
        busy={managing}
        onClose={() => setEditOpen(false)}
        onRename={async (oldTag, newTag) => {
          await renameTag(oldTag, newTag);
          setEditOpen(false);
        }}
        onDelete={async (tag) => {
          await deleteTag(tag);
          setEditOpen(false);
        }}
      />
    </Box>
  );
}

export default TagStats; 