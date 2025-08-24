import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, TextField, Box, Typography, Chip, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from '../auth/AuthProvider';
import Autocomplete from '@mui/material/Autocomplete';
import { ErrorDialogContext } from './CommonErrorDialog';
import { useTagHistory } from '../hooks/useTagHistory';
import { useMemo } from '../hooks/useMemo';
import CameraPasteOCR from './CameraPasteOCR';

const MemoAdd = ({ bookId, bookTags = [], onMemoAdded, onClose }) => {
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

  // 書籍のタグを初期値として設定（削除：タグ欄を空欄で開始するように変更）
  // useEffect(() => {
  //   if (bookTags && bookTags.length > 0) {
  //     setTags(bookTags);
  //   }
  // }, [bookTags]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    console.log('MemoAdd - handleSubmit開始:', { text, comment, page, tags });
    
    // 未確定のタグ入力があればtagsに追加
    let tagsToSave = tags;
    if (inputTagValue && !tags.includes(inputTagValue)) {
      tagsToSave = [...tags, inputTagValue];
    }
    console.log('MemoAdd - 保存するタグ:', tagsToSave);
    
    try {
      console.log('MemoAdd - addMemo呼び出し前');
      const memoId = await addMemo({
        text,
        comment,
        page: Number(page) || null,
        tags: tagsToSave,
      });
      console.log('MemoAdd - addMemo呼び出し完了, memoId:', memoId);
      await saveTagsToHistory(tagsToSave);
      console.log('MemoAdd - フォームリセット前');
      setText('');
      setComment('');
      setPage('');
      setTags([]);
      setInputTagValue('');
      console.log('MemoAdd - フォームリセット完了');
      
      // メモ追加完了を親コンポーネントに通知
      if (onMemoAdded) {
        console.log('MemoAdd - onMemoAddedコールバック呼び出し');
        onMemoAdded();
      }
    } catch (error) {
      console.error("Error adding memo: ", error);
      setGlobalError("メモの追加に失敗しました。");
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // OCR機能のコールバック
  const handleTextDetected = (detectedText) => {
    console.log('[MemoAdd] OCRで検出されたテキスト:', detectedText);
    setText(detectedText);
  };

  const isInDialog = !!onClose;

  if (isInDialog) {
    // ダイアログ内での表示
    return (
      <>
        <DialogTitle data-testid="memo-add-dialog-title">メモを追加</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }} data-testid="memo-add-form">
            <TextField
              label="引用・抜き書き"
              fullWidth
              multiline
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              inputProps={{ 'data-testid': 'memo-text-input' }}
            />
            <CameraPasteOCR onTextDetected={handleTextDetected} />
            <TextField
              label="感想・コメント"
              fullWidth
              multiline
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ 'data-testid': 'memo-comment-input' }}
            />
            <TextField
              label="ページ番号"
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              sx={{ mr: 2, width: { xs: '100%', sm: 'auto' } }}
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
                  fullWidth 
                  placeholder="例: 名言,感想,引用" 
                  inputProps={{ 
                    ...params.inputProps,
                    'data-testid': 'memo-tags-input' 
                  }} 
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} data-testid="memo-add-cancel">キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained" data-testid="memo-add-submit">メモを追加</Button>
        </DialogActions>
      </>
    );
  }

  // 通常のページ内での表示（既存の実装）
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }} data-testid="memo-add-form">
      <TextField
        label="引用・抜き書き"
        fullWidth
        multiline
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        inputProps={{ 'data-testid': 'memo-text-input' }}
      />
      <CameraPasteOCR onTextDetected={handleTextDetected} />
      <TextField
        label="感想・コメント"
        fullWidth
        multiline
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        inputProps={{ 'data-testid': 'memo-comment-input' }}
      />
      <TextField
        label="ページ番号"
        type="number"
        value={page}
        onChange={(e) => setPage(e.target.value)}
        sx={{ mr: 2, width: { xs: '100%', sm: 'auto' } }}
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
            fullWidth 
            placeholder="例: 名言,感想,引用" 
            inputProps={{ 
              ...params.inputProps,
              'data-testid': 'memo-tags-input' 
            }} 
          />
        )}
      />
      <Button 
        type="submit" 
        variant="contained" 
        sx={{ 
          mt: 2, 
          mb: { xs: 8, sm: 2 }, // モバイルではフッターメニューの上に余白を追加
          width: { xs: '100%', sm: 'auto' } // モバイルでは全幅
        }} 
        data-testid="memo-add-submit"
      >
        メモを追加
      </Button>
    </Box>
  );
};

export default MemoAdd; 