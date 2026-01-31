import React, { useState } from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Stack, Chip, useMediaQuery, Rating, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSwipeable } from 'react-swipeable';
import { getMemoRatingValue } from '../constants/memoRating';
import DecorativeCorner from './common/DecorativeCorner';

// CI環境でも安定する固定フォーマットで日付を表示（yyyy/M/d）
const formatDateYMD = (createdAt) => {
  try {
    const date = createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : null);
    if (!date) return '';
    const yyyy = date.getFullYear();
    const m = date.getMonth() + 1; // 月は0始まりのため+1
    const d = date.getDate();
    return `${yyyy}/${m}/${d}`;
  } catch (e) {
    return '';
  }
};

const FALLBACK_ACCENT = {
  light: 'rgba(139, 69, 19, 0.2)',
  lighter: 'rgba(139, 69, 19, 0.1)',
  borderHover: 'rgba(139, 69, 19, 0.3)',
};

const MemoCard = ({ memo, onEdit, onDelete, onClick }) => {
  const theme = useTheme();
  const accentKey = theme.custom?.cardAccent || 'brown';
  const accent = theme.palette?.decorative?.[accentKey] || FALLBACK_ACCENT;
  const decorations = theme.custom?.cardDecorations ?? { corners: true, innerBorder: true, centerLine: true };
  const glass = theme.custom?.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };

  const cardSx = {
    position: 'relative',
    maxWidth: '100%',
    mx: 'auto',
    cursor: onClick ? 'pointer' : 'default',
    backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
    backdropFilter: `blur(${glass.blur}) saturate(${glass.saturate})`,
    border: `2px solid ${accent.light}`,
    borderRadius: 3,
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,
    overflow: 'visible',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      boxShadow: `
        0 12px 40px rgba(0, 0, 0, 0.16),
        0 4px 12px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.6)
      `,
      borderColor: accent.borderHover || accent.light,
    },
    ...(decorations.innerBorder && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        border: `1px solid ${accent.lighter}`,
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
    ...(decorations.centerLine && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 1,
        height: '100%',
        background: `linear-gradient(to bottom, transparent, ${accent.lighter}, transparent)`,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
  };

  const isMobile = useMediaQuery('(max-width:600px)');
  const [showActions, setShowActions] = useState(false);
  const maxLines = 2;
  const lines = memo.text ? memo.text.split('\n') : [];
  const shortText = lines.slice(0, maxLines).join('\n');
  const createdAt = memo.createdAt && memo.createdAt.toDate ? memo.createdAt.toDate() : null;

  const handleEdit = (e) => {
    if (e) e.stopPropagation();
    setShowActions(false);
    if (typeof onEdit === 'function') onEdit(memo, true); // editMode=true
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation();
    setShowActions(false);
    onDelete(memo.id);
  };

  // スワイプ検知
  const handlers = useSwipeable({
    onSwipedLeft: () => setShowActions(true),
    onSwipedRight: () => setShowActions(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // モバイルのみスワイプUI、PCは従来通り
  if (isMobile) {
    return (
      <Box 
        position="relative" 
        {...handlers} 
        data-allow-local-swipe 
        sx={{ mb: 2 }}
      >
        <Card
          data-testid="memo-card"
          sx={{
            ...cardSx,
            transform: showActions ? 'translateX(-100px)' : 'none',
            '&:hover': {
              ...cardSx['&:hover'],
              transform: showActions ? 'translateX(-100px)' : 'translateY(-2px)',
            },
          }}
          onClick={onClick ? () => onClick(memo, false) : undefined} // editMode=false
        >
          {decorations.corners && (
            <>
              <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
              <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
            </>
          )}
          <CardContent sx={{ 
            pb: 0.5, // パディングを少し減らす
            minHeight: 48, 
            maxHeight: 80, // ランク表示分をさらに追加
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2, // 行間を調整
              }}
            >
              {shortText}
            </Typography>
            {memo.comment && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2, // 行間を調整
                  mt: 0.25, // 上マージンを最小限に
                }}
              >
                {memo.comment}
              </Typography>
            )}
            
            {/* ランク表示（モバイル） */}
            {getMemoRatingValue(memo) > 0 && (
              <Rating 
                value={getMemoRatingValue(memo)} 
                readOnly 
                size="small"
                sx={{ mt: 0.25, mb: 0.25 }} // マージンを調整
              />
            )}
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {memo.page && <Typography variant="caption">p.{memo.page}</Typography>}
              {createdAt && <Typography variant="caption" color="text.secondary">{formatDateYMD(createdAt)}</Typography>}
              {Array.isArray(memo.tags) && memo.tags.map((tag, idx) => (
                <Chip key={idx} label={tag} size="small" color="secondary" />
              ))}
            </Stack>
          </CardActions>
        </Card>
        {/* スライドインする編集・削除ボタン */}
        {showActions && (
          <Box
            position="absolute"
            top={0}
            right={0}
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            zIndex={2}
            sx={{ p: 1, gap: 1 }}
          >
            <IconButton onClick={handleEdit} sx={{ bgcolor: 'primary.main', color: 'white', mb: 1 }} size="large">
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete} sx={{ bgcolor: 'error.main', color: 'white' }} size="large">
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  }

  // PC用（従来通り）
  return (
    <Card
      data-testid="memo-card"
      sx={{
        ...cardSx,
        '&:hover': {
          ...cardSx['&:hover'],
          transform: 'translateY(-4px)',
        },
      }}
      onClick={onClick ? () => onClick(memo, false) : undefined} // editMode=false
    >
      {decorations.corners && (
        <>
          <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
          <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
        </>
      )}
      <CardContent sx={{ 
        pb: 1, 
        minHeight: { xs: 48, sm: 64 }, 
        maxHeight: { xs: 72, sm: 88 }, // ランク表示分の高さを追加
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {shortText}
        </Typography>
        {memo.comment && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {memo.comment}
          </Typography>
        )}
        
        {/* ランク表示（PC） */}
        {getMemoRatingValue(memo) > 0 && (
          <Rating 
            value={getMemoRatingValue(memo)} 
            readOnly 
            size="small"
            sx={{ mt: 0.5 }}
          />
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {memo.page && <Typography variant="caption">p.{memo.page}</Typography>}
          {createdAt && <Typography variant="caption" color="text.secondary">{formatDateYMD(createdAt)}</Typography>}
          {Array.isArray(memo.tags) && memo.tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" color="secondary" />
          ))}
        </Stack>
        {/* デスクトップ用のボタン（モバイルでは非表示） */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <IconButton
            aria-label="edit"
            onClick={handleEdit}
            size="small"
            data-testid="memo-edit-button"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="delete"
            onClick={handleDelete}
            size="small"
            data-testid="memo-delete-button"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

export default MemoCard; 