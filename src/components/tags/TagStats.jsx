import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import { useTagStats } from '../../hooks/useTagStats';
import LoadingIndicator from '../common/LoadingIndicator';
import useTagManagement from '../../hooks/useTagManagement';
import TagEditDialog from './TagEditDialog';
import BulkDeleteTagsDialog from './BulkDeleteTagsDialog';
import BulkMergeTagsDialog from './BulkMergeTagsDialog';
import { useAuth } from '../../auth/AuthProvider';

/**
 * タグ統計表示コンポーネント
 * 
 * @param {Object} props
 * @param {Function} props.onTagClick - タグクリック時のコールバック
 */
const defaultSummaryGrid = { gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 };
const defaultStatsGrid = { gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 };

function TagStats({ onTagClick }) {
  const theme = useTheme();
  const summaryGrid = theme.custom?.layout?.tagStatsSummaryGrid ?? defaultSummaryGrid;
  const statsGrid = theme.custom?.layout?.tagStatsGrid ?? defaultStatsGrid;
  const { user } = useAuth();
  const { tagStats, loading, error, getSortedTagStats, fetchTagStats } = useTagStats(user);
  const { loading: managing, renameTag, deleteTag, deleteTags, mergeTags } = useTagManagement();
  
  const [sortBy, setSortBy] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editOpen, setEditOpen] = useState(false);
  const [targetTag, setTargetTag] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMergeOpen, setBulkMergeOpen] = useState(false);

  // ソートされたタグ統計を取得
  const sortedStats = getSortedTagStats(sortBy, sortOrder);

  // 統計サマリーを計算
  const totalTags = Object.keys(tagStats).length;
  const totalBooks = Object.values(tagStats).reduce((sum, stat) => sum + stat.bookCount, 0);
  const totalMemos = Object.values(tagStats).reduce((sum, stat) => sum + stat.memoCount, 0);

  if (loading) {
    return (
      <LoadingIndicator
        variant="inline"
        message="タグ統計を読み込み中..."
        data-testid="tag-stats-loading"
      />
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
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: summaryGrid.gridTemplateColumns,
          gap: summaryGrid.gap
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {totalTags}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              総タグ数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="secondary">
              {totalBooks}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              本の総件数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {totalMemos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              メモの総件数
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ソート設定・一括処理（背景画像対策でPaperで囲む） */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6">
          タグ一覧 ({totalTags}件)
        </Typography>
        <Chip
          label="一括削除"
          size="small"
          color="error"
          variant="outlined"
          onClick={() => setBulkDeleteOpen(true)}
          data-testid="open-bulk-delete"
        />
        <Chip
          label="一括統合"
          size="small"
          color="primary"
          variant="outlined"
          onClick={() => setBulkMergeOpen(true)}
          data-testid="open-bulk-merge"
        />
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
      </Paper>

      {/* タグ統計一覧 */}
      <Box
        className="tag-stats-grid"
        sx={{
          display: 'grid',
          gridTemplateColumns: statsGrid.gridTemplateColumns,
          gap: statsGrid.gap,
        }}
      >
        {sortedStats.map((stat) => (
          <Card key={stat.tag} data-testid={`tag-stat-card-${stat.tag}`} onClick={() => onTagClick?.(stat.tag)} className="tag-stat-card">
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
         ))}
       </Box>

      <TagEditDialog
        open={editOpen}
        tag={targetTag}
        busy={managing}
        onClose={() => setEditOpen(false)}
        onRename={async (oldTag, newTag) => {
          await renameTag(oldTag, newTag);
          await fetchTagStats();
          setEditOpen(false);
        }}
        onDelete={async (tag) => {
          await deleteTag(tag);
          await fetchTagStats();
          setEditOpen(false);
        }}
        onMerge={async (aliases, canonical) => {
          await mergeTags(aliases, canonical);
          await fetchTagStats();
          setEditOpen(false);
        }}
      />

      <BulkDeleteTagsDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        busy={managing}
        onConfirm={async (tags) => {
          if (!tags || tags.length === 0) return;
          await deleteTags(tags);
          await fetchTagStats();
          setBulkDeleteOpen(false);
        }}
      />

      <BulkMergeTagsDialog
        open={bulkMergeOpen}
        onClose={() => setBulkMergeOpen(false)}
        busy={managing}
        onConfirm={async (aliases, canonical) => {
          if (!aliases || aliases.length === 0 || !canonical) return;
          await mergeTags(aliases.join(','), canonical);
          await fetchTagStats();
          setBulkMergeOpen(false);
        }}
      />
    </Box>
  );
}

export default TagStats; 