import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * 統一されたページヘッダーコンポーネント
 * 
 * 機能:
 * - 全ページで統一されたヘッダーデザイン
 * - 古い紙のテクスチャに合った温かみのある背景
 * - レスポンシブ対応
 * - シンプルで統一感のあるデザイン
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      data-testid="page-header"
      sx={(theme) => {
        const brownDark = theme.palette.custom.pageHeader.brown.dark;
        const brownMedium = theme.palette.custom.pageHeader.brown.medium;
        const brownLight = theme.palette.custom.pageHeader.brown.light;
        return {
          background: `
            linear-gradient(135deg, ${brownDark}E6 0%, ${brownMedium}CC 100%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              ${brownDark}1A 4px,
              ${brownDark}1A 8px
            ),
            linear-gradient(135deg, ${brownDark} 0%, ${brownMedium} 50%, ${brownLight} 100%)
          `,
          backgroundSize: 'cover, 16px 16px, cover',
          backgroundRepeat: 'no-repeat, repeat, no-repeat',
          backgroundPosition: 'center, center, center',
          borderRadius: 0,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `3px solid ${brownDark}4D`,
        };
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          color: 'white',
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
            textShadow: '0 2px 4px rgba(0,0,0,0.7)',
            color: theme.palette.custom.pageHeader.text.title,
          })}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            data-testid="page-header-subtitle"
            sx={(theme) => ({
              opacity: 0.95,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              color: theme.palette.custom.pageHeader.text.subtitle,
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
      
      {/* 装飾的な要素 - 古い紙らしい質感 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 30%)
          `,
          pointerEvents: 'none'
        }}
      />
    </Paper>
  );
};

export default PageHeader;
