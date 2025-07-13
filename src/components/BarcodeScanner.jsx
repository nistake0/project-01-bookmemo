import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Box } from '@mui/material';

const BarcodeScanner = ({ onDetected, onError }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(new BrowserMultiFormatReader());
  const isScanning = useRef(false); // スキャン状態を管理するためのフラグ

  useEffect(() => {
    const videoElement = videoRef.current;
    let stream; 

    const handleLoadedMetadata = () => {
      videoElement.play().catch(err => console.error('play() failed:', err));
    };

    const handlePlaying = () => {
      // ガード条件: 解像度が0、または既にスキャン処理が開始されている場合は何もしない
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return;
      }
      if (isScanning.current) {
        return;
      }
      isScanning.current = true;
      readerRef.current.decodeFromStream(stream, videoElement, (result, err) => {
        if (result) {
          readerRef.current.reset(); // ★重要: 検出後、スキャンループを停止する
          onDetected(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          readerRef.current.reset();
          onError(err.message || 'スキャナーでエラーが発生しました。');
        }
      });
    };

    const startScan = async () => {
      if (videoElement) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              aspectRatio: 0.5
            }
          });
          videoElement.srcObject = stream;
          videoElement.muted = true; // 追加: モバイル自動再生対策
          
          videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.addEventListener('playing', handlePlaying);

        } catch (error) {
          const msg = `カメラの起動に失敗しました。ブラウザや端末のカメラ権限設定を確認し、許可されているかご確認ください。\n詳細: ${error && error.message ? error.message : ''}`;
          console.log('[BarcodeScanner] onError呼び出し', msg);
          onError(msg);
        }
      }
    };

    startScan();

    return () => {
      readerRef.current.reset(); // スキャンを確実に停止
      isScanning.current = false; // フラグをリセット
      
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('playing', handlePlaying);

        const currentStream = videoElement.srcObject;
        if (currentStream) {
            const tracks = currentStream.getTracks();
            tracks.forEach(track => track.stop());
        }
        videoElement.srcObject = null;
      }
    };
  }, [onDetected, onError]);

  return (
    <Box>
      <video ref={videoRef} style={{ width: '100%', height: 'auto', border: '1px solid gray' }} autoPlay muted playsInline />
    </Box>
  );
};

export default BarcodeScanner; 