import React, { useState } from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Stack, Chip, useMediaQuery } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useSwipeable } from 'react-swipeable';

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

const MemoCard = ({ memo, onEdit, onDelete, onClick }) => {
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
      <Box position="relative" {...handlers} sx={{ mb: 2 }}>
        <Card
          data-testid="memo-card"
          sx={{
            position: 'relative',
            maxWidth: '100%',
            mx: 'auto',
            cursor: onClick ? 'pointer' : 'default',
            bgcolor: 'background.paper',
            transition: 'transform 0.2s',
            transform: showActions ? 'translateX(-100px)' : 'none',
          }}
          onClick={onClick ? () => onClick(memo, false) : undefined} // editMode=false
        >
          <CardContent sx={{ pb: 1, minHeight: 48, maxHeight: 56, overflow: 'hidden' }}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
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
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                }}
              >
                {memo.comment}
              </Typography>
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
        position: 'relative',
        maxWidth: '100%',
        mx: 'auto',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: 'background.paper',
      }}
      onClick={onClick ? () => onClick(memo, false) : undefined} // editMode=false
    >
      <CardContent sx={{ pb: 1, minHeight: 48, maxHeight: 56, overflow: 'hidden' }}>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
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
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
            }}
          >
            {memo.comment}
          </Typography>
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