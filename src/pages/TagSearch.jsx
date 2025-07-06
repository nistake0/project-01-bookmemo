import { Box, Typography, List, ListItem } from '@mui/material';

const tagSearchRoles = [
  'タグ管理・タグ一覧（ユーザーが登録したタグのリストアップ、タグごとの本・メモ件数表示、タグクリックで該当一覧へ遷移）',
  'タグの編集・削除機能（必要に応じて）',
  'タグの使用履歴からのサジェスト・補完入力（タグ入力時のUX向上）',
  '高度な検索（複数タグ・著者・期間などの複合条件での絞り込み）',
  'タグの可視化・分析（使用頻度グラフやワードクラウド等）',
  'タグの一括付与・編集やサジェスト機能',
];

export default function TagSearch() {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>検索・タグページ（仮実装）</Typography>
      <Typography variant="body1" gutterBottom>
        このページでは、今後以下の機能を実装予定です。
      </Typography>
      <List>
        {tagSearchRoles.map((role, idx) => (
          <ListItem key={idx}>
            <Typography variant="body2">{role}</Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 