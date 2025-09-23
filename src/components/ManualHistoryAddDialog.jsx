import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { 
  BOOK_STATUS, 
  BOOK_STATUS_LABELS, 
  isValidBookStatus 
} from '../constants/bookStatus';
import { useHistoryValidation } from '../hooks/useHistoryValidation';

/**
 * 手動ステータス履歴追加ダイアログ
 */
const ManualHistoryAddDialog = ({ 
  open, 
  onClose, 
  onAdd, 
  bookId,
  existingHistory = [],
  currentBookStatus = null
}) => {
  const [date, setDate] = useState(new Date());
  const [status, setStatus] = useState(BOOK_STATUS.READING);
  const [previousStatus, setPreviousStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { validate } = useHistoryValidation();

  // 前のステータス候補を取得（既存履歴から）
  const getPreviousStatusOptions = () => {
    // 現在選択されているステータスと同じものを除外
    // ただし、「なし」オプションも含める
    return Object.values(BOOK_STATUS).filter(s => s !== status);
  };

  // 現在のステータスが変更されたときに前のステータスをリセット
  React.useEffect(() => {
    if (previousStatus === status) {
      setPreviousStatus('');
    }
  }, [status, previousStatus]);

  // ダイアログが開かれたときに前のステータスをデフォルト設定
  React.useEffect(() => {
    if (open) {
      // 現在の書籍のステータスを前のステータスのデフォルト値として設定
      if (currentBookStatus && currentBookStatus !== status) {
        setPreviousStatus(currentBookStatus);
      } else {
        setPreviousStatus('');
      }
    }
  }, [open, currentBookStatus, status]);

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      // バリデーション（フックへ委譲）
      validate(date, status, previousStatus, existingHistory);

      await onAdd(date, status, previousStatus, existingHistory);
      
      // ダイアログを閉じてフォームをリセット
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDate(new Date());
    setStatus(BOOK_STATUS.READING);
    setPreviousStatus('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📝 ステータス履歴を追加
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <DateTimePicker
              label="日時"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              maxDateTime={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="ステータス"
              >
                {Object.entries(BOOK_STATUS_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>前のステータス</InputLabel>
              <Select
                value={previousStatus}
                onChange={(e) => setPreviousStatus(e.target.value)}
                label="前のステータス"
              >
                <MenuItem value="">
                  <em>なし</em>
                </MenuItem>
                {getPreviousStatusOptions().map((statusKey) => (
                  <MenuItem key={statusKey} value={statusKey}>
                    {BOOK_STATUS_LABELS[statusKey]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ManualHistoryAddDialog;
