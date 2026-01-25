import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PATHS } from '../../config/paths';

/**
 * 統一されたページヘッダーコンポーネント
 * デザイン改善: 紙テクスチャ・角の金具風・装飾枠（design-improvement-proposal）
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      data-testid="page-header"
      sx={{
        p: 0,
        borderRadius: { xs: 16, sm: 20 },
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '3px solid rgba(139, 69, 19, 0.25)',
        backgroundImage: [
          `url("${PATHS.PAPER_TEXTURE()}")`,
          'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
        ],
        backgroundBlendMode: 'overlay',
        backgroundSize: '200% 200%, cover',
        backgroundPosition: '0 0, center',
        boxShadow: `
          0 18px 50px rgba(15, 23, 42, 0.15),
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.6)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(135deg, rgba(184, 134, 11, 0.15) 0%, transparent 30%),
            linear-gradient(225deg, rgba(184, 134, 11, 0.15) 0%, transparent 30%),
            linear-gradient(45deg, transparent 0%, rgba(184, 134, 11, 0.08) 50%, transparent 100%),
            linear-gradient(315deg, transparent 0%, rgba(184, 134, 11, 0.08) 50%, transparent 100%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.3), transparent)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          color: 'text.primary',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          data-testid="page-header-title"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: subtitle ? 1 : 0,
            color: 'rgba(15, 23, 42, 0.92)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            data-testid="page-header-subtitle"
            sx={{
              opacity: 0.92,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: 'rgba(51, 65, 85, 0.92)',
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
    </Paper>
  );
};

export default PageHeader;
