import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, TextField, Autocomplete, Chip, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useTagHistory } from '../hooks/useTagHistory';
import { useBookActions } from '../hooks/useBookActions';
import { useBookSearch } from '../hooks/useBookSearch';
import { useAuth } from '../auth/AuthProvider';
import { BOOK_STATUS, ALL_BOOK_STATUSES, getBookStatusLabel, ACQUISITION_TYPE, ALL_ACQUISITION_TYPES, getAcquisitionTypeLabel } from '../constants/bookStatus';
import ExternalBookSearch from './ExternalBookSearch';

export default function BookForm({ isbn: isbnProp = "", onBookAdded }) {
  const [isbn, setIsbn] = useState(isbnProp);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [inputTagValue, setInputTagValue] = useState("");
  const [status, setStatus] = useState(BOOK_STATUS.TSUNDOKU);
  const [acquisitionType, setAcquisitionType] = useState(ACQUISITION_TYPE.UNKNOWN);
  const [isExternalSearchMode, setIsExternalSearchMode] = useState(false);

  // 共通フックを使用
  const { user } = useAuth();
  const { tagOptions, fetchTagHistory } = useTagHistory('book', user);
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
      status,
      acquisitionType,
    };

    const bookId = await addBook(bookData);
    if (bookId) {
      onBookAdded(bookId);
    }
  };


  // 外部検索モードの切り替え
  const handleExternalSearchToggle = () => {
    setIsExternalSearchMode(!isExternalSearchMode);
  };

  // 外部検索で書籍選択された時の処理
  const handleExternalBookSelect = (book) => {
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPublishedDate(book.publishedDate);
    setCoverImageUrl(book.coverImageUrl);
    setIsbn(book.isbn);
    setIsExternalSearchMode(false);
  };

  // 外部検索キャンセル時の処理
  const handleExternalSearchCancel = () => {
    setIsExternalSearchMode(false);
  };

  return (
    <Box component="form" onSubmit={handleAdd} sx={{ mt: { xs: 1, sm: 2 } }} role="form" data-testid="book-form">
      {/* ISBN入力エリア */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: { xs: 1, sm: 1.5 }
      }}>
        <Box>
          <TextField
            label="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            fullWidth
            size="small"
            placeholder="例: 9784873119485"
            inputProps={{ "data-testid": "book-isbn-input" }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        </Box>
        <Box>
          <Button
            onClick={() => handleFetchBookInfo()}
            variant="outlined"
            disabled={searchLoading}
            sx={{ 
              mt: { xs: 1, sm: 0 },
              height: { xs: '40px', sm: '56px' },
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
            fullWidth
            data-testid="book-fetch-button"
          >
            {searchLoading ? '取得中...' : 'ISBNで書籍情報取得'}
          </Button>
        </Box>
      </Box>

      {/* 外部検索ボタン（常時表示） */}
      <Box sx={{ mt: 1.5, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleExternalSearchToggle}
          startIcon={<span>🔍</span>}
          data-testid="external-search-button"
          sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            px: 3,
            py: 1
          }}
        >
          外部検索で書籍を探す
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          ISBNが分からない場合や、より詳細な情報を探す場合にご利用ください
        </Typography>
      </Box>


      {/* 外部検索モード時のUI */}
      {isExternalSearchMode && (
        <ExternalBookSearch
          onBookSelect={handleExternalBookSelect}
          onCancel={handleExternalSearchCancel}
        />
      )}

      {/* 表紙画像表示 */}
      {coverImageUrl && (
        <Box sx={{ 
          textAlign: 'center', 
          my: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 0 }
        }}>
          <img 
            src={coverImageUrl} 
            alt="表紙" 
            style={{ 
              maxHeight: '120px', 
              maxWidth: '100%',
              width: 'auto',
              borderRadius: '4px'
            }} 
            data-testid="book-cover-image" 
          />
        </Box>
      )}

      {/* 基本情報入力エリア */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: { xs: 1, sm: 1.5 },
        mt: { xs: 0.5, sm: 1 }
      }}>
        <Box>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            size="small"
            inputProps={{ "data-testid": "book-title-input" }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        </Box>
        <Box>
          <TextField
            label="著者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ "data-testid": "book-author-input" }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        </Box>
        <Box>
          <TextField
            label="出版社"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ "data-testid": "book-publisher-input" }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        </Box>
        <Box>
          <TextField
            label="出版日"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ "data-testid": "book-publishdate-input" }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        </Box>
      </Box>

      {/* タグ入力エリア */}
      <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
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
              size="small"
              placeholder="例: 小説,名作,技術書" 
              inputProps={{ 
                ...params.inputProps,
                'data-testid': 'book-tags-input',
                style: { fontSize: '0.9rem' }
              }} 
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          )}
          sx={{
            '& .MuiChip-root': {
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              height: { xs: '24px', sm: '28px' }
            }
          }}
        />
      </Box>

      {/* ステータス選択エリア */}
      <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
        <FormControl fullWidth size="small">
          <InputLabel id="book-status-label">ステータス</InputLabel>
          <Select
            labelId="book-status-label"
            value={status}
            label="ステータス"
            onChange={(e) => setStatus(e.target.value)}
            data-testid="book-status-select"
            sx={{
              '& .MuiSelect-select': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          >
            {ALL_BOOK_STATUSES.map((statusValue) => (
              <MenuItem key={statusValue} value={statusValue}>
                {getBookStatusLabel(statusValue)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 取得方法選択エリア */}
      <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
        <FormControl fullWidth size="small">
          <InputLabel id="book-acquisition-type-label">取得方法</InputLabel>
          <Select
            labelId="book-acquisition-type-label"
            value={acquisitionType}
            label="取得方法"
            onChange={(e) => setAcquisitionType(e.target.value)}
            data-testid="book-acquisition-type-select"
            sx={{
              '& .MuiSelect-select': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          >
            {ALL_ACQUISITION_TYPES.map((typeValue) => (
              <MenuItem key={typeValue} value={typeValue}>
                {getAcquisitionTypeLabel(typeValue)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* エラーメッセージ */}
      {(searchError || addBookError) && (
        <Typography 
          color="error" 
          sx={{ 
            mt: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }} 
          data-testid="book-form-error"
        >
          {searchError || addBookError}
        </Typography>
      )}

      {/* 送信ボタン */}
      <Button 
        type="submit" 
        variant="contained" 
        disabled={addBookLoading}
        sx={{ 
          mt: { xs: 2, sm: 3 }, 
          mb: { xs: "72px", sm: 2 }, // モバイルではフッターメニューの上に余白を追加
          width: { xs: '100%', sm: 'auto' }, // モバイルでは全幅
          fontSize: { xs: '0.9rem', sm: '1rem' },
          py: { xs: 1.5, sm: 2 }
        }} 
        data-testid="book-add-submit"
      >
        {addBookLoading ? '追加中...' : '本を追加'}
      </Button>
    </Box>
  );
} 