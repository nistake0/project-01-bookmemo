import React from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Stack, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const MemoCard = ({ memo, onEdit, onDelete, onClick }) => {
  // カードの高さを制限し、本文・コメントは2行まで省略表示
  // メタ情報は1行にまとめて横並び
  const maxLines = 2;
  const lines = memo.text ? memo.text.split('\n') : [];
  const shortText = lines.slice(0, maxLines).join('\n');
  const isLong = lines.length > maxLines;
  const createdAt = memo.createdAt && memo.createdAt.toDate ? memo.createdAt.toDate() : null;

  return (
    <Card 
      data-testid="memo-card" 
      sx={{ position: 'relative', maxWidth: '100%', mx: 'auto', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick ? () => onClick(memo) : undefined}
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
          {createdAt && <Typography variant="caption" color="text.secondary">{createdAt.toLocaleDateString()}</Typography>}
          {Array.isArray(memo.tags) && memo.tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" color="secondary" />
          ))}
        </Stack>
        <Box>
          <IconButton 
            aria-label="edit" 
            onClick={() => onEdit(memo)} 
            size="small"
            data-testid="memo-edit-button"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            aria-label="delete" 
            onClick={() => onDelete(memo.id)} 
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