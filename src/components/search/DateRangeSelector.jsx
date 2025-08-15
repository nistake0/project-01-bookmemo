import { useState } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  Paper
} from '@mui/material';

/**
 * 日時範囲選択コンポーネント
 * 
 * @param {Object} props
 * @param {Object} props.value - 現在の日時範囲
 * @param {Function} props.onChange - 日時範囲変更時のコールバック
 */
function DateRangeSelector({ value, onChange }) {
  const [dateRangeType, setDateRangeType] = useState(value?.type || 'none');
  const [year, setYear] = useState(value?.year || new Date().getFullYear());
  const [month, setMonth] = useState(value?.month || 1);
  const [quarter, setQuarter] = useState(value?.quarter || 1);
  const [startDate, setStartDate] = useState(value?.startDate || '');
  const [endDate, setEndDate] = useState(value?.endDate || '');

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setDateRangeType(newType);
    
    let newValue = { type: newType };
    
    switch (newType) {
      case 'year':
        newValue.year = year;
        break;
      case 'month':
        newValue.year = year;
        newValue.month = month;
        break;
      case 'quarter':
        newValue.year = year;
        newValue.quarter = quarter;
        break;
      case 'custom':
        newValue.startDate = startDate;
        newValue.endDate = endDate;
        break;
      default:
        break;
    }
    
    onChange?.(newValue);
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setYear(newYear);
    onChange?.({ ...value, year: newYear });
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setMonth(newMonth);
    onChange?.({ ...value, month: newMonth });
  };

  const handleQuarterChange = (event) => {
    const newQuarter = event.target.value;
    setQuarter(newQuarter);
    onChange?.({ ...value, quarter: newQuarter });
  };

  const handleStartDateChange = (event) => {
    const newStartDate = event.target.value;
    setStartDate(newStartDate);
    onChange?.({ ...value, startDate: newStartDate });
  };

  const handleEndDateChange = (event) => {
    const newEndDate = event.target.value;
    setEndDate(newEndDate);
    onChange?.({ ...value, endDate: newEndDate });
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        読了日時
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        {/* 日時範囲タイプ選択 */}
        <FormControl fullWidth margin="normal">
          <InputLabel>日時範囲</InputLabel>
          <Select
            value={dateRangeType}
            onChange={handleTypeChange}
            label="日時範囲"
            data-testid="date-range-type-select"
          >
            <MenuItem value="none">指定なし</MenuItem>
            <MenuItem value="year">年別</MenuItem>
            <MenuItem value="month">年月別</MenuItem>
            <MenuItem value="quarter">四半期別</MenuItem>
            <MenuItem value="custom">カスタム期間</MenuItem>
          </Select>
        </FormControl>

        {/* 年選択 */}
        {(dateRangeType === 'year' || dateRangeType === 'month' || dateRangeType === 'quarter') && (
          <FormControl fullWidth margin="normal">
            <InputLabel>年</InputLabel>
            <Select
              value={year}
              onChange={handleYearChange}
              label="年"
              data-testid="year-select"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <MenuItem key={y} value={y}>{y}年</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* 月選択 */}
        {dateRangeType === 'month' && (
          <FormControl fullWidth margin="normal">
            <InputLabel>月</InputLabel>
            <Select
              value={month}
              onChange={handleMonthChange}
              label="月"
              data-testid="month-select"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <MenuItem key={m} value={m}>{m}月</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* 四半期選択 */}
        {dateRangeType === 'quarter' && (
          <FormControl fullWidth margin="normal">
            <InputLabel>四半期</InputLabel>
            <Select
              value={quarter}
              onChange={handleQuarterChange}
              label="四半期"
              data-testid="quarter-select"
            >
              <MenuItem value={1}>第1四半期（1-3月）</MenuItem>
              <MenuItem value={2}>第2四半期（4-6月）</MenuItem>
              <MenuItem value={3}>第3四半期（7-9月）</MenuItem>
              <MenuItem value={4}>第4四半期（10-12月）</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* カスタム期間選択 */}
        {dateRangeType === 'custom' && (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mt: 1
          }} data-testid="custom-date-range-grid">
            <Box data-testid="start-date-grid-item">
              <TextField
                label="開始日"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ 'data-testid': 'start-date-input' }}
              />
            </Box>
            <Box data-testid="end-date-grid-item">
              <TextField
                label="終了日"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ 'data-testid': 'end-date-input' }}
              />
            </Box>
          </Box>
        )}

        {/* 説明テキスト */}
        {dateRangeType !== 'none' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {dateRangeType === 'year' && `${year}年に読了した本を検索します`}
            {dateRangeType === 'month' && `${year}年${month}月に読了した本を検索します`}
            {dateRangeType === 'quarter' && `${year}年第${quarter}四半期に読了した本を検索します`}
            {dateRangeType === 'custom' && '指定した期間に読了した本を検索します'}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default DateRangeSelector; 