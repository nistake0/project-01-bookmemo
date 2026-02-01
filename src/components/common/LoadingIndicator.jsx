import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 70%, 100% {
    transform: scale(0.5) translateY(0);
    opacity: 0.7;
  }
  35% {
    transform: scale(1.4) translateY(-16px);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const defaultDotShadow = '0 2px 10px rgba(25, 118, 210, 0.45)';

/**
 * 通信中表示用の共通ローディングコンポーネント
 * テーマに沿った色・配置を theme.custom.loadingIndicator から取得する。
 *
 * @param {Object} props
 * @param {'fullPage'|'inline'} [props.variant='inline'] - fullPage: 画面中央に大きく。inline: コンテンツ内にコンパクトに。
 * @param {string} [props.message] - 表示する文言（例: '読み込み中...'）。省略時はドットのみ。
 * @param {'medium'|'small'} [props.size='medium'] - ドットサイズ（inline時の目安）。
 * @param {string} [props['data-testid']] - テスト用ID。省略時は 'loading-indicator'。
 */
function LoadingIndicator({
  variant = 'inline',
  message,
  size = 'medium',
  'data-testid': dataTestId = 'loading-indicator',
}) {
  const theme = useTheme();
  const config = theme.custom?.loadingIndicator ?? {};
  const accentKey = config.accentKey ?? 'neutral';
  const accent = theme.palette?.decorative?.[accentKey];
  const dotColor = accent?.main ?? theme.palette?.primary?.main ?? '#1976d2';
  const containerStyle = config.container ?? {};
  const customSizes = config.sizes ?? {};

  const isFullPage = variant === 'fullPage';
  const dotSize = isFullPage ? (customSizes.dotFullPage ?? 14) : size === 'small' ? (customSizes.dotSmall ?? 9) : (customSizes.dotInline ?? 11);
  const gap = isFullPage ? (customSizes.gapFullPage ?? 12) : size === 'small' ? (customSizes.gapSmall ?? 7) : (customSizes.gapInline ?? 9);

  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isFullPage ? 2 : 1.5,
    animation: `${fadeIn} 0.25s ease-out`,
    ...containerStyle,
    ...(isFullPage && {
      position: 'fixed',
      inset: 0,
      zIndex: 1300,
      minHeight: '100vh',
      width: '100%',
      py: 4,
      px: 3,
    }),
    ...(!isFullPage && !containerStyle.padding && !containerStyle.px && { padding: 3 }),
  };

  const dotsSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap,
  };

  const dotShadow = config.dotShadow ?? defaultDotShadow;
  const dotSx = (delay) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: dotColor,
    animation: `${bounce} 0.7s ease-in-out ${delay} infinite both`,
    boxShadow: dotShadow,
  });

  return (
    <Box data-testid={dataTestId} sx={containerSx}>
      <Box sx={dotsSx}>
        <Box sx={dotSx(0)} />
        <Box sx={dotSx(0.12)} />
        <Box sx={dotSx(0.24)} />
      </Box>
      {message && (
        <Typography
          variant={isFullPage ? 'body1' : 'body2'}
          color="text.primary"
          sx={{ fontWeight: 600 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingIndicator;
