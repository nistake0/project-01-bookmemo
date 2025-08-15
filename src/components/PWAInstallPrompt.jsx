import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

/**
 * PWAインストールプロンプトコンポーネント
 * 
 * 機能:
 * - アプリインストールプロンプトの表示
 * - オフライン状態の表示
 * - インストール状態の管理
 * - インストール促進機能
 */
const PWAInstallPrompt = () => {
  // PWA機能がサポートされているかチェック
  const isPWASupported = typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window;

  // PWAがサポートされていない場合は何も表示しない
  if (!isPWASupported) {
    return null;
  }

  try {
    const {
      isOnline,
      isInstallable,
      isInstalled,
      installApp,
      shouldShowInstallPrompt,
      shouldShowManualInstallGuide,
      recordInstallPromptDismiss
    } = usePWA();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // インストール可能になったらプロンプトを表示
  useEffect(() => {
    if (isInstallable && !isInstalled && shouldShowInstallPrompt) {
      // 強化版プロンプトを表示（テスト用に即座に表示）
      setShowEnhancedPrompt(true);
    } else if (isInstallable && !isInstalled) {
      setShowInstallPrompt(true);
    }
  }, [isInstallable, isInstalled, shouldShowInstallPrompt]);

  // iPhone用の手動インストールガイドを表示
  useEffect(() => {
    if (shouldShowManualInstallGuide && !isInstalled) {
      setShowManualGuide(true);
    }
  }, [shouldShowManualInstallGuide, isInstalled]);

  // オフライン状態の監視
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      setShowOfflineAlert(false);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    try {
      await installApp();
      setShowInstallPrompt(false);
      setShowEnhancedPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleCloseInstallPrompt = () => {
    setShowInstallPrompt(false);
    if (recordInstallPromptDismiss) {
      recordInstallPromptDismiss();
    }
  };

  const handleCloseEnhancedPrompt = () => {
    setShowEnhancedPrompt(false);
    if (recordInstallPromptDismiss) {
      recordInstallPromptDismiss();
    }
  };

  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false);
  };

  const handleCloseManualGuide = () => {
    setShowManualGuide(false);
    if (recordInstallPromptDismiss) {
      recordInstallPromptDismiss();
    }
  };

  const pwaBenefits = [
    { icon: <SpeedIcon />, title: '高速起動', description: 'アプリのように素早く起動' },
    { icon: <StorageIcon />, title: 'オフライン対応', description: 'インターネットなしでも利用可能' },
    { icon: <StarIcon />, title: 'ホーム画面に追加', description: 'いつでも簡単にアクセス' }
  ];

  return (
    <>
      {/* 基本インストールプロンプト */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 8 }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<InstallIcon />}
                onClick={handleInstall}
                data-testid="pwa-install-button"
                variant="contained"
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                インストール
              </Button>
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleCloseInstallPrompt}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
          sx={{ width: '100%' }}
        >
          <Typography variant="body2">
            BookMemoをホーム画面に追加して、より快適にご利用いただけます
          </Typography>
        </Alert>
      </Snackbar>

      {/* 強化版インストールプロンプト */}
      <Snackbar
        open={showEnhancedPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 8, width: '100%', maxWidth: '600px' }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                📱 BookMemoをアプリとしてインストール
              </Typography>
              <IconButton
                size="small"
                onClick={handleCloseEnhancedPrompt}
                sx={{ mt: -0.5 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              より快適な読書メモ管理体験をお届けします
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {pwaBenefits.map((benefit, index) => (
                <Chip
                  key={index}
                  icon={benefit.icon}
                  label={benefit.title}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseEnhancedPrompt}
              >
                後で
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<InstallIcon />}
                onClick={handleInstall}
                sx={{ 
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                今すぐインストール
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Snackbar>

      {/* オフラインアラート */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseOfflineAlert}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ width: '100%' }}
        >
          <Typography variant="body2">
            オフラインです。一部の機能が制限される場合があります
          </Typography>
        </Alert>
      </Snackbar>

      {/* オンライン復帰アラート */}
      <Snackbar
        open={isOnline && showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3000}
        onClose={handleCloseOfflineAlert}
      >
        <Alert
          severity="success"
          icon={<OnlineIcon />}
          sx={{ width: '100%' }}
        >
          <Typography variant="body2">
            オンラインに復帰しました
          </Typography>
        </Alert>
      </Snackbar>

      {/* iPhone用の手動インストールガイド */}
      <Snackbar
        open={showManualGuide}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 8, width: '100%', maxWidth: '600px' }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                📱 BookMemoをホーム画面に追加
              </Typography>
              <IconButton
                size="small"
                onClick={handleCloseManualGuide}
                sx={{ mt: -0.5 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              iPhoneでBookMemoをアプリとして使用するには、以下の手順でホーム画面に追加してください：
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                1. 共有ボタンをタップ
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                Safariの下部にある「共有」ボタン（□↑）をタップします
              </Typography>
              
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                2. 「ホーム画面に追加」を選択
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                共有メニューから「ホーム画面に追加」を選択します
              </Typography>
              
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                3. 追加を確認
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                「追加」をタップしてホーム画面に追加します
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {pwaBenefits.map((benefit, index) => (
                <Chip
                  key={index}
                  icon={benefit.icon}
                  label={benefit.title}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseManualGuide}
              >
                後で
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCloseManualGuide}
                sx={{ 
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                手順を確認しました
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Snackbar>
    </>
  );
  } catch (error) {
    // usePWAフックでエラーが発生した場合は何も表示しない
    console.warn('PWA hook error in PWAInstallPrompt, skipping PWA features:', error);
    return null;
  }
};

export default PWAInstallPrompt;
