import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * 統一されたページヘッダーコンポーネント
 * 
 * 機能:
 * - 全ページで統一されたヘッダーデザイン
 * - モダン寄りの背景（うっすらガラス + 控えめなアクセント）
 * - レスポンシブ対応
 * - シンプルで統一感のあるデザイン
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      data-testid="page-header"
      sx={(theme) => {
        return {
          p: 0, // MuiPaperのデフォルトpaddingを打ち消す（中のBoxで制御）
          borderRadius: { xs: 16, sm: 20 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(15, 23, 42, 0.10)',
          backgroundColor: 'rgba(255, 255, 255, 0.62)',
          backdropFilter: 'saturate(140%) blur(12px)',
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, rgba(14,165,233,0.95), rgba(168,85,247,0.95))`,
            opacity: 0.9,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(900px circle at 20% 20%, rgba(99, 102, 241, 0.16), transparent 55%),
              radial-gradient(700px circle at 90% 10%, rgba(14, 165, 233, 0.14), transparent 55%),
              radial-gradient(900px circle at 60% 120%, rgba(168, 85, 247, 0.12), transparent 55%)
            `,
            pointerEvents: 'none',
          },
        };
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          color: 'text.primary',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          data-testid="page-header-title"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: subtitle ? 1 : 0,
            color: 'rgba(15, 23, 42, 0.92)',
            letterSpacing: '-0.02em',
          })}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            data-testid="page-header-subtitle"
            sx={(theme) => ({
              opacity: 0.92,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: 'rgba(51, 65, 85, 0.92)',
            })}
          >
            {subtitle}
          </Typography>
        )}
        {children && (
          <Box sx={{ mt: 2 }}>
            {children}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PageHeader;
