/**
 * 書籍・メモカードの共通スタイル生成
 * design-implementation-plan.md Phase 2
 */

import { FALLBACK_BROWN, FALLBACK_MEMO } from './fallbacks';

const DEFAULT_CARD_SHADOW = '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
const DEFAULT_CARD_SHADOW_HOVER = '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)';

/**
 * 書籍カード用の基本 sx を生成
 * @param {Object} theme - MUI theme（theme.custom, theme.palette.decorative を使用）
 * @param {Object} options - オプション
 * @param {boolean} [options.hover=true] - ホバースタイルを含めるか
 * @param {boolean} [options.hoverTransform=true] - ホバー時に translateY を含めるか
 * @param {Object} [options.overrides={}] - マージする追加 sx
 * @returns {Object} sx オブジェクト
 */
export function getBookCardSx(theme, options = {}) {
  const { hover = true, hoverTransform = true, overrides = {} } = options;

  const accentKey = theme.custom?.bookAccent ?? theme.custom?.cardAccent ?? 'brown';
  const accent = theme.palette?.decorative?.[accentKey] || FALLBACK_BROWN;
  const decorations = theme.custom?.bookDecorations ?? theme.custom?.cardDecorations ?? {
    corners: true, innerBorder: true, centerLine: true,
  };
  const glass = theme.custom?.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };
  const cardShadow = theme.custom?.cardShadow ?? DEFAULT_CARD_SHADOW;
  const cardShadowHover = theme.custom?.cardShadowHover ?? DEFAULT_CARD_SHADOW_HOVER;

  const base = {
    backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
    backdropFilter: `blur(${glass.blur}) saturate(${glass.saturate})`,
    border: `2px solid ${accent.light}`,
    borderRadius: 3,
    boxShadow: cardShadow,
    position: 'relative',
    overflow: 'visible',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(decorations.innerBorder && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        border: `1px solid ${accent.lighter}`,
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
    ...(decorations.centerLine && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 1,
        height: '100%',
        background: `linear-gradient(to bottom, transparent, ${accent.lighter}, transparent)`,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
  };

  if (hover) {
    base['&:hover'] = {
      boxShadow: cardShadowHover,
      borderColor: accent.borderHover || accent.light,
    };
    if (hoverTransform) {
      base['&:hover'].transform = 'translateY(-4px)';
    }
  }

  return { ...base, ...overrides };
}

/**
 * メモカード用の基本 sx を生成
 * @param {Object} theme - MUI theme
 * @param {Object} options - オプション
 * @param {boolean} [options.hover=true] - ホバースタイルを含めるか
 * @param {boolean|string} [options.hoverTransform=false] - ホバー時に translateY を含めるか。true のとき -4px、文字列のときその値（例: '-3px'）
 * @param {boolean} [options.useMemoAccentShadow=false] - accent.shadow を boxShadow に含めるか（SearchResults 用）
 * @param {number} [options.borderRadius=3] - 角丸
 * @param {number} [options.innerBorderInset=8] - 内枠の inset（px）
 * @param {Object} [options.overrides={}] - マージする追加 sx
 * @returns {Object} sx オブジェクト
 */
const FOLDED_CORNER_SIZE = 20;
const FOLDED_CORNER_COLOR = 'rgba(0, 0, 0, 0.08)';

function getFoldedCornerPseudo(position, accent) {
  const foldColor = accent?.lighter || FOLDED_CORNER_COLOR;
  const w = FOLDED_CORNER_SIZE;
  const positions = {
    'top-right': {
      top: 0,
      right: 0,
      borderWidth: `0 ${w}px ${w}px 0`,
      borderColor: `transparent ${foldColor} transparent transparent`,
    },
    'top-left': {
      top: 0,
      left: 0,
      borderWidth: `${w}px ${w}px 0 0`,
      borderColor: `${foldColor} transparent transparent transparent`,
    },
    'bottom-right': {
      bottom: 0,
      right: 0,
      borderWidth: `0 0 ${w}px ${w}px`,
      borderColor: `transparent transparent ${foldColor} transparent`,
    },
    'bottom-left': {
      bottom: 0,
      left: 0,
      borderWidth: `${w}px 0 0 ${w}px`,
      borderColor: `transparent transparent transparent ${foldColor}`,
    },
  };
  const pos = positions[position] || positions['top-right'];
  return {
    content: '""',
    position: 'absolute',
    ...pos,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    pointerEvents: 'none',
    zIndex: 1,
  };
}

export function getMemoCardSx(theme, options = {}) {
  const {
    hover = true,
    hoverTransform = false,
    useMemoAccentShadow = false,
    borderRadius: optionsBorderRadius,
    innerBorderInset = 8,
    overrides = {},
  } = options;

  const accentKey = theme.custom?.memoAccent ?? theme.custom?.cardAccent ?? 'memo';
  const accent = theme.palette?.decorative?.[accentKey] || FALLBACK_MEMO;
  const decorations = theme.custom?.memoDecorations ?? theme.custom?.cardDecorations ?? {
    corners: true, innerBorder: true, centerLine: true,
  };
  const borderRadius = optionsBorderRadius ?? decorations.borderRadius ?? 3;
  const glass = theme.custom?.glassEffect ?? { opacity: 0.75, blur: '20px', saturate: '180%' };
  const memoBg = accent.bgTint ?? `rgba(255, 255, 255, ${glass.opacity})`;

  let cardShadow = theme.custom?.cardShadow ?? DEFAULT_CARD_SHADOW;
  let cardShadowHover = theme.custom?.cardShadowHover ?? DEFAULT_CARD_SHADOW_HOVER;
  if (useMemoAccentShadow) {
    const shadowFallback = accent.shadow || 'rgba(123, 104, 238, 0.08)';
    const shadowHoverFallback = accent.shadowHover || accent.shadow || 'rgba(123, 104, 238, 0.12)';
    cardShadow = `0 6px 24px rgba(0, 0, 0, 0.1), 0 2px 8px ${shadowFallback}, inset 0 1px 0 rgba(255, 255, 255, 0.6)`;
    cardShadowHover = `0 10px 32px rgba(0, 0, 0, 0.12), 0 4px 12px ${shadowHoverFallback}, inset 0 1px 0 rgba(255, 255, 255, 0.65)`;
  }

  const pseudoAfter = decorations.foldedCorner
    ? getFoldedCornerPseudo(decorations.foldedCornerPosition || 'top-right', accent)
    : decorations.centerLine
      ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 1,
          height: '100%',
          background: `linear-gradient(to bottom, transparent, ${accent.lighter}, transparent)`,
          pointerEvents: 'none',
          zIndex: 0,
        }
      : null;

  const base = {
    backgroundColor: memoBg,
    backdropFilter: `blur(${glass.blur}) saturate(${glass.saturate})`,
    border: `2px solid ${accent.light}`,
    borderRadius,
    boxShadow: cardShadow,
    position: 'relative',
    overflow: 'visible',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(decorations.innerBorder && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: innerBorderInset,
        left: innerBorderInset,
        right: innerBorderInset,
        bottom: innerBorderInset,
        border: `1px solid ${accent.lighter}`,
        borderRadius: Math.max(1, borderRadius - 1),
        pointerEvents: 'none',
        zIndex: 0,
      },
    }),
    ...(pseudoAfter && { '&::after': pseudoAfter }),
  };

  if (hover) {
    base['&:hover'] = {
      boxShadow: cardShadowHover,
      borderColor: accent.borderHover || accent.light,
    };
    if (hoverTransform) {
      base['&:hover'].transform = typeof hoverTransform === 'string'
        ? `translateY(${hoverTransform})`
        : 'translateY(-4px)';
    }
  }

  return { ...base, ...overrides };
}

/**
 * 書籍カード用の accent 情報を取得（DecorativeCorner 等で使用）
 */
export function getBookAccent(theme) {
  const accentKey = theme.custom?.bookAccent ?? theme.custom?.cardAccent ?? 'brown';
  return {
    key: accentKey,
    palette: theme.palette?.decorative?.[accentKey] || FALLBACK_BROWN,
  };
}

/**
 * メモカード用の accent 情報を取得
 */
export function getMemoAccent(theme) {
  const accentKey = theme.custom?.memoAccent ?? theme.custom?.cardAccent ?? 'memo';
  return {
    key: accentKey,
    palette: theme.palette?.decorative?.[accentKey] || FALLBACK_MEMO,
  };
}

/**
 * 書籍カード用の decorations を取得
 */
export function getBookDecorations(theme) {
  return theme.custom?.bookDecorations ?? theme.custom?.cardDecorations ?? {
    corners: true, innerBorder: true, centerLine: true,
  };
}

/**
 * メモカード用の decorations を取得
 */
export function getMemoDecorations(theme) {
  return theme.custom?.memoDecorations ?? theme.custom?.cardDecorations ?? {
    corners: true, innerBorder: true, centerLine: true,
  };
}
