import React, { useState } from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Stack, Chip, useMediaQuery, Rating, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSwipeable } from 'react-swipeable';
import { getMemoRatingValue } from '../constants/memoRating';
import DecorativeCorner from './common/DecorativeCorner';
import { getMemoCardSx, getMemoAccent, getMemoDecorations } from '../theme/cardStyles';

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

const MemoCard = ({ memo, onEdit, onDelete, onClick, showActions = true, bookTitle, 'data-testid': dataTestId }) => {
  const theme = useTheme();
  const memoCardSize = theme.custom?.sizes?.memoCard ?? {
    textArea: { minHeight: 48, maxHeight: 80 },
    actionArea: { minHeight: { xs: 48, sm: 64 }, maxHeight: { xs: 72, sm: 88 } },
  };
  const cardSx = getMemoCardSx(theme, {
    overrides: {
      position: 'relative',
      maxWidth: '100%',
      mx: 'auto',
      cursor: onClick ? 'pointer' : 'default',
    },
  });
  const { key: accentKey } = getMemoAccent(theme);
  const decorations = getMemoDecorations(theme);

  const isMobile = useMediaQuery('(max-width:600px)');
  const [swipeRevealed, setSwipeRevealed] = useState(false);
  const maxLines = 2;
  const lines = memo.text ? memo.text.split('\n') : [];
  const shortText = lines.slice(0, maxLines).join('\n');
  const createdAt = memo.createdAt && memo.createdAt.toDate ? memo.createdAt.toDate() : null;

  const handleEdit = (e) => {
    if (e) e.stopPropagation();
    setSwipeRevealed(false);
    if (typeof onEdit === 'function') onEdit(memo, true); // editMode=true
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation();
    setSwipeRevealed(false);
    if (typeof onDelete === 'function') onDelete(memo.id);
  };

  // スワイプ検知（showActions 時のみ）
  const handlers = useSwipeable({
    onSwipedLeft: () => setSwipeRevealed(true),
    onSwipedRight: () => setSwipeRevealed(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // モバイル＋編集可能時のみスワイプUI
  if (isMobile && showActions) {
    return (
      <Box 
        position="relative" 
        {...handlers} 
        data-allow-local-swipe 
        sx={{ mb: 2 }}
      >
        <Card
          data-testid={dataTestId ?? 'memo-card'}
          sx={{
            ...cardSx,
            transform: swipeRevealed ? 'translateX(-100px)' : 'none',
            '&:hover': {
              ...cardSx['&:hover'],
              transform: swipeRevealed ? 'translateX(-100px)' : 'translateY(-2px)',
            },
          }}
          onClick={onClick ? (e) => {
            if (window.getSelection?.()?.toString()) return; // テキスト選択中はカードクリックを無効化
            onClick(memo, false);
          } : undefined} // editMode=false
        >
          {decorations.corners && (
            <>
              <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
              <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
            </>
          )}
          <CardContent sx={{
            pb: 0.5,
            ...memoCardSize.textArea,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}>
            {bookTitle != null && bookTitle !== '' && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                📝 {bookTitle} - ページ{memo.page ?? '未設定'}
              </Typography>
            )}
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text',
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
                  lineHeight: 1.2,
                  mt: 0.25,
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                  msUserSelect: 'text',
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
        {swipeRevealed && (
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

  // PC用、または showActions=false のモバイル（スワイプなし）
  return (
    <Card
      data-testid={dataTestId ?? 'memo-card'}
      sx={{
        ...cardSx,
        '&:hover': {
          ...cardSx['&:hover'],
          transform: 'translateY(-4px)',
        },
      }}
      onClick={onClick ? (e) => {
        if (window.getSelection?.()?.toString()) return; // テキスト選択中はカードクリックを無効化
        onClick(memo, false);
      } : undefined} // editMode=false
    >
      {decorations.corners && (
        <>
          <DecorativeCorner position="top-left" size={20} accentKey={accentKey} />
          <DecorativeCorner position="top-right" size={20} accentKey={accentKey} />
        </>
      )}
      <CardContent sx={{
        pb: 1,
        ...memoCardSize.actionArea,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {bookTitle != null && bookTitle !== '' && (
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            📝 {bookTitle} - ページ{memo.page ?? '未設定'}
          </Typography>
        )}
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
        {/* デスクトップ用のボタン（showActions 時のみ、モバイルでは非表示） */}
        {showActions && (
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
        )}
      </CardActions>
    </Card>
  );
};

export default MemoCard; 