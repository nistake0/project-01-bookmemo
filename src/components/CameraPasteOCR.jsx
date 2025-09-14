import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

const CameraPasteOCR = ({ onTextDetected, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePaste = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // クリップボードからテキストを読み取り
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          console.log('[CameraPasteOCR] ペーストされたテキスト:', text);
          onTextDetected(text.trim());
        } else {
          setError('クリップボードが空です');
        }
      } else {
        setError('クリップボード機能が利用できません');
      }
    } catch (err) {
      console.error('[CameraPasteOCR] クリップボード読み取りエラー:', err);
      setError('テキストの読み取りに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ContentPasteIcon />}
        onClick={handlePaste}
        disabled={disabled || isLoading}
        fullWidth
        sx={{ 
          mt: 1, 
          mb: 1,
          height: { xs: '40px', sm: '48px' },
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
        data-testid="camera-paste-ocr-button"
      >
        {isLoading ? '読み取り中...' : 'テキストをペースト'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CameraPasteOCR;