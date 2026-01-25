import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.1);
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

/**
 * 通信中表示用の共通ローディングコンポーネント
 * バウンスアニメーションのドット＋オプションのラベルで、テーマに沿ったデザインを提供する。
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
  const isFullPage = variant === 'fullPage';
  const dotSize = isFullPage ? 12 : size === 'small' ? 8 : 10;
  const gap = isFullPage ? 10 : size === 'small' ? 6 : 8;

  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isFullPage ? 2 : 1.5,
    animation: `${fadeIn} 0.25s ease-out`,
    ...(isFullPage && {
      minHeight: '50vh',
      width: '100%',
      py: 4,
    }),
    ...(!isFullPage && {
      padding: 3,
    }),
  };

  const dotsSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap,
  };

  const dotSx = (delay) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    bgcolor: 'primary.main',
    animation: `${bounce} 1.2s ease-in-out ${delay} infinite both`,
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.35)',
  });

  return (
    <Box data-testid={dataTestId} sx={containerSx}>
      <Box sx={dotsSx}>
        <Box sx={dotSx(0)} />
        <Box sx={dotSx(0.15)} />
        <Box sx={dotSx(0.3)} />
      </Box>
      {message && (
        <Typography
          variant={isFullPage ? 'body1' : 'body2'}
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingIndicator;
