import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Alert,
  Typography,
  useTheme,
} from '@mui/material';

const sanitizeIsbn = (isbn) => {
  if (!isbn) return '';
  const trimmed = isbn.replace(/[^0-9Xx]/g, '');
  return trimmed.toUpperCase();
};

const BookEditDialog = ({ open, book, onClose, onSave }) => {
  const theme = useTheme();
  const coverDialogPreview = theme.custom?.sizes?.bookCoverDialogPreview ?? { maxHeight: 180 };
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [error, setError] = useState(null);

  const hasIsbn = useMemo(() => Boolean(book?.isbn), [book?.isbn]);

  useEffect(() => {
    if (open && book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setPublisher(book.publisher || '');
      setPublishedDate(book.publishedDate || '');
      setCoverImageUrl(book.coverImageUrl || '');
      setError(null);
      setIsSaving(false);
      setIsFetchingCover(false);
    }

    if (!open) {
      setError(null);
      setIsSaving(false);
      setIsFetchingCover(false);
    }
  }, [open, book]);

  const handleClose = () => {
    if (isSaving) return;
    onClose?.();
  };

  const handleFetchCover = () => {
    const normalizedIsbn = sanitizeIsbn(book?.isbn);
    if (!normalizedIsbn) {
      setError('ISBNが設定されていないため、書影を取得できません。');
      return;
    }

    const url = `https://cover.openbd.jp/${normalizedIsbn}.jpg`;
    setIsFetchingCover(true);
    setError(null);

    const image = new Image();
    image.onload = () => {
      setCoverImageUrl(url);
      setIsFetchingCover(false);
      setError(null);
    };
    image.onerror = () => {
      setIsFetchingCover(false);
      setError('openBDの書影が見つかりませんでした。');
    };
    image.src = url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('タイトルは必須です。');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave?.({
        title: trimmedTitle,
        author: author.trim(),
        publisher: publisher.trim(),
        publishedDate: publishedDate.trim(),
        coverImageUrl: coverImageUrl.trim(),
      });
      onClose?.();
    } catch (saveError) {
      console.error('Failed to update book:', saveError);
      setError('書籍情報の更新に失敗しました。');
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="book-edit-dialog"
    >
      <DialogTitle data-testid="book-edit-dialog-title">書籍情報を編集</DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={handleSubmit}
          id="book-edit-form"
          noValidate
        >
          <Stack spacing={2}>
            {book?.isbn && (
              <Box>
                <Typography variant="body2" color="text.secondary" data-testid="book-edit-isbn">
                  ISBN: {book.isbn}
                </Typography>
              </Box>
            )}
            <TextField
              label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              inputProps={{ 'data-testid': 'book-edit-title-input' }}
            />
            <TextField
              label="著者"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ 'data-testid': 'book-edit-author-input' }}
            />
            <TextField
              label="出版社"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ 'data-testid': 'book-edit-publisher-input' }}
            />
            <TextField
              label="出版日"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ 'data-testid': 'book-edit-published-date-input' }}
            />
            <TextField
              label="書影URL"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ 'data-testid': 'book-edit-cover-url-input' }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={handleFetchCover}
                disabled={!hasIsbn || isSaving || isFetchingCover}
                data-testid="book-edit-fetch-cover-button"
              >
                {isFetchingCover ? '取得中...' : 'openBD書影を設定'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setCoverImageUrl('');
                  setError(null);
                }}
                disabled={isSaving || isFetchingCover}
                data-testid="book-edit-clear-cover-button"
              >
                書影をクリア
              </Button>
            </Stack>
            {coverImageUrl && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <img
                  src={coverImageUrl}
                  alt="編集後の書影プレビュー"
                  style={{ maxHeight: coverDialogPreview.maxHeight, borderRadius: 4 }}
                  data-testid="book-edit-cover-preview"
                />
              </Box>
            )}
            {error && (
              <Alert
                severity="error"
                data-testid="book-edit-error"
              >
                {error}
              </Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isSaving}
          data-testid="book-edit-cancel"
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          form="book-edit-form"
          variant="contained"
          disabled={isSaving}
          data-testid="book-edit-save"
        >
          {isSaving ? '保存中...' : '保存する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookEditDialog;
