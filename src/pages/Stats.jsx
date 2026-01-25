import { Typography, Box, Card, CardContent, Divider } from "@mui/material";
import PageHeader from '../components/common/PageHeader';
import LoadingIndicator from '../components/common/LoadingIndicator';
import useStats from '../hooks/useStats';
import { BarChart, PieChart } from '@mui/x-charts';

export default function Stats() {
  const { loading, error, summary, tagStats, monthlyFinished, monthlyAddedBooks, monthlyMemos, topAuthors, topPublishers, statusDistribution } = useStats();

  // データが空かどうかを判定
  const hasData = summary && (summary.totalBooks > 0 || summary.finishedBooks > 0 || summary.readingBooks > 0 || summary.tsundokuBooks > 0 || summary.reReadingBooks > 0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 10 }}>
      {/* 統一されたヘッダー */}
      <PageHeader 
        title="統計"
        subtitle="あなたの読書活動を可視化"
      />

      {/* メインコンテンツ */}
      <Box sx={{ p: 2 }}>
        {loading && (
          <LoadingIndicator
            variant="inline"
            message="読み込み中..."
            data-testid="stats-loading"
          />
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}

        {/* データが空の場合の表示 */}
        {!loading && !error && !hasData && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📚 読書データがありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                本を追加して読書を始めると、ここに統計が表示されます
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* データがある場合のみ統計を表示 */}
        {hasData && (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: { xs: 1, sm: 2 },
                width: '100%',
                mb: 2,
                '@media (max-width: 480px)': {
                  gap: 0.75,
                },
              }}
            >
              <Card
                data-testid="stats-total-books"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6">総冊数</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.totalBooks ?? '-'}</Typography>
                </CardContent>
              </Card>
              <Card
                data-testid="stats-tsundoku-books"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6">積読冊数</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.tsundokuBooks ?? '-'}</Typography>
                </CardContent>
              </Card>
              <Card
                data-testid="stats-reading-books"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6">読書中冊数</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.readingBooks ?? '-'}</Typography>
                </CardContent>
              </Card>
              <Card
                data-testid="stats-rereading-books"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6">再読中冊数</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.reReadingBooks ?? '-'}</Typography>
                </CardContent>
              </Card>
              <Card
                data-testid="stats-finished-books"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6">読了冊数</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{summary?.finishedBooks ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>

            {!!summary && (
              <Card sx={{ mb: 2 }} data-testid="chart-status-pie">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>ステータス内訳</Typography>
                  <PieChart
                    height={220}
                    series={[{
                      data: [
                        { id: 'tsundoku', label: '積読', value: statusDistribution?.tsundoku ?? 0 },
                        { id: 'reading', label: '読書中', value: statusDistribution?.reading ?? 0 },
                        { id: 'reReading', label: '再読中', value: statusDistribution?.reReading ?? 0 },
                        { id: 'finished', label: '読了', value: statusDistribution?.finished ?? 0 },
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

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mb: 2
            }}>
              <Box>
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
              </Box>
              <Box>
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
              </Box>
            </Box>

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
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}>
              {(tagStats?.slice(0, 10) ?? []).map(row => (
                <Box key={row.tag}>
                  <Card data-testid={`tag-stat-${row.tag}`}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.tag}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        本: {row.bookCount} / メモ: {row.memoCount} / 合計: {row.totalCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
              {(!tagStats || tagStats.length === 0) && !loading && (
                <Box>
                  <Typography variant="body2" color="text.secondary">タグデータがありません。</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>著者トップ</Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 2
            }}>
              {(topAuthors?.slice(0, 10) ?? []).map(row => (
                <Box key={row.author}>
                  <Card data-testid={`author-top-${row.author}`}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.author}</Typography>
                      <Typography variant="body2" color="text.secondary">冊数: {row.total}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
              {(!topAuthors || topAuthors.length === 0) && !loading && (
                <Box>
                  <Typography variant="body2" color="text.secondary">著者データがありません。</Typography>
                </Box>
              )}
            </Box>

            <Typography variant="h6" sx={{ mb: 1 }}>出版社トップ</Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}>
              {(topPublishers?.slice(0, 10) ?? []).map(row => (
                <Box key={row.publisher}>
                  <Card data-testid={`publisher-top-${row.publisher}`}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{row.publisher}</Typography>
                      <Typography variant="body2" color="text.secondary">冊数: {row.total}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
              {(!topPublishers || topPublishers.length === 0) && !loading && (
                <Box>
                  <Typography variant="body2" color="text.secondary">出版社データがありません。</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}