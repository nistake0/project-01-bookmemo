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
      sx={{
        background: `
          linear-gradient(135deg, rgba(139, 69, 19, 0.9) 0%, rgba(160, 82, 45, 0.8) 100%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(139, 69, 19, 0.1) 4px,
            rgba(139, 69, 19, 0.1) 8px
          ),
          linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)
        `,
        backgroundSize: 'cover, 16px 16px, cover',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundPosition: 'center, center, center',
        borderRadius: 0,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid rgba(139, 69, 19, 0.3)'
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
            textShadow: '0 2px 4px rgba(0,0,0,0.7)',
            color: '#FFF8DC'
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              opacity: 0.95,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              color: '#F5F5DC'
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
