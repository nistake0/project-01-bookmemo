import React from 'react';
import { Box } from '@mui/material';

/**
 * カードの角に装飾的な金具風の装飾を追加（design-improvement-proposal）
 * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position
 * @param {number} size - 一辺のピクセル
 */
function DecorativeCorner({ position = 'top-left', size = 24 }) {
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
          fill="rgba(184, 134, 11, 0.4)"
          stroke="rgba(139, 69, 19, 0.5)"
          strokeWidth="0.5"
        />
        <path
          d="M 2 2 L 22 2 L 22 6 L 6 6 L 6 22 L 2 22 Z"
          fill="none"
          stroke="rgba(184, 134, 11, 0.3)"
          strokeWidth="0.3"
        />
      </svg>
    </Box>
  );
}

export default DecorativeCorner;
