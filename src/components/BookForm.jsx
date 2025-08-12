import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Grid, Autocomplete } from '@mui/material';
import { useTagHistory } from '../hooks/useTagHistory';
import { useBookActions } from '../hooks/useBookActions';
import { useBookSearch } from '../hooks/useBookSearch';

export default function BookForm({ isbn: isbnProp = "", onBookAdded }) {
  const [isbn, setIsbn] = useState(isbnProp);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [inputTagValue, setInputTagValue] = useState("");

  // 共通フックを使用
  const { tagOptions, fetchTagHistory } = useTagHistory('book');
  const { addBook, loading: addBookLoading, error: addBookError } = useBookActions();
  const { searchBookByIsbn, loading: searchLoading, error: searchError, searchPerformed } = useBookSearch();

  useEffect(() => {
    fetchTagHistory();
  }, [fetchTagHistory]);

  // propsのisbnが変わったら反映＆自動取得
  useEffect(() => {
    if (isbnProp && isbnProp !== isbn) {
      console.log("[BookForm] useEffect: propsのisbnが変化:", isbnProp);
      setIsbn(isbnProp);
      // 自動で書籍情報取得
      if (isbnProp.trim() !== "") {
        console.log("[BookForm] useEffect: 自動で書籍情報取得を実行", isbnProp);
        handleFetchBookInfo(isbnProp);
      }
    }
  }, [isbnProp, isbn]);

  // 書籍情報取得処理
  const handleFetchBookInfo = async (overrideIsbn) => {
    const targetIsbn = overrideIsbn !== undefined ? overrideIsbn : isbn;
    if (!targetIsbn || !targetIsbn.trim()) return;

    const bookData = await searchBookByIsbn(targetIsbn);
    if (bookData) {
      setTitle(bookData.title);
      setAuthor(bookData.author);
      setPublisher(bookData.publisher);
      setPublishedDate(bookData.publishedDate);
      setCoverImageUrl(bookData.coverImageUrl);
      setTags(bookData.tags);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title) return;

    const bookData = {
      isbn,
      title,
      author,
      publisher,
      publishedDate,
      coverImageUrl,
      tags,
      inputTagValue,
    };

    const bookId = await addBook(bookData);
    if (bookId) {
      onBookAdded(bookId);
    }
  };

  return (
    <Box component="form" onSubmit={handleAdd} sx={{ mt: 1 }} role="form" data-testid="book-form">
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            fullWidth
            placeholder="例: 9784873119485"
            inputProps={{ "data-testid": "book-isbn-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Button
            onClick={() => handleFetchBookInfo()}
            variant="outlined"
            disabled={searchLoading}
            sx={{ mt: { xs: 0, sm: 1 } }}
            fullWidth
            data-testid="book-fetch-button"
          >
            {searchLoading ? '取得中...' : 'ISBNで書籍情報取得'}
          </Button>
        </Grid>
      </Grid>

      {coverImageUrl && (
        <Box sx={{ textAlign: 'center', my: 1 }}>
          <img src={coverImageUrl} alt="表紙" style={{ maxHeight: '150px', width: 'auto' }} data-testid="book-cover-image" />
        </Box>
      )}

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            inputProps={{ "data-testid": "book-title-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="著者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            inputProps={{ "data-testid": "book-author-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="出版社"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            fullWidth
            inputProps={{ "data-testid": "book-publisher-input" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="出版日"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            fullWidth
            inputProps={{ "data-testid": "book-publishdate-input" }}
          />
        </Grid>
      </Grid>

      <Autocomplete
        multiple
        freeSolo
        options={tagOptions}
        value={tags}
        getOptionLabel={option => typeof option === 'string' ? option : (option.inputValue || option.tag || '')}
        onChange={(event, newValue) => {
          const normalized = (newValue || []).map(v => {
            if (typeof v === 'string') return v;
            if (v && typeof v === 'object') {
              if ('inputValue' in v && v.inputValue) return v.inputValue;
              if ('tag' in v && v.tag) return v.tag;
            }
            return '';
          }).filter(Boolean);
          setTags(normalized);
        }}
        inputValue={inputTagValue}
        onInputChange={(event, newInputValue) => setInputTagValue(newInputValue)}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="タグ" 
            fullWidth 
            placeholder="例: 小説,名作,技術書" 
            inputProps={{ 
              ...params.inputProps,
              'data-testid': 'book-tags-input' 
            }} 
          />
        )}
      />

      {(searchError || addBookError) && (
        <Typography color="error" sx={{ mt: 1 }} data-testid="book-form-error">
          {searchError || addBookError}
        </Typography>
      )}

      <Button 
        type="submit" 
        variant="contained" 
        disabled={addBookLoading}
        sx={{ 
          mt: 2, 
          mb: { xs: 8, sm: 2 }, // モバイルではフッターメニューの上に余白を追加
          width: { xs: '100%', sm: 'auto' } // モバイルでは全幅
        }} 
        data-testid="book-add-submit"
      >
        {addBookLoading ? '追加中...' : '本を追加'}
      </Button>
    </Box>
  );
} 