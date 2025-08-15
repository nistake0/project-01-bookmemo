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
import CommonErrorDialog, { ErrorDialogContext } from "./components/CommonErrorDialog";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { usePWA } from "./hooks/usePWA";
import { withReactContext } from "./hooks/useReactContext.jsx";

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
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
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

  const hideBottomNav = (
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    !user
  );

  // ページ変更時にスクロール位置を最上部にリセット
  useEffect(() => {
    const scrollContainer = document.getElementById('app-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [location.pathname]);

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
            url('/paper-texture.jpg'),
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
  const [globalError, setGlobalError] = useState("");
  
  // 環境に応じてbasenameを設定
  const basename = import.meta.env.PROD ? "/project-01-bookmemo" : "";
  
  return (
    <AuthProvider>
      <ErrorDialogContext.Provider value={{ setGlobalError }}>
        <BrowserRouter basename={basename}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <PWAProvider />
            <AppRoutes />
            {/* PWA機能がサポートされている場合のみPWAInstallPromptを表示 */}
            {typeof window !== 'undefined' && 'serviceWorker' in navigator && (
              <PWAInstallPrompt />
            )}
            <CommonErrorDialog
              open={!!globalError}
              message={globalError}
              onClose={() => setGlobalError("")}
            />
          </ThemeProvider>
        </BrowserRouter>
      </ErrorDialogContext.Provider>
    </AuthProvider>
  );
}

// PWA機能を初期化するコンポーネント
function PWAProvider() {
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
      });
    }, [registerServiceWorker]);

    return null;
  } catch (error) {
    // usePWAフックでエラーが発生した場合は何も表示しない
    console.warn('PWA hook error, skipping PWA initialization:', error);
    return null;
  }
}

// Reactコンテキスト初期化チェッカーを適用
export default withReactContext(App);
