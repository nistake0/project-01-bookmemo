import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

const CameraPasteOCR = ({ onTextDetected, disabled = false }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isWaitingForPaste, setIsWaitingForPaste] = useState(false);
  const [lastPasteTime, setLastPasteTime] = useState(0);


  // iPhone Safariの検出
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isSafari = () => {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  };

  const shouldUseNativeOCR = () => {
    return isIOS() && isSafari();
  };

  // ペーストイベントの監視
  useEffect(() => {
    const handlePaste = (event) => {
      if (!isWaitingForPaste) return;

      const text = event.clipboardData.getData('text/plain');
      const now = Date.now();
      
      // カメラ起動後30秒以内のペーストのみ処理
      if (text && now - lastPasteTime < 30000) {
        console.log('[CameraPasteOCR] ペーストされたテキスト:', text);
        setIsWaitingForPaste(false);
        onTextDetected(text);
        setShowInstructions(false);
      }
    };

    // キーボードショートカット（Ctrl+V, Cmd+V）の監視も追加
    const handleKeyDown = (event) => {
      if (!isWaitingForPaste) return;
      
      // Ctrl+V (Windows) または Cmd+V (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        console.log('[CameraPasteOCR] キーボードショートカット検出');
        // 少し遅延を入れてペーストイベントを待つ
        setTimeout(() => {
          if (isWaitingForPaste) {
            console.log('[CameraPasteOCR] ペーストイベントが検出されませんでした。手動ペーストを促します。');
            promptManualPaste();
          }
        }, 100);
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWaitingForPaste, lastPasteTime, onTextDetected]);

  const handleCameraLaunch = () => {
    if (shouldUseNativeOCR()) {
      // iPhone Safari: カメラ起動指示を表示
      setShowInstructions(true);
      setIsWaitingForPaste(true);
      setLastPasteTime(Date.now());
    } else {
      // その他デバイス: 将来的にTesseract.jsを使用
      alert('この機能は現在iPhone Safariでのみ利用可能です。');
    }
  };



  const handleCloseInstructions = () => {
    setShowInstructions(false);
    setIsWaitingForPaste(false);
  };

  const handleManualPaste = () => {
    // 手動ペーストボタン（フォールバック）
    // まずnavigator.clipboard.readText()を試行
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
                 if (text) {
           console.log('[CameraPasteOCR] 手動ペーストされたテキスト:', text);
           onTextDetected(text);
           setShowInstructions(false);
         } else {
          // テキストが空の場合、ユーザーに手動ペーストを促す
          console.log('[CameraPasteOCR] クリップボードが空です');
        }
      }).catch(err => {
        console.error('[CameraPasteOCR] クリップボード読み取りエラー:', err);
        console.log('[CameraPasteOCR] 手動入力モードに切り替え');
      });
    } else {
      console.log('[CameraPasteOCR] navigator.clipboardが利用できません');
    }
  };



  const promptManualPaste = () => {
    // 一時的なテキストエリアを作成してペーストを促す
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('data-testid', 'temp-paste-textarea');
    
    document.body.appendChild(textarea);
    textarea.focus();
    
    // ユーザーにペーストを促す
    const userText = prompt('コピーしたテキストをここに貼り付けてください（Ctrl+V または Cmd+V）:');
    
    if (userText && userText.trim()) {
      console.log('[CameraPasteOCR] 手動入力されたテキスト:', userText);
      onTextDetected(userText.trim());
      setShowInstructions(false);
    }
    
    // 一時的なテキストエリアを削除
    document.body.removeChild(textarea);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CameraAltIcon />}
        onClick={handleCameraLaunch}
        disabled={disabled}
        fullWidth
        sx={{ 
          mt: 1, 
          mb: 1,
          height: { xs: '40px', sm: '48px' },
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
        data-testid="camera-paste-ocr-button"
      >
        {shouldUseNativeOCR() ? 'カメラでスキャン（コピーしてペースト）' : 'カメラでスキャン'}
      </Button>

      <Dialog 
        open={showInstructions} 
        onClose={handleCloseInstructions}
        maxWidth="sm"
        fullWidth
        data-testid="camera-instructions-dialog"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CameraAltIcon />
            カメラでテキストスキャン
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            以下の手順でテキストをスキャンしてください：
          </Typography>
                     <Box component="ol" sx={{ pl: 2 }}>
             <Typography component="li" variant="body1" paragraph>
               カメラアプリを手動で起動してください
             </Typography>
             <Typography component="li" variant="body1" paragraph>
               スキャンしたいテキストにカメラを向けてください
             </Typography>
             <Typography component="li" variant="body1" paragraph>
               テキストが認識されたら、テキストをタップして選択してください
             </Typography>
             <Typography component="li" variant="body1" paragraph>
               「コピー」をタップしてテキストをコピーしてください
             </Typography>
             <Typography component="li" variant="body1" paragraph>
               この画面に戻って、下の「ペースト」ボタンをタップしてください
             </Typography>
           </Box>
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
             💡 ヒント：iPhoneのカメラアプリは高精度なOCR機能を搭載しています
           </Typography>
           <Typography variant="body2" color="text.secondary">
             ⏱️ 30秒以内にペーストしてください
           </Typography>
          
          
        </DialogContent>
                          <DialogActions>
           <Button onClick={handleCloseInstructions}>
             キャンセル
           </Button>
            <Button 
              onClick={handleManualPaste}
              startIcon={<ContentPasteIcon />}
              variant="contained"
              color="primary"
              data-testid="manual-paste-button"
            >
              クリップボードからペースト
            </Button>
          </DialogActions>
      </Dialog>
    </>
  );
};

export default CameraPasteOCR;
