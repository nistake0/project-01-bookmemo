import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#eef2ff', // App.jsxの背景に寄せ (薄いクールトーン)
      paper: '#ffffff',
    },
    primary: {
      main: '#1976d2', // 青系
    },
    secondary: {
      main: '#f50057', // ピンク系（main.jsxの設定を使用）
    },
    // セマンティックカラー: MUIのデフォルトを明示的に定義（必要に応じてカスタマイズ可能）
    success: {
      main: '#2e7d32', // MUIデフォルト
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02', // MUIデフォルト
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1', // MUIデフォルト
      light: '#03a9f4',
      dark: '#01579b',
    },
    error: {
      main: '#d32f2f', // MUIデフォルト
      light: '#ef5350',
      dark: '#c62828',
    },
    text: {
      primary: '#222',
    },
    // カスタムカラー: PageHeader用のブラウン系カラー
    custom: {
      pageHeader: {
        brown: {
          dark: '#8B4513', // SaddleBrown
          medium: '#A0522D', // Sienna
          light: '#CD853F', // Peru
        },
        text: {
          title: '#FFF8DC', // Beige
          subtitle: '#F5F5DC', // Beige (少し暗め)
        },
      },
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
    // 背景などの「アプリ全体の見た目」をここに集約（App.jsxからはCSS変数だけ渡す）
    MuiCssBaseline: {
      styleOverrides: {
        '#app-scroll-container': {
          position: 'relative',
          backgroundColor: '#eef2ff',
          backgroundImage: `
            radial-gradient(1200px circle at 20% 10%, rgba(99, 102, 241, 0.18), transparent 60%),
            radial-gradient(900px circle at 85% 0%, rgba(14, 165, 233, 0.16), transparent 55%),
            radial-gradient(900px circle at 50% 100%, rgba(168, 85, 247, 0.12), transparent 55%),
            var(--bm-noise-bg)
          `,
          backgroundBlendMode: 'normal, normal, normal, overlay',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat',
          backgroundSize: 'cover, cover, cover, 256px 256px',
          backgroundPosition: 'center, center, center, center',
          backgroundAttachment: 'fixed, fixed, fixed, fixed',
          minHeight: '100vh',
          width: '100%',

          // 図書館/読書パターン（シームレス）は擬似要素で重ねる
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'var(--bm-library-bg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '320px 320px',
            backgroundPosition: 'center var(--bg-offset, 0px)',
            opacity: 0.62,
            mixBlendMode: 'normal',
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        },
      },
    },
    // 全体共通: 角丸 + 控えめな枠線 + 影の統一（モダン寄り）
    // NOTE: ここでは「薄いガラス感」を Paper/Card に限定して付与し、Menu/Dialogは後で不透明に戻す。

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

          // 見た目（モダン寄り）
          borderRadius: 16,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.72)', // うっすらガラス
          backdropFilter: 'saturate(140%) blur(10px)',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
          transition: 'box-shadow 160ms ease, transform 160ms ease',
          '&:hover': {
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
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

          // 見た目（モダン寄り）
          borderRadius: 16,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.72)', // うっすらガラス
          backdropFilter: 'saturate(140%) blur(10px)',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
        },
      },
    },

    // Menu/Popoverは「ガラス」にすると読みづらくなるので、ほぼ不透明に戻す
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(15, 23, 42, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'none',
          boxShadow: '0 14px 40px rgba(15, 23, 42, 0.18)',
          padding: 0, // MuiPaper(root)のpaddingが乗るのを避ける
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(15, 23, 42, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'none',
          boxShadow: '0 14px 40px rgba(15, 23, 42, 0.18)',
          padding: 0,
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

          // 読みやすさ優先（不透明）
          borderRadius: 16,
          border: '1px solid rgba(15, 23, 42, 0.12)',
          backgroundColor: '#ffffff',
          backdropFilter: 'none',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22)',
          padding: 0, // MuiPaper(root)のpaddingが乗るのを避ける（DialogContent等に任せる）
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
