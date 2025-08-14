import { Box, Card, CardContent, CircularProgress, Grid, Typography, Divider } from '@mui/material';
import useStats from '../hooks/useStats';
import { BarChart, PieChart } from '@mui/x-charts';

export default function Stats() {
  const { loading, error, summary, tagStats, monthlyFinished } = useStats();

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
    </Box>
  );
}