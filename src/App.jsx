import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import MyPage from "./pages/MyPage";
import CommonErrorDialog, { ErrorDialogContext, ErrorDialogProvider } from "./components/CommonErrorDialog";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { usePWA } from "./hooks/usePWA";
import { withReactContext } from "./hooks/useReactContext.jsx";
import { useContext } from 'react';
import { PATHS } from './config/paths';

// エラーログの永続化機能
const ErrorLogger = {
  // エラーログをlocalStorageに保存
  saveError: (error, context = '') => {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack || '',
        context,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('bookmemo_error_logs') || '[]');
      existingLogs.push(errorLog);
      
      // 最新の10件のみ保持
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('bookmemo_error_logs', JSON.stringify(existingLogs));
      
      // コンソールにも出力（リダイレクト後も確認可能）
      console.error('🔴 PERSISTENT ERROR LOG:', errorLog);
      
      return errorLog;
    } catch (e) {
      console.error('Error saving error log:', e);
    }
  },
  
  // エラーログを取得
  getErrors: () => {
    try {
      return JSON.parse(localStorage.getItem('bookmemo_error_logs') || '[]');
    } catch (e) {
      return [];
    }
  },
  
  // エラーログをクリア
  clearErrors: () => {
    localStorage.removeItem('bookmemo_error_logs');
  }
};

// グローバルエラーハンドラー
const setupGlobalErrorHandling = () => {
  // 未処理のエラーをキャッチ
  window.addEventListener('error', (event) => {
    ErrorLogger.saveError(event.error, 'Global Error Handler');
  });
  
  // 未処理のPromise拒否をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.saveError(event.reason, 'Unhandled Promise Rejection');
  });
  
  // ページ離脱時のエラーログ保存
  window.addEventListener('beforeunload', () => {
    const errors = ErrorLogger.getErrors();
    if (errors.length > 0) {
      console.log('📋 Error logs available in localStorage: bookmemo_error_logs');
    }
  });
};

// 開発環境でのデバッグ情報表示
const showDebugInfo = () => {
  if (PATHS.IS_DEVELOPMENT()) {
    console.log('🔧 Debug Info:');
    console.log('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
    console.log('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
    console.log('- Current URL:', window.location.href);
    console.log('- User Agent:', navigator.userAgent);
    
    // エラーログがある場合は表示
    const errors = ErrorLogger.getErrors();
    if (errors.length > 0) {
      console.log('📋 Previous Error Logs:', errors);
    }
  }
  
  // グローバルデバッグコマンドを追加
  window.bookmemoDebug = {
    getErrors: () => {
      const errors = ErrorLogger.getErrors();
      console.table(errors);
      return errors;
    },
    clearErrors: () => {
      ErrorLogger.clearErrors();
      console.log('✅ Error logs cleared');
    },
    showDebugInfo: () => {
      console.log('🔧 Current Debug Info:');
      console.log('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
      console.log('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
      console.log('- Current URL:', window.location.href);
      console.log('- User Agent:', navigator.userAgent);
    },
    getCurrentRoute: () => {
      const info = {
        pathname: window.location.pathname,
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      console.log('📍 Current Route Info:', info);
      return info;
    },
    getLocalStorage: () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      console.log('💾 LocalStorage Data:', data);
      return data;
    },
    testErrorLogging: () => {
      console.log('🧪 Testing error logging...');
      ErrorLogger.saveError(new Error('Test error from debug command'), 'Debug Test');
      console.log('✅ Test error logged');
    }
  };
  
  console.log('🔧 Debug commands available:');
  console.log('- bookmemoDebug.getErrors() - Show error logs');
  console.log('- bookmemoDebug.clearErrors() - Clear error logs');
  console.log('- bookmemoDebug.showDebugInfo() - Show debug info');
  console.log('- bookmemoDebug.getCurrentRoute() - Show current route info');
  console.log('- bookmemoDebug.getLocalStorage() - Show localStorage data');
  console.log('- bookmemoDebug.testErrorLogging() - Test error logging');
};

// モバイル最適化テーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body2: {
      fontSize: '0.8rem',
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    caption: {
      fontSize: '0.7rem',
      '@media (min-width:600px)': {
        fontSize: '0.8rem',
      },
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          '@media (min-width:600px)': {
            padding: '16px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '0.9rem',
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          padding: '8px 16px',
          '@media (min-width:600px)': {
            fontSize: '1rem',
            padding: '10px 20px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          height: '20px',
          '@media (min-width:600px)': {
            fontSize: '0.8rem',
            height: '24px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '64px',
          '@media (min-width:600px)': {
            height: '72px',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          '@media (min-width:600px)': {
            fontSize: '0.8rem',
          },
        },
      },
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // エラーログの保存とデバッグ情報の表示
  useEffect(() => {
    console.log('🔍 PrivateRoute effect:', { 
      pathname: location.pathname, 
      user: !!user, 
      loading, 
      href: window.location.href 
    });
    
    if (!loading) {
      if (!user) {
        ErrorLogger.saveError(
          new Error('Authentication required'), 
          `PrivateRoute - ${location.pathname}`
        );
        console.warn('🔐 Authentication required for:', location.pathname);
      } else {
        console.log('✅ Authenticated user accessing:', location.pathname);
        // 書籍詳細ページの場合は特別なログ
        if (location.pathname.startsWith('/book/')) {
          console.log('📖 Book detail page accessed:', location.pathname);
          ErrorLogger.saveError(
            new Error(`Book detail page accessed: ${location.pathname}`),
            'PrivateRoute Book Detail'
          );
        }
      }
    }
  }, [user, loading, location.pathname]);
  
  if (loading) {
    console.log('⏳ Loading authentication state...');
    return <div>Loading...</div>;
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
    else if (location.pathname.startsWith('/mypage')) setValue(4);
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
        if (newValue === 4) navigate('/mypage');
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
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="本を追加" 
        icon={<AddCircleIcon />} 
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="検索・タグ" 
        icon={<SearchIcon />} 
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="統計" 
        icon={<BarChartIcon />} 
        sx={{ 
          '&.Mui-selected': {
            color: 'primary.main'
          }
        }}
      />
      <BottomNavigationAction 
        label="マイページ" 
        icon={<PersonIcon />} 
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
  const { user } = useAuth();
  const { setGlobalError } = useContext(ErrorDialogContext);

  const hideBottomNav = (
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    !user
  );

  // エラーハンドリングとデバッグ機能の初期化
  useEffect(() => {
    setupGlobalErrorHandling();
    showDebugInfo();
  }, []);

  // ページ変更時のログとスクロール位置リセット
  useEffect(() => {
    console.log('🔄 Page changed:', { 
      pathname: location.pathname, 
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });
    
    // 書籍詳細ページの場合は特別なログ
    if (location.pathname.startsWith('/book/')) {
      console.log('📖 Book detail page route change detected');
      ErrorLogger.saveError(
        new Error(`Book detail page route change: ${location.pathname}`),
        'AppRoutes Book Detail Route Change'
      );
    }
    
    const scrollContainer = document.getElementById('app-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [location.pathname]);

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
          // ページ全体の背景画像設定 - 画像本来の色で表示
          background: `
            url('${PATHS.PAPER_TEXTURE()}'),
            #f5f5dc
          `,
          backgroundSize: '100% auto, cover',
          backgroundRepeat: 'repeat-y, no-repeat',
          backgroundPosition: 'center top, center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          width: '100%'
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
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
      {!hideBottomNav && <AppBottomNav />}
    </>
  );
}

function App() {
  // 環境に応じてbasenameを設定
  const basename = PATHS.IS_PRODUCTION() ? "/project-01-bookmemo" : "";
  
  return (
    <AuthProvider>
      <ErrorDialogProvider>
        <BrowserRouter basename={basename}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <PWAProvider />
            <AppRoutes />
            {/* PWA機能がサポートされている場合のみPWAInstallPromptを表示（開発環境では非表示） */}
            {typeof window !== 'undefined' && 'serviceWorker' in navigator && !PATHS.IS_DEVELOPMENT() && (
              <PWAInstallPrompt />
            )}
          </ThemeProvider>
        </BrowserRouter>
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
