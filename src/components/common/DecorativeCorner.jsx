import React from 'react';
import { Box, useTheme } from '@mui/material';

const FALLBACK_COLORS = {
  fill: 'rgba(184, 134, 11, 0.4)',
  stroke: 'rgba(139, 69, 19, 0.5)',
  strokeInner: 'rgba(184, 134, 11, 0.3)',
};

/**
 * カードの角に装飾的な金具風の装飾を追加
 * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position
 * @param {number} size - 一辺のピクセル
 * @param {string} accentKey - テーマの decorative キー（brown, neutral 等）
 */
function DecorativeCorner({ position = 'top-left', size = 24, accentKey = 'brown' }) {
  const theme = useTheme();
  const gold = theme.palette?.decorative?.gold;
  const accent = theme.palette?.decorative?.[accentKey];

  const fill = gold?.stroke || FALLBACK_COLORS.fill;
  const stroke = accent?.main || accent?.border || FALLBACK_COLORS.stroke;
  const strokeInner = gold?.strokeLight || gold?.accent || FALLBACK_COLORS.strokeInner;

  const positions = {
    'top-left': { top: 0, left: 0, transform: 'rotate(0deg)' },
    'top-right': { top: 0, right: 0, transform: 'rotate(90deg)' },
    'bottom-left': { bottom: 0, left: 0, transform: 'rotate(-90deg)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'rotate(180deg)' },
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positions[position],
        width: size,
        height: size,
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: 2,
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="0.5"
        />
        <path
          d="M 2 2 L 22 2 L 22 6 L 6 6 L 6 22 L 2 22 Z"
          fill="none"
          stroke={strokeInner}
          strokeWidth="0.3"
        />
      </svg>
    </Box>
  );
}

export default DecorativeCorner;
