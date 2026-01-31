import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import BookList from "./pages/BookList";
import BookAdd from "./pages/BookAdd";
import BookDetail from "./pages/BookDetail";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TagSearch from "./pages/TagSearch";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CommonErrorDialog, { ErrorDialogContext, ErrorDialogProvider } from "./components/CommonErrorDialog";
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { usePWA } from "./hooks/usePWA";
import { useNavigation } from "./hooks/useNavigation";
import { withReactContext } from "./hooks/useReactContext.jsx";
import { useContext } from 'react';
import { PATHS } from './config/paths';
import ThemeProviderWithUserSettings from './components/ThemeProviderWithUserSettings';
import { UserSettingsProvider } from './hooks/useUserSettings';
import { ErrorLogger, setupGlobalErrorHandling } from './utils/errorLogger';
import { useBackgroundParallax } from './hooks/useBackgroundParallax';
import LoadingIndicator from './components/common/LoadingIndicator';

// ErrorLogger / appTheme は外部モジュールへ分離

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // 認証チェック
  useEffect(() => {
    if (!loading && !user) {
      console.warn('🔐 Authentication required for:', location.pathname);
    }
  }, [user, loading, location.pathname]);
  
  if (loading) {
    return (
      <LoadingIndicator
        variant="fullPage"
        message="認証を確認しています..."
        data-testid="auth-loading"
      />
    );
  }
  
  if (!user) {
    console.warn('🚫 Unauthenticated access attempt, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  return children;
}

function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  // ルートに応じてタブを選択状態に
  useEffect(() => {
    if (location.pathname.startsWith('/add')) setValue(1);
    else if (location.pathname.startsWith('/tags')) setValue(2);
    else if (location.pathname.startsWith('/stats')) setValue(3);
    else if (location.pathname.startsWith('/settings')) setValue(4);
    else setValue(0); // デフォルトは本一覧
  }, [location.pathname]);

  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        if (newValue === 0) navigate('/');
        if (newValue === 1) navigate('/add');
        if (newValue === 2) navigate('/tags');
        if (newValue === 3) navigate('/stats');
        if (newValue === 4) navigate('/settings');
      }}
      showLabels
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        backgroundColor: 'background.paper', 
        borderTop: 1, 
        borderColor: 'divider',
        height: { xs: '64px', sm: '72px' },
        '& .MuiBottomNavigationAction-root': {
          minWidth: { xs: '60px', sm: '80px' },
          padding: { xs: '6px 4px', sm: '8px 6px' }
        },
        '& .MuiBottomNavigationAction-label': {
          fontSize: { xs: '0.7rem', sm: '0.8rem' },
          marginTop: { xs: '2px', sm: '4px' }
        },
        '& .MuiBottomNavigationAction-iconOnly': {
          fontSize: { xs: '1.5rem', sm: '1.75rem' }
        }
      }}
    >
      <BottomNavigationAction 
        label="本一覧" 
        icon={<LibraryBooksIcon />} 
        data-testid="bottom-nav-list"
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="本を追加" 
        icon={<AddCircleIcon />} 
        data-testid="bottom-nav-add"
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="検索・タグ" 
        icon={<SearchIcon />} 
        data-testid="bottom-nav-search"
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="統計" 
        icon={<BarChartIcon />} 
        data-testid="bottom-nav-stats"
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="設定" 
        icon={<PersonIcon />} 
        data-testid="bottom-nav-settings"
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
    </BottomNavigation>
  );
}

function AppRoutes() {
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);
  const { isStandalone } = usePWA();
  const { handleBack, handleForward } = useNavigation();
  const backgroundVars = theme.custom?.backgroundVars || {
    '--bm-library-image': `url("${PATHS.LIBRARY_BACKGROUND()}")`,
    '--bm-library-bg': `url("${PATHS.LIBRARY_PATTERN()}")`,
  };

  const hideBottomNav = (
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    !user
  );

  // 全画面共通のスワイプジェスチャ（PWA時のみ）
  useEffect(() => {
    if (!isStandalone) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let isLocalSwipeElement = false; // ローカルスワイプ要素のフラグ
    const minSwipeDistance = 100; // 最小スワイプ距離
    
    const onTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      
      // タッチ開始位置の要素を確認して競合回避
      const target = document.elementFromPoint(touchStartX, touchStartY);
      // ローカルスワイプ要素（MemoCard等）の場合はフラグを立てる
      isLocalSwipeElement = target?.closest('[data-allow-local-swipe]') !== null;
    };
    
    const onTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      const swipeDiff = touchEndX - touchStartX;
      const swipeDiffVertical = Math.abs(touchEndY - touchStartY);
      const minSwipe = minSwipeDistance;
      
      // ローカルスワイプ要素の場合はグローバルスワイプを無視
      if (isLocalSwipeElement) {
        return;
      }
      
      // 水平スワイプのみ処理（垂直スワイプは無視）
      if (Math.abs(swipeDiff) > minSwipe && Math.abs(swipeDiff) > swipeDiffVertical) {
        if (swipeDiff > 0) {
          // 右スワイプ → 戻る
          handleBack();
        } else {
          // 左スワイプ → 進む
          handleForward();
        }
      }
    };
    
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isStandalone, handleBack, handleForward]);

  // エラーハンドリングの初期化
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // ページ変更時のスクロール位置リセット
  useEffect(() => {
    const scrollContainer = document.getElementById('app-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // 背景の“動き”だけをフックに分離（見た目はappTheme.jsのMuiCssBaselineへ）
  useBackgroundParallax({ factor: 0.45 });

  // グローバルエラーハンドラーを設定
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      ErrorLogger.saveError(event.error, 'AppRoutes Global Error');
      
      // 404エラーの場合は特別なメッセージを表示
      if (event.error && event.error.message && event.error.message.includes('404')) {
        if (setGlobalError) {
          setGlobalError('リソースが見つかりません。ページを再読み込みしてください。');
        }
      } else if (setGlobalError) {
        setGlobalError('予期しないエラーが発生しました。ページを再読み込みしてください。');
      }
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      ErrorLogger.saveError(event.reason, 'AppRoutes Unhandled Promise Rejection');
      
      // ネットワークエラーや404エラーの場合は特別なメッセージを表示
      if (event.reason && event.reason.message) {
        if (event.reason.message.includes('404') || event.reason.message.includes('Failed to fetch')) {
          if (setGlobalError) {
            setGlobalError('ネットワークエラーが発生しました。接続を確認してください。');
          }
        } else if (setGlobalError) {
          setGlobalError('ネットワークエラーが発生しました。接続を確認してください。');
        }
      } else if (setGlobalError) {
        setGlobalError('ネットワークエラーが発生しました。接続を確認してください。');
      }
    };

    // リソース読み込みエラーの監視
    const handleResourceError = (event) => {
      if (event.target && event.target.src) {
        console.error('Resource loading error:', event.target.src);
        ErrorLogger.saveError(
          new Error(`Resource loading failed: ${event.target.src}`),
          'AppRoutes Resource Error'
        );
        // 重要なリソース（Service Worker、manifest等）のエラーのみダイアログ表示
        if (event.target.src.includes('sw.js') || event.target.src.includes('manifest.webmanifest')) {
          if (setGlobalError) {
            setGlobalError('アプリの設定ファイルの読み込みに失敗しました。ページを再読み込みしてください。');
          }
        }
      }
    };

    // 404エラーの特別な処理
    const handle404Error = (event) => {
      if (event.target && event.target.src && event.target.src.includes('404')) {
        console.error('404 Error detected:', event.target.src);
        ErrorLogger.saveError(
          new Error(`404 Error: ${event.target.src} - SPA routing issue detected`),
          'AppRoutes 404 Error'
        );
        
        // 404エラーの場合は特別なメッセージを表示
        if (setGlobalError) {
          setGlobalError('ページが見つかりません。SPAルーティングの問題の可能性があります。ページを再読み込みしてください。');
        }
      }
    };

    window.addEventListener('error', handle404Error, true);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // キャプチャフェーズでリソースエラーを監視

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, [setGlobalError]);

  return (
    <>
      <Box
        id="app-scroll-container"
        sx={{
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          // 画面下部のボトムナビの重なり回避（各ページでもpbしているが二重でも実害なし）
          pb: hideBottomNav ? 0 : { xs: '64px', sm: '72px' },
          // 背景の“見た目”は appTheme.js（MuiCssBaseline）へ寄せる。
          // ここでは URL だけ CSS 変数で渡す（prodのbasePathにも追従）
          // NOTE: url(var(--x)) は環境差が出ることがあるので、変数側を url("...") にして参照は var(...) に寄せる
          '--bm-noise-bg': `url("${PATHS.NOISE_TEXTURE()}")`,
          ...backgroundVars,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateRoute><BookList /></PrivateRoute>} />
          <Route path="/add" element={<PrivateRoute><BookAdd /></PrivateRoute>} />
          <Route path="/book/:id" element={<PrivateRoute><BookDetail /></PrivateRoute>} />
          <Route path="/tags" element={<PrivateRoute><TagSearch /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
      {!hideBottomNav && <AppBottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ErrorDialogProvider>
        <HashRouter>
          <UserSettingsProvider>
            <ThemeProviderWithUserSettings>
              <PWAProvider />
              <AppRoutes />
            {typeof window !== 'undefined' && 'serviceWorker' in navigator && !PATHS.IS_DEVELOPMENT() && (
              <PWAInstallPrompt />
            )}
            </ThemeProviderWithUserSettings>
          </UserSettingsProvider>
        </HashRouter>
      </ErrorDialogProvider>
    </AuthProvider>
  );
}

// PWA機能を初期化するコンポーネント
function PWAProvider() {
  // 開発環境ではPWA機能を初期化しない
  if (PATHS.IS_DEVELOPMENT()) {
    return null;
  }

  // PWA機能がサポートされているかチェック
  const isPWASupported = 'serviceWorker' in navigator && 'PushManager' in window;
  
  // PWAがサポートされていない場合は何も表示しない
  if (!isPWASupported) {
    return null;
  }

  try {
    const { registerServiceWorker } = usePWA();

    useEffect(() => {
      registerServiceWorker().catch(error => {
        // Service Worker登録エラーはアプリの動作に影響しないため、ログのみ記録
        console.warn('Service Worker registration failed in PWAProvider:', error);
        ErrorLogger.saveError(error, 'PWAProvider Service Worker Registration');
      });
    }, [registerServiceWorker]);

    return null;
  } catch (error) {
    // usePWAフックでエラーが発生した場合は何も表示しない
    console.warn('PWA hook error, skipping PWA initialization:', error);
    ErrorLogger.saveError(error, 'PWAProvider Hook Error');
    return null;
  }
}

// Reactコンテキスト初期化チェッカーを適用
export default withReactContext(App);
