import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * 統一されたページヘッダーコンポーネント
 * 
 * 機能:
 * - 全ページで統一されたヘッダーデザイン
 * - アプリらしい背景画像
 * - レスポンシブ対応
 * - シンプルで統一感のあるデザイン
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: `
          linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%),
          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="books" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="none"/><rect x="2" y="2" width="16" height="16" fill="rgba(255,255,255,0.1)" rx="2"/><rect x="4" y="4" width="12" height="2" fill="rgba(255,255,255,0.2)"/><rect x="4" y="8" width="8" height="1" fill="rgba(255,255,255,0.2)"/><rect x="4" y="11" width="10" height="1" fill="rgba(255,255,255,0.2)"/></pattern></defs><rect width="100" height="100" fill="url(%23books)"/></svg>')
        `,
        borderRadius: 0,
        mb: 3,
        position: 'relative',
        overflow: 'hidden'
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
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: subtitle ? 1 : 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
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
      
      {/* 装飾的な要素 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}
      />
    </Paper>
  );
};

export default PageHeader;
