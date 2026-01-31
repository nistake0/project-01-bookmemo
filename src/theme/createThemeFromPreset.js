import { createTheme } from '@mui/material/styles';
import { getThemePresets } from './themePresets';
import { DEFAULT_THEME_PRESET_ID } from '../constants/userSettings';

/**
 * テーマプリセットIDからMUIテーマを生成
 *
 * @param {string} presetId - プリセットID
 * @param {Function} buildPath - パス構築関数 (path) => string
 * @returns {Object} MUI theme object
 */
export function createThemeFromPreset(presetId, buildPath) {
  const presets = getThemePresets(buildPath);
  const preset = presets[presetId] || presets[DEFAULT_THEME_PRESET_ID];
  const bgImage = preset.background.image === 'none' ? 'none' : preset.background.image;
  const bgPattern = preset.background.pattern === 'none' ? 'none' : preset.background.pattern;
  const hasBgImage = bgImage !== 'none';
  const hasBgPattern = bgPattern !== 'none';
  const glass = preset.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };

  const theme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: preset.backgroundColor,
        paper: '#ffffff',
      },
      primary: { main: '#1976d2' },
      secondary: { main: '#f50057' },
      success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
      warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
      info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
      error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
      text: { primary: '#222' },
      decorative: {
        brown: {
          main: 'rgba(139, 69, 19, 1)',
          light: 'rgba(139, 69, 19, 0.2)',
          lighter: 'rgba(139, 69, 19, 0.1)',
          border: 'rgba(139, 69, 19, 0.25)',
          borderHover: 'rgba(139, 69, 19, 0.3)',
        },
        gold: {
          accent: 'rgba(184, 134, 11, 0.15)',
          subtle: 'rgba(184, 134, 11, 0.08)',
          stroke: 'rgba(184, 134, 11, 0.4)',
          strokeLight: 'rgba(184, 134, 11, 0.3)',
        },
        memo: {
          main: 'rgba(123, 104, 238, 1)',
          light: 'rgba(123, 104, 238, 0.25)',
          lighter: 'rgba(123, 104, 238, 0.12)',
          border: 'rgba(123, 104, 238, 0.25)',
          borderHover: 'rgba(123, 104, 238, 0.4)',
          shadow: 'rgba(123, 104, 238, 0.08)',
          shadowHover: 'rgba(123, 104, 238, 0.12)',
        },
        neutral: {
          light: 'rgba(100, 100, 100, 0.15)',
          lighter: 'rgba(100, 100, 100, 0.08)',
          border: 'rgba(100, 100, 100, 0.2)',
          borderHover: 'rgba(100, 100, 100, 0.25)',
        },
      },
      custom: {
        pageHeader: {
          brown: { dark: '#8B4513', medium: '#A0522D', light: '#CD853F' },
          text: { title: '#FFF8DC', subtitle: '#F5F5DC' },
        },
      },
    },
    typography: {
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      h1: { fontSize: '1.8rem', '@media (min-width:600px)': { fontSize: '2.5rem' } },
      h2: { fontSize: '1.5rem', '@media (min-width:600px)': { fontSize: '2rem' } },
      h3: { fontSize: '1.3rem', '@media (min-width:600px)': { fontSize: '1.6rem' } },
      h4: { fontSize: '1.1rem', '@media (min-width:600px)': { fontSize: '1.4rem' } },
      h5: { fontSize: '1rem', '@media (min-width:600px)': { fontSize: '1.2rem' } },
      h6: { fontSize: '0.9rem', '@media (min-width:600px)': { fontSize: '1.1rem' } },
      body1: { fontSize: '0.9rem', '@media (min-width:600px)': { fontSize: '1rem' } },
      body2: { fontSize: '0.8rem', '@media (min-width:600px)': { fontSize: '0.9rem' } },
      caption: { fontSize: '0.7rem', '@media (min-width:600px)': { fontSize: '0.8rem' } },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '#app-scroll-container': {
            position: 'relative',
            backgroundColor: preset.backgroundColor,
            backgroundImage: !hasBgImage && !hasBgPattern
              ? 'none'
              : hasBgImage && hasBgPattern
                ? 'var(--bm-library-image), var(--bm-library-bg)'
                : hasBgImage
                  ? 'var(--bm-library-image)'
                  : 'var(--bm-library-bg)',
            backgroundBlendMode: hasBgImage || hasBgPattern ? 'normal, overlay' : 'normal',
            backgroundRepeat: hasBgImage && hasBgPattern ? 'no-repeat, repeat' : hasBgPattern ? 'repeat' : 'no-repeat',
            backgroundSize: hasBgImage && hasBgPattern ? 'cover, 320px 320px' : hasBgImage ? 'cover' : hasBgPattern ? '320px 320px' : 'auto',
            backgroundPosition: hasBgImage && hasBgPattern ? 'center center, 0 var(--bg-offset, 0px)' : hasBgPattern ? '0 var(--bg-offset, 0px)' : 'center center',
            backgroundAttachment: 'fixed, fixed',
            minHeight: '100vh',
            width: '100%',
            '&::before': {
              content: '""',
              position: 'fixed',
              inset: 0,
              background: `linear-gradient(
                180deg,
                ${preset.overlay.top} 0%,
                ${preset.overlay.mid} 50%,
                ${preset.overlay.bottom} 100%
              )`,
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
      MuiTextField: {
        styleOverrides: {
          root: {
            marginBottom: '8px',
            '@media (min-width:600px)': { marginBottom: '16px' },
            '& .MuiInputBase-root': {
              fontSize: '0.9rem',
              '@media (min-width:600px)': { fontSize: '1rem' },
              backgroundColor: '#ffffff',
            },
          },
        },
        defaultProps: { size: 'small', margin: 'dense' },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: '0.9rem',
            padding: '8px 16px',
            '@media (min-width:600px)': { fontSize: '1rem', padding: '10px 20px' },
          },
        },
        defaultProps: { size: 'medium' },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '8px',
            '@media (min-width:600px)': { marginBottom: '16px' },
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
            backdropFilter: `saturate(${glass.saturate}) blur(${glass.blur})`,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
            transition: 'box-shadow 160ms ease, transform 160ms ease',
            '&:hover': { boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)' },
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
            '@media (min-width:600px)': { padding: '16px' },
            '&:last-child': {
              paddingBottom: '12px',
              '@media (min-width:600px)': { paddingBottom: '16px' },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: '12px',
            '@media (min-width:600px)': { padding: '16px' },
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
            backdropFilter: `saturate(${glass.saturate}) blur(${glass.blur})`,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiMenu: {
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
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            marginBottom: '8px',
            '@media (min-width:600px)': { marginBottom: '16px' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '0.8rem',
            height: '24px',
            '@media (min-width:600px)': { fontSize: '0.9rem', height: '32px' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            margin: '16px',
            width: 'calc(100% - 32px)',
            maxWidth: '400px',
            '@media (min-width:600px)': {
              margin: '32px',
              width: 'calc(100% - 64px)',
              maxWidth: '600px',
            },
            borderRadius: 16,
            border: '1px solid rgba(15, 23, 42, 0.12)',
            backgroundColor: '#ffffff',
            backdropFilter: 'none',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22)',
            padding: 0,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: '56px',
            '@media (min-width:600px)': { height: '64px' },
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            fontSize: '0.7rem',
            '@media (min-width:600px)': { fontSize: '0.8rem' },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px) saturate(140%)',
          },
        },
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
    spacing: (factor) => `${4 * factor}px`,
  });

  const cardAccent = preset.cardAccent || 'brown';
  const cardDecorations = preset.cardDecorations ?? {
    corners: true,
    innerBorder: true,
    centerLine: true,
  };
  const glassEffect = preset.glassEffect ?? {
    opacity: 0.75,
    blur: '20px',
    saturate: '180%',
  };
  const pageHeader = preset.pageHeader ?? {
    backgroundImage: 'paper',
    goldOverlay: true,
    centerLine: true,
    borderRadius: { xs: 16, sm: 20 },
    accentKey: 'brown',
  };
  const defaultCardShadow = '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
  const defaultCardShadowHover = '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
  const cardShadow = preset.cardShadow ?? defaultCardShadow;
  const cardShadowHover = preset.cardShadowHover ?? defaultCardShadowHover;

  theme.custom = {
    ...theme.custom,
    cardAccent,
    cardDecorations,
    glassEffect,
    pageHeader,
    cardShadow,
    cardShadowHover,
    backgroundVars: {
      '--bm-library-image': hasBgImage ? bgImage : 'none',
      '--bm-library-bg': hasBgPattern ? bgPattern : 'none',
    },
  };

  return theme;
}
