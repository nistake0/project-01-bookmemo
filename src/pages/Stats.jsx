import { Box, Card, CardContent, CircularProgress, Grid, Typography, Divider } from '@mui/material';
import useStats from '../hooks/useStats';
import { BarChart, PieChart } from '@mui/x-charts';

export default function Stats() {
  const { loading, error, summary, tagStats, monthlyFinished, monthlyAddedBooks, monthlyMemos, topAuthors, topPublishers, statusDistribution } = useStats();

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, mb: 10, p: 2 }}>
      <Typography variant="h4" gutterBottom>統計</Typography>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">読み込み中...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card data-testid="stats-total-books">
            <CardContent>
              <Typography variant="h6">総冊数</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.totalBooks ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card data-testid="stats-finished-books">
            <CardContent>
              <Typography variant="h6">読了冊数</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.finishedBooks ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card data-testid="stats-reading-books">
            <CardContent>
              <Typography variant="h6">読書中冊数</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.readingBooks ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!!summary && (
        <Card sx={{ mb: 2 }} data-testid="chart-status-pie">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>ステータス内訳</Typography>
            <PieChart
              height={220}
              series={[{
                data: [
                  { id: 'finished', label: '読了', value: statusDistribution?.finished ?? 0 },
                  { id: 'reading', label: '読書中', value: statusDistribution?.reading ?? 0 },
                ],
                innerRadius: 30,
                paddingAngle: 2,
              }]}
            />
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>月別読了冊数（直近12ヶ月）</Typography>
      <Card sx={{ mb: 2 }} data-testid="chart-monthly-finished">
        <CardContent>
          <BarChart
            xAxis={[{ scaleType: 'band', data: (monthlyFinished ?? []).map(b => b.key) }]}
            series={[{ data: (monthlyFinished ?? []).map(b => b.count), label: '読了冊数' }]}
            height={260}
          />
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>月別追加冊数（直近12ヶ月）</Typography>
          <Card data-testid="chart-monthly-added">
            <CardContent>
              <BarChart
                xAxis={[{ scaleType: 'band', data: (monthlyAddedBooks ?? []).map(b => b.key) }]}
                series={[{ data: (monthlyAddedBooks ?? []).map(b => b.count), label: '追加冊数', color: '#42a5f5' }]}
                height={220}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>月別メモ数（直近12ヶ月）</Typography>
          <Card data-testid="chart-monthly-memos">
            <CardContent>
              <BarChart
                xAxis={[{ scaleType: 'band', data: (monthlyMemos ?? []).map(b => b.key) }]}
                series={[{ data: (monthlyMemos ?? []).map(b => b.count), label: 'メモ数', color: '#9c27b0' }]}
                height={220}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>タグ使用頻度（上位）</Typography>
      {!!tagStats?.length && (
        <Card sx={{ mb: 2 }} data-testid="chart-tag-pie">
          <CardContent>
            <PieChart
              height={260}
              series={[{
                data: (tagStats.slice(0, 6)).map(r => ({ id: r.tag, label: r.tag, value: r.totalCount })),
                innerRadius: 40,
                paddingAngle: 2,
              }]}
            />
          </CardContent>
        </Card>
      )}
      <Grid container spacing={2}>
        {(tagStats?.slice(0, 10) ?? []).map(row => (
          <Grid item xs={12} sm={6} key={row.tag}>
            <Card data-testid={`tag-stat-${row.tag}`}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.tag}</Typography>
                <Typography variant="body2" color="text.secondary">
                  本: {row.bookCount} / メモ: {row.memoCount} / 合計: {row.totalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {(!tagStats || tagStats.length === 0) && !loading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">タグデータがありません。</Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>著者トップ</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {(topAuthors?.slice(0, 10) ?? []).map(row => (
          <Grid item xs={12} sm={6} key={row.author}>
            <Card data-testid={`author-top-${row.author}`}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.author}</Typography>
                <Typography variant="body2" color="text.secondary">冊数: {row.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {(!topAuthors || topAuthors.length === 0) && !loading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">著者データがありません。</Typography>
          </Grid>
        )}
      </Grid>

      <Typography variant="h6" sx={{ mb: 1 }}>出版社トップ</Typography>
      <Grid container spacing={2}>
        {(topPublishers?.slice(0, 10) ?? []).map(row => (
          <Grid item xs={12} sm={6} key={row.publisher}>
            <Card data-testid={`publisher-top-${row.publisher}`}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.publisher}</Typography>
                <Typography variant="body2" color="text.secondary">冊数: {row.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {(!topPublishers || topPublishers.length === 0) && !loading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">出版社データがありません。</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}