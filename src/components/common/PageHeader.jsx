import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { PATHS } from '../../config/paths';

const FALLBACK_ACCENT = { border: 'rgba(139, 69, 19, 0.25)', light: 'rgba(139, 69, 19, 0.3)' };
const FALLBACK_GOLD = { accent: 'rgba(184, 134, 11, 0.15)', subtle: 'rgba(184, 134, 11, 0.08)' };

const DEFAULT_PAGE_HEADER = {
  backgroundImage: 'paper',
  goldOverlay: true,
  centerLine: true,
  borderRadius: { xs: 16, sm: 20 },
  accentKey: 'brown',
};

/**
 * 統一されたページヘッダーコンポーネント
 * デザインは theme.custom.pageHeader でプリセット制御
 */
const PageHeader = ({ title, subtitle, children }) => {
  const theme = useTheme();
  const ph = theme.custom?.pageHeader || DEFAULT_PAGE_HEADER;
  const accentKey = ph.accentKey || 'brown';
  const accent = theme.palette?.decorative?.[accentKey] || FALLBACK_ACCENT;
  const gold = theme.palette?.decorative?.gold || FALLBACK_GOLD;

  const borderRadius = ph.borderRadius ?? { xs: 16, sm: 20 };
  const hasPaperTexture = ph.backgroundImage === 'paper';
  const surface = theme.custom?.pageHeaderSurface ?? {};

  const paperSx = {
    p: 0,
    mb: 3,
    position: 'relative',
    overflow: 'hidden',
    borderRadius,
    backgroundColor: surface.backgroundColor ?? 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: `3px solid ${accent.border || accent.light}`,
    backgroundImage: hasPaperTexture && surface.backgroundImage
      ? [`url("${PATHS.PAPER_TEXTURE()}")`, surface.backgroundImage]
      : hasPaperTexture
        ? [`url("${PATHS.PAPER_TEXTURE()}")`, 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))']
        : (surface.backgroundImage ?? 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.7))'),
    backgroundBlendMode: hasPaperTexture ? 'overlay' : 'normal',
    backgroundSize: hasPaperTexture ? '200% 200%, cover' : 'cover',
    backgroundPosition: hasPaperTexture ? '0 0, center' : 'center',
    boxShadow: surface.boxShadow ?? `
      0 18px 50px rgba(15, 23, 42, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.6)
    `,
    ...(ph.goldOverlay && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(135deg, ${gold.accent} 0%, transparent 30%),
          linear-gradient(225deg, ${gold.accent} 0%, transparent 30%),
          linear-gradient(45deg, transparent 0%, ${gold.subtle || gold.accent} 50%, transparent 100%),
          linear-gradient(315deg, transparent 0%, ${gold.subtle || gold.accent} 50%, transparent 100%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
    ...(ph.centerLine && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '10%',
        right: '10%',
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accent.light || accent.border || 'rgba(139, 69, 19, 0.3)'}, transparent)`,
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
  };

  return (
    <Paper
      elevation={0}
      data-testid="page-header"
      sx={paperSx}
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
            fontSize: ph.titleFontSize ?? { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: subtitle ? 1 : 0,
            color: surface.titleColor ?? 'rgba(15, 23, 42, 0.92)',
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
              fontSize: ph.subtitleFontSize ?? { xs: '0.9rem', sm: '1rem' },
              color: surface.subtitleColor ?? 'rgba(51, 65, 85, 0.92)',
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
