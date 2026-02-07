import { createTheme } from '@mui/material/styles';
import { getThemePresets } from './themePresets';
import { DEFAULT_THEME_PRESET_ID } from '../constants/userSettings';

/** ダークモード用 decorative パレット（暗背景で見やすい色） */
const DECORATIVE_DARK = {
  brown: {
    main: 'rgba(196, 165, 116, 1)',
    light: 'rgba(196, 165, 116, 0.35)',
    lighter: 'rgba(196, 165, 116, 0.2)',
    border: 'rgba(196, 165, 116, 0.4)',
    borderHover: 'rgba(196, 165, 116, 0.5)',
  },
  gold: {
    accent: 'rgba(218, 165, 32, 0.25)',
    subtle: 'rgba(218, 165, 32, 0.12)',
    stroke: 'rgba(218, 165, 32, 0.5)',
    strokeLight: 'rgba(218, 165, 32, 0.4)',
  },
  memo: {
    main: 'rgba(159, 168, 218, 1)',
    light: 'rgba(159, 168, 218, 0.35)',
    lighter: 'rgba(159, 168, 218, 0.2)',
    border: 'rgba(159, 168, 218, 0.4)',
    borderHover: 'rgba(159, 168, 218, 0.5)',
    shadow: 'rgba(159, 168, 218, 0.15)',
    shadowHover: 'rgba(159, 168, 218, 0.2)',
    bgTint: 'rgba(40, 38, 55, 0.95)',
  },
  neutral: {
    light: 'rgba(200, 200, 200, 0.25)',
    lighter: 'rgba(200, 200, 200, 0.15)',
    border: 'rgba(200, 200, 200, 0.3)',
    borderHover: 'rgba(200, 200, 200, 0.35)',
  },
};

/**
 * fontSize 文字列に scale を適用（'1.8rem' → '1.58rem' 等）
 * @param {string} value - '1.8rem' 等
 * @param {number} scale - 乗数（0.88 等）
 * @returns {string}
 */
function scaleFontSize(value, scale) {
  if (typeof value !== 'string' || scale === 1) return value;
  const m = value.match(/^([\d.]+)(rem|px|em)$/);
  return m ? `${(parseFloat(m[1]) * scale).toFixed(2)}${m[2]}` : value;
}

/**
 * オブジェクト内の fontSize を再帰的に scale 適用
 */
function scaleTypographyObj(obj, scale) {
  if (!obj || scale === 1) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'fontSize' && typeof v === 'string') {
      out[k] = scaleFontSize(v, scale);
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[k] = scaleTypographyObj(v, scale);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** プリセットに dark が無い場合のデフォルト値 */
const DEFAULT_DARK = {
  backgroundColor: '#121212',
  overlay: {
    top: 'rgba(15, 15, 25, 0.8)',
    mid: 'rgba(25, 25, 35, 0.6)',
    bottom: 'rgba(8, 8, 12, 0.9)',
  },
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  loadingIndicator: {
    container: {
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
    },
  },
  chartColors: { bar: '#64b5f6', memo: '#ba68c8' },
};

/**
 * テーマプリセットIDからMUIテーマを生成
 *
 * @param {string} presetId - プリセットID
 * @param {Function} buildPath - パス構築関数 (path) => string
 * @param {string} [mode='normal'] - 'normal' | 'dark'
 * @returns {Object} MUI theme object
 */
export function createThemeFromPreset(presetId, buildPath, mode = 'normal') {
  const presets = getThemePresets(buildPath);
  const preset = presets[presetId] || presets[DEFAULT_THEME_PRESET_ID];
  const isDark = mode === 'dark';
  const darkOverrides = preset.dark ?? DEFAULT_DARK;
  const effectivePreset = isDark
    ? {
        ...preset,
        backgroundColor: darkOverrides.backgroundColor ?? preset.backgroundColor,
        overlay: darkOverrides.overlay ?? preset.overlay,
        cardShadow: darkOverrides.cardShadow ?? preset.cardShadow,
        cardShadowHover: darkOverrides.cardShadowHover ?? preset.cardShadowHover,
        chartColors: darkOverrides.chartColors ?? preset.chartColors,
        loadingIndicator: {
          ...preset.loadingIndicator,
          container: {
            ...preset.loadingIndicator?.container,
            ...darkOverrides.loadingIndicator?.container,
          },
        },
      }
    : preset;

  const typographyScale = preset.typographyScale ?? 1;
  const bgImage = preset.background.image === 'none' ? 'none' : preset.background.image;
  const bgPattern = preset.background.pattern === 'none' ? 'none' : preset.background.pattern;
  const hasBgImage = bgImage !== 'none';
  const hasBgPattern = bgPattern !== 'none';
  const glass = preset.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };

  const baseTypography = {
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
  };
  const typography = scaleTypographyObj(baseTypography, typographyScale);

  const glassBg = isDark
    ? `rgba(40, 40, 50, ${glass.opacity})`
    : `rgba(255, 255, 255, ${glass.opacity})`;
  const paperBg = isDark ? 'rgba(45, 45, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const inputBg = isDark ? 'rgba(45, 45, 55, 1)' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';
  const borderColorStrong = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.12)';
  const cardShadow = isDark ? '0 10px 28px rgba(0, 0, 0, 0.3)' : '0 10px 28px rgba(15, 23, 42, 0.08)';
  const cardShadowHover = isDark ? '0 16px 36px rgba(0, 0, 0, 0.4)' : '0 16px 36px rgba(15, 23, 42, 0.12)';
  const popoverShadow = isDark ? '0 14px 40px rgba(0, 0, 0, 0.5)' : '0 14px 40px rgba(15, 23, 42, 0.18)';
  const dialogShadow = isDark ? '0 20px 60px rgba(0, 0, 0, 0.6)' : '0 20px 60px rgba(15, 23, 42, 0.22)';
  const alertBg = isDark ? 'rgba(45, 45, 55, 0.9)' : 'rgba(255, 255, 255, 0.85)';

  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      background: {
        default: effectivePreset.backgroundColor,
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      primary: { main: '#1976d2' },
      secondary: { main: '#f50057' },
      success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
      warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
      info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
      error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
      text: { primary: isDark ? '#ffffff' : '#222' },
      decorative: isDark ? DECORATIVE_DARK : {
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
          bgTint: 'rgba(250, 248, 255, 0.95)',
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
          text: { title: isDark ? '#f5f5dc' : '#FFF8DC', subtitle: isDark ? '#e8e8e0' : '#F5F5DC' },
        },
      },
    },
    typography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '#app-scroll-container': {
            position: 'relative',
            backgroundColor: effectivePreset.backgroundColor,
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
                ${effectivePreset.overlay.top} 0%,
                ${effectivePreset.overlay.mid} 50%,
                ${effectivePreset.overlay.bottom} 100%
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
            marginBottom: scaleFontSize('8px', typographyScale),
            '@media (min-width:600px)': { marginBottom: scaleFontSize('16px', typographyScale) },
            '& .MuiInputBase-root': {
              fontSize: scaleFontSize('0.9rem', typographyScale),
              '@media (min-width:600px)': { fontSize: scaleFontSize('1rem', typographyScale) },
              backgroundColor: inputBg,
            },
          },
        },
        defaultProps: { size: 'small', margin: 'dense' },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: scaleFontSize('0.9rem', typographyScale),
            padding: `${8 * typographyScale}px ${16 * typographyScale}px`,
            '@media (min-width:600px)': {
              fontSize: scaleFontSize('1rem', typographyScale),
              padding: `${10 * typographyScale}px ${20 * typographyScale}px`,
            },
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
            border: `1px solid ${borderColor}`,
            backgroundColor: glassBg,
            backdropFilter: `saturate(${glass.saturate}) blur(${glass.blur})`,
            boxShadow: cardShadow,
            transition: 'box-shadow 160ms ease, transform 160ms ease',
            '&:hover': { boxShadow: cardShadowHover },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: `${12 * typographyScale}px`,
            '@media (min-width:600px)': { padding: `${16 * typographyScale}px` },
            '&:last-child': {
              paddingBottom: `${12 * typographyScale}px`,
              '@media (min-width:600px)': { paddingBottom: `${16 * typographyScale}px` },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: `${12 * typographyScale}px`,
            '@media (min-width:600px)': { padding: `${16 * typographyScale}px` },
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            backgroundColor: glassBg,
            backdropFilter: `saturate(${glass.saturate}) blur(${glass.blur})`,
            boxShadow: cardShadow,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${borderColorStrong}`,
            backgroundColor: paperBg,
            backdropFilter: 'none',
            boxShadow: popoverShadow,
            padding: 0,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${borderColorStrong}`,
            backgroundColor: paperBg,
            backdropFilter: 'none',
            boxShadow: popoverShadow,
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
            fontSize: scaleFontSize('0.8rem', typographyScale),
            height: `${24 * typographyScale}px`,
            '@media (min-width:600px)': {
              fontSize: scaleFontSize('0.9rem', typographyScale),
              height: `${32 * typographyScale}px`,
            },
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
            border: `1px solid ${borderColorStrong}`,
            backgroundColor: inputBg,
            backdropFilter: 'none',
            boxShadow: dialogShadow,
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
            fontSize: scaleFontSize('0.7rem', typographyScale),
            '@media (min-width:600px)': { fontSize: scaleFontSize('0.8rem', typographyScale) },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            backgroundColor: alertBg,
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

  const bookAccent = preset.bookAccent ?? preset.cardAccent ?? 'brown';
  const memoAccent = preset.memoAccent ?? preset.cardAccent ?? 'memo';
  const cardAccent = preset.cardAccent ?? bookAccent;
  const bookDecorations = preset.bookDecorations ?? preset.cardDecorations ?? {
    corners: true,
    innerBorder: true,
    centerLine: true,
  };
  const memoDecorations = preset.memoDecorations ?? preset.cardDecorations ?? {
    corners: true,
    innerBorder: true,
    centerLine: false,
  };
  const cardDecorations = preset.cardDecorations ?? bookDecorations;
  const glassEffect = preset.glassEffect ?? {
    opacity: 0.75,
    blur: '20px',
    saturate: '180%',
  };
  const defaultPageHeader = {
    backgroundImage: 'paper',
    goldOverlay: true,
    centerLine: true,
    borderRadius: { xs: 16, sm: 20 },
    accentKey: 'brown',
    titleFontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
    subtitleFontSize: { xs: '0.9rem', sm: '1rem' },
  };
  const pageHeader = { ...defaultPageHeader, ...preset.pageHeader };
  const defaultCardShadow = '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
  const defaultCardShadowHover = '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)';
  const cardShadowCustom = effectivePreset.cardShadow ?? defaultCardShadow;
  const cardShadowHoverCustom = effectivePreset.cardShadowHover ?? defaultCardShadowHover;
  const chartColors = effectivePreset.chartColors ?? { bar: '#42a5f5', memo: '#9c27b0' };
  const defaultInfoCardHover = { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' };
  const motion = {
    infoCardHover: preset.motion?.infoCardHover ?? defaultInfoCardHover,
  };
  const defaultTypographyOverrides = {
    cardTitle: { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
    cardSubtext: { fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' } },
    cardCaption: { fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } },
    chipLabel: { fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, height: { xs: 18, sm: 20, md: 22 } },
    formText: { fontSize: { xs: '0.8rem', sm: '0.9rem' } },
    chipSmall: { fontSize: '0.75rem' },
    formChip: { fontSize: { xs: '0.75rem', sm: '0.8rem' }, height: { xs: 24, sm: 28 } },
  };
  const defaultSizes = {
    bookCoverCard: { width: { xs: 50, sm: 60 }, height: { xs: 70, sm: 80 } },
    bookCoverDetail: { maxHeight: 250, width: 167 },
    bookCoverFormPreview: { maxHeight: 120 },
    bookCoverDialogPreview: { maxHeight: 180 },
    bookCard: { minHeight: { xs: 140, sm: 160 }, tagAreaMinHeight: { xs: 32, sm: 36 } },
    memoCard: {
      textArea: { minHeight: 48, maxHeight: 80 },
      actionArea: { minHeight: { xs: 48, sm: 64 }, maxHeight: { xs: 72, sm: 88 } },
    },
    formButton: { height: { xs: 40, sm: 56 } },
  };
  const defaultSpacing = {
    cardPadding: { xs: 1.5, sm: 2 },
  };
  const typographyOverrides = preset.typographyOverrides ?? defaultTypographyOverrides;
  const sizes = { ...defaultSizes, ...preset.sizes };
  const spacing = preset.spacing ?? defaultSpacing;
  const layout = preset.layout;
  const defaultLoadingIndicator = {
    accentKey: 'neutral',
    container: {
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: 2,
      boxShadow: isDark ? '0 2px 12px rgba(0, 0, 0, 0.4)' : '0 2px 12px rgba(0, 0, 0, 0.08)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.06)',
    },
  };
  const loadingIndicator = {
    ...defaultLoadingIndicator,
    ...effectivePreset.loadingIndicator,
    container: { ...defaultLoadingIndicator.container, ...(effectivePreset.loadingIndicator?.container ?? {}) },
  };

  const cardInsetHighlight = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)';
  const cardInsetHighlightHover = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)';

  const phBgImage = preset.pageHeader?.backgroundImage ?? 'paper';
  const pageHeaderSurface = isDark
    ? {
        backgroundColor: 'rgba(40, 40, 55, 0.85)',
        backgroundImage: phBgImage === 'paper'
          ? `linear-gradient(135deg, rgba(45, 45, 60, 0.9), rgba(35, 35, 50, 0.8))`
          : 'linear-gradient(135deg, rgba(45, 45, 60, 0.9), rgba(40, 40, 55, 0.85))',
        boxShadow: '0 18px 50px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        titleColor: '#f5f5dc',
        subtitleColor: 'rgba(255, 255, 255, 0.85)',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backgroundImage: phBgImage === 'paper'
          ? undefined
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.7))',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        titleColor: 'rgba(15, 23, 42, 0.92)',
        subtitleColor: 'rgba(51, 65, 85, 0.92)',
      };

  theme.custom = {
    ...theme.custom,
    isDark,
    glassBackgroundColor: glassBg,
    cardInsetHighlight,
    cardInsetHighlightHover,
    pageHeaderSurface,
    layout,
    loadingIndicator,
    bookAccent,
    memoAccent,
    cardAccent,
    bookDecorations,
    memoDecorations,
    cardDecorations,
    glassEffect,
    pageHeader,
    cardShadow: cardShadowCustom,
    cardShadowHover: cardShadowHoverCustom,
    chartColors,
    motion,
    typographyOverrides,
    sizes,
    spacing,
    backgroundVars: {
      '--bm-library-image': hasBgImage ? bgImage : 'none',
      '--bm-library-bg': hasBgPattern ? bgPattern : 'none',
    },
  };

  return theme;
}
