import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f5f7fa', // 明るいグレー
      paper: '#fff',
    },
    primary: {
      main: '#1976d2', // 青系
    },
    secondary: {
      main: '#f50057', // ピンク系（main.jsxの設定を使用）
    },
    text: {
      primary: '#222',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
    // モバイル用のフォントサイズ最適化
    h1: {
      fontSize: '1.8rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontSize: '1.3rem',
      '@media (min-width:600px)': {
        fontSize: '1.6rem',
      },
    },
    h4: {
      fontSize: '1.1rem',
      '@media (min-width:600px)': {
        fontSize: '1.4rem',
      },
    },
    h5: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.2rem',
      },
    },
    h6: {
      fontSize: '0.9rem',
      '@media (min-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body1: {
      fontSize: '0.9rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
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
  // コンポーネント固有のスタイル設定
  components: {
    // TextFieldのモバイル最適化
    MuiTextField: {
      styleOverrides: {
        root: {
          // モバイルでの余白削減
          marginBottom: '8px',
          '@media (min-width:600px)': {
            marginBottom: '16px',
          },
          '& .MuiInputBase-root': {
            fontSize: '0.9rem',
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
          },
        },
      },
      defaultProps: {
        // モバイルでのサイズ最適化
        size: 'small',
        margin: 'dense',
      },
    },
    // Buttonのモバイル最適化
    MuiButton: {
      styleOverrides: {
        root: {
          // モバイルでのボタンサイズ最適化
          fontSize: '0.9rem',
          padding: '8px 16px',
          '@media (min-width:600px)': {
            fontSize: '1rem',
            padding: '10px 20px',
          },
        },
      },
      defaultProps: {
        size: 'medium',
      },
    },
    // Cardのモバイル最適化
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          // モバイルでの余白削減
          marginBottom: '8px',
          '@media (min-width:600px)': {
            marginBottom: '16px',
          },
        },
      },
    },
    // CardContentのモバイル最適化
    MuiCardContent: {
      styleOverrides: {
        root: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // モバイルでのパディング削減
          padding: '12px',
          '@media (min-width:600px)': {
            padding: '16px',
          },
          '&:last-child': {
            paddingBottom: '12px',
            '@media (min-width:600px)': {
              paddingBottom: '16px',
            },
          },
        },
      },
    },
    // Paperのモバイル最適化
    MuiPaper: {
      styleOverrides: {
        root: {
          // モバイルでの余白削減
          padding: '12px',
          '@media (min-width:600px)': {
            padding: '16px',
          },
        },
      },
    },
    // Autocompleteのモバイル最適化
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          // モバイルでの余白削減
          marginBottom: '8px',
          '@media (min-width:600px)': {
            marginBottom: '16px',
          },
        },
      },
    },
    // Chipのモバイル最適化（main.jsxの設定を使用: height: 24px/32px）
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          height: '24px',
          '@media (min-width:600px)': {
            fontSize: '0.9rem',
            height: '32px',
          },
        },
      },
    },
    // Dialogのモバイル最適化
    MuiDialog: {
      styleOverrides: {
        paper: {
          // モバイルでのダイアログサイズ最適化
          margin: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: '400px',
          '@media (min-width:600px)': {
            margin: '32px',
            width: 'calc(100% - 64px)',
            maxWidth: '600px',
          },
        },
      },
    },
    // BottomNavigationのモバイル最適化（main.jsxの設定を使用: height: 56px/64px）
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          // モバイルでのナビゲーション最適化
          height: '56px',
          '@media (min-width:600px)': {
            height: '64px',
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
  // レスポンシブブレークポイントの最適化
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  // スパーシングの最適化
  spacing: (factor) => `${4 * factor}px`,
});

export default appTheme;
