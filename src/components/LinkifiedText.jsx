import React from 'react';
import { Link, Typography } from '@mui/material';
import { parseUrls } from '../utils/textUtils';

/**
 * テキスト内のURLをハイパーリンクに変換して表示するコンポーネント
 * XSS対策: dangerouslySetInnerHTML は使用せず、React要素として構築
 *
 * @param {Object} props
 * @param {string} props.text - 表示するテキスト
 * @param {Object} [props.sx] - Typography に渡す sx
 * @param {Object} [props.component] - ルート要素（Typography の component、未指定時は variant のデフォルト）
 * @param {string} [props.variant] - Typography の variant
 */
function LinkifiedText({ text, sx = {}, component, variant, ...rest }) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const parts = parseUrls(text);

  const content = parts.map((part, idx) =>
    part.isUrl ? (
      <Link
        key={idx}
        href={part.text}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
        onClick={(e) => e.stopPropagation()}
      >
        {part.text}
      </Link>
    ) : (
      <span key={idx}>{part.text}</span>
    )
  );

  return (
    <Typography
      component={component}
      variant={variant}
      sx={{
        whiteSpace: 'pre-line',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text',
        ...sx,
      }}
      {...rest}
    >
      {content}
    </Typography>
  );
}

export default LinkifiedText;
