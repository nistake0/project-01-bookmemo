import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, TextField, Box, Typography, Chip } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useTagHistory } from '../hooks/useTagHistory';
import { useMemo } from '../hooks/useMemo';

const MemoAdd = ({ bookId, bookTags = [] }) => {
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { addMemo } = useMemo(bookId);
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState([]); // タグ配列
  const [inputTagValue, setInputTagValue] = useState("");

  // 共通フックを使用してタグ履歴を管理
  const { tagOptions, fetchTagHistory, saveTagsToHistory } = useTagHistory('memo', user);

  useEffect(() => {
    fetchTagHistory();
  }, [fetchTagHistory]);

  // 書籍のタグを初期値として設定
  useEffect(() => {
    if (bookTags && bookTags.length > 0) {
      setTags(bookTags);
    }
  }, [bookTags]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // 未確定のタグ入力があればtagsに追加
    let tagsToSave = tags;
    if (inputTagValue && !tags.includes(inputTagValue)) {
      tagsToSave = [...tags, inputTagValue];
    }
    try {
      await addMemo({
        text,
        comment,
        page: Number(page) || null,
        tags: tagsToSave,
      });
      await saveTagsToHistory(tagsToSave);
      setText('');
      setComment('');
      setPage('');
      setTags([]);
      setInputTagValue('');
    } catch (error) {
      console.error("Error adding memo: ", error);
      setGlobalError("メモの追加に失敗しました。");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }} data-testid="memo-add-form">
      <TextField
        label="引用・抜き書き"
        fullWidth
        multiline
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        margin="normal"
        required
        inputProps={{ 'data-testid': 'memo-text-input' }}
      />
      <TextField
        label="感想・コメント"
        fullWidth
        multiline
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        margin="normal"
        inputProps={{ 'data-testid': 'memo-comment-input' }}
      />
      <TextField
        label="ページ番号"
        type="number"
        value={page}
        onChange={(e) => setPage(e.target.value)}
        margin="normal"
        sx={{ mr: 2 }}
        inputProps={{ 'data-testid': 'memo-page-input' }}
      />
      <Autocomplete
        multiple
        freeSolo
        options={tagOptions}
        value={tags}
        getOptionLabel={option => typeof option === 'string' ? option : (option.inputValue || option.tag || '')}
        onChange={async (event, newValue) => {
          const normalized = (newValue || []).map(v => {
            if (typeof v === 'string') return v;
            if (v && typeof v === 'object') {
              if ('inputValue' in v && v.inputValue) return v.inputValue;
              if ('tag' in v && v.tag) return v.tag;
            }
            return '';
          }).filter(Boolean);
          setTags(normalized);
          await saveTagsToHistory(normalized);
        }}
        inputValue={inputTagValue}
        onInputChange={(event, newInputValue) => setInputTagValue(newInputValue)}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="タグ" 
            margin="normal" 
            fullWidth 
            placeholder="例: 名言,感想,引用" 
            inputProps={{ 
              ...params.inputProps,
              'data-testid': 'memo-tags-input' 
            }} 
          />
        )}
      />
      <Button type="submit" variant="contained" data-testid="memo-add-submit">メモを追加</Button>
    </Box>
  );
};

export default MemoAdd; 