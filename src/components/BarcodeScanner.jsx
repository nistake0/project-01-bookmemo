import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Box } from '@mui/material';

const BarcodeScanner = ({ onDetected, onError }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(new BrowserMultiFormatReader());
  const isScanning = useRef(false); // スキャン状態を管理するためのフラグ

  useEffect(() => {
    console.log('[DEBUG] BarcodeScanner: useEffect - コンポーネント開始');
    const videoElement = videoRef.current;
    let stream; 

    const handlePlaying = () => {
      console.log(`[DEBUG] BarcodeScanner: onplaying - ビデオ再生開始。解像度: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      
      // ガード条件: 解像度が0、または既にスキャン処理が開始されている場合は何もしない
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        console.log('[DEBUG] BarcodeScanner: onplaying - 解像度が0のためスキャンをスキップします。');
        return;
      }
      if (isScanning.current) {
        console.log('[DEBUG] BarcodeScanner: onplaying - すでにスキャン中のため、新規のスキャン処理は開始しません。');
        return;
      }
      
      isScanning.current = true;
      console.log('[DEBUG] BarcodeScanner: スキャン処理を開始します...');
      readerRef.current.decodeFromStream(stream, videoElement, (result, err) => {
        if (result) {
          console.log('[DEBUG] BarcodeScanner: バーコード検出成功');
          readerRef.current.reset(); // ★重要: 検出後、スキャンループを停止する
          onDetected(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          // エラーが継続的に発生するのを防ぐため、一度報告したらループを止める
          console.error('[DEBUG] BarcodeScanner: スキャン中にエラー発生', err);
          readerRef.current.reset();
          onError(err.message || 'スキャナーでエラーが発生しました。');
        }
      });
    };

    const handleLoadedMetadata = () => {
      console.log(`[DEBUG] BarcodeScanner: onloadedmetadata - ビデオメタデータ読み込み完了。解像度: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      videoElement.play().catch(err => console.error('[DEBUG] play() に失敗:', err));
    };

    const startScan = async () => {
      if (videoElement) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          console.log('[DEBUG] BarcodeScanner: getUserMedia - カメラストリーム取得成功');
          videoElement.srcObject = stream;
          
          videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.addEventListener('playing', handlePlaying);

        } catch (error) {
          console.error("[DEBUG] BarcodeScanner: カメラの起動に失敗しました。", error);
          onError("カメラの起動に失敗しました。");
        }
      }
    };

    startScan();

    return () => {
      console.log('[DEBUG] BarcodeScanner: useEffect cleanup - コンポーネント終了処理');
      readerRef.current.reset(); // スキャンを確実に停止
      isScanning.current = false; // フラグをリセット
      
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('playing', handlePlaying);

        const currentStream = videoElement.srcObject;
        if (currentStream) {
            const tracks = currentStream.getTracks();
            tracks.forEach(track => track.stop());
            console.log('[DEBUG] BarcodeScanner: cleanup - カメラストリーム停止');
        }
        videoElement.srcObject = null;
        console.log('[DEBUG] BarcodeScanner: cleanup - video srcObject を null に設定');
      }
    };
  }, [onDetected, onError]);

  return (
    <Box>
      <video ref={videoRef} style={{ width: '100%', height: 'auto', border: '1px solid gray' }} playsInline />
    </Box>
  );
};

export default BarcodeScanner; 