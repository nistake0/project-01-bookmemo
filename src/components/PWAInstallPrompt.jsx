import React, { useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon
} from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';

/**
 * PWAインストールプロンプトコンポーネント
 * 
 * 機能:
 * - アプリインストールプロンプトの表示
 * - オフライン状態の表示
 * - インストール状態の管理
 */
const PWAInstallPrompt = () => {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    installApp
  } = usePWA();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  // インストール可能になったらプロンプトを表示
  React.useEffect(() => {
    if (isInstallable && !isInstalled) {
      setShowInstallPrompt(true);
    }
  }, [isInstallable, isInstalled]);

  // オフライン状態の監視
  React.useEffect(() => {
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
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleCloseInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false);
  };

  return (
    <>
      {/* インストールプロンプト */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 8 }} // フッターメニューの上に表示
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
    </>
  );
};

export default PWAInstallPrompt;
