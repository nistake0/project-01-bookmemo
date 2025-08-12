import React, { useState, useRef, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Tesseract from 'tesseract.js';

const CameraOCR = ({ onTextDetected, disabled = false }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // カメラストリームの開始
  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラ
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('[CameraOCR] カメラ起動エラー:', err);
      setError('カメラへのアクセスが拒否されました。カメラの権限を確認してください。');
      setIsCapturing(false);
    }
  };

  // カメラストリームの停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setIsProcessing(false);
  };

  // 画像キャプチャとOCR処理
  const captureAndOCR = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsProcessing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // キャンバスサイズをビデオに合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // ビデオフレームをキャンバスに描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // キャンバスから画像データを取得
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('[CameraOCR] OCR処理開始');
      
      // Tesseract.jsでOCR処理
      const result = await Tesseract.recognize(
        imageData,
        'jpn', // 日本語
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`[CameraOCR] 進捗: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      const detectedText = result.data.text.trim();
      console.log('[CameraOCR] 検出されたテキスト:', detectedText);
      
      if (detectedText) {
        onTextDetected(detectedText);
        stopCamera();
      } else {
        setError('テキストが検出されませんでした。カメラの角度や明るさを調整してください。');
      }
      
    } catch (err) {
      console.error('[CameraOCR] OCR処理エラー:', err);
      setError('OCR処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<CameraAltIcon />}
        onClick={isCapturing ? captureAndOCR : startCamera}
        disabled={disabled || isProcessing}
        fullWidth
        sx={{ 
          mt: 1, 
          mb: 1,
          height: { xs: '40px', sm: '48px' },
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
      >
        {isCapturing ? 'テキストをスキャン' : 'カメラでOCRスキャン'}
      </Button>

      {isCapturing && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={stopCamera}
              sx={{ mr: 1 }}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={captureAndOCR}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={16} /> : null}
            >
              {isProcessing ? '処理中...' : 'スキャン実行'}
            </Button>
          </Box>
          
          {isProcessing && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              OCR処理中... しばらくお待ちください
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CameraOCR;
