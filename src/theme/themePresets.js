/**
 * テーマプリセット定義
 * doc/theme-selectable-review-20260131.md に基づく
 *
 * @param {Function} buildPath - パス構築関数 (path) => string
 */

export const THEME_PRESET_IDS = ['library-classic', 'minimal-light'];

export function getThemePresets(buildPath) {
  const bp = (path) => `url("${buildPath(path)}")`;

  return {
    'library-classic': {
      id: 'library-classic',
      name: '図書館（クラシック）',
      description: '図書館をイメージした背景と茶系の落ち着いたデザイン',
      background: {
        image: bp('/library-background.jpg'),
        pattern: bp('/library-pattern.svg'),
      },
      overlay: {
        top: 'rgba(245, 247, 250, 0.3)',
        mid: 'rgba(139, 69, 19, 0.1)',
        bottom: 'rgba(15, 23, 42, 0.2)',
      },
      backgroundColor: '#eef2ff',
      bookAccent: 'brown',
      memoAccent: 'memo',
      cardAccent: 'brown',
      bookDecorations: { corners: true, innerBorder: true, centerLine: true },
      memoDecorations: { corners: true, innerBorder: true, centerLine: false },
      cardDecorations: { corners: true, innerBorder: true, centerLine: true },
      glassEffect: { opacity: 0.75, blur: '20px', saturate: '180%' },
      pageHeader: {
        backgroundImage: 'paper',
        goldOverlay: true,
        centerLine: true,
        borderRadius: { xs: 16, sm: 20 },
        accentKey: 'brown',
      },
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      chartColors: { bar: '#42a5f5', memo: '#9c27b0' },
      motion: {
        infoCardHover: { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' },
      },
    },
    'minimal-light': {
      id: 'minimal-light',
      name: 'ミニマル（ライト）',
      description: 'シンプルな単色背景で読みやすさを重視',
      background: {
        image: 'none',
        pattern: 'none',
      },
      overlay: {
        top: 'transparent',
        mid: 'transparent',
        bottom: 'transparent',
      },
      backgroundColor: '#f5f5f5',
      bookAccent: 'neutral',
      memoAccent: 'neutral',
      cardAccent: 'neutral',
      bookDecorations: { corners: false, innerBorder: false, centerLine: false },
      memoDecorations: { corners: false, innerBorder: false, centerLine: false },
      cardDecorations: { corners: false, innerBorder: false, centerLine: false },
      glassEffect: { opacity: 0.9, blur: '12px', saturate: '140%' },
      pageHeader: {
        backgroundImage: 'none',
        goldOverlay: false,
        centerLine: false,
        borderRadius: 0,
        accentKey: 'neutral',
      },
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      chartColors: { bar: '#42a5f5', memo: '#9c27b0' },
      motion: {
        infoCardHover: { transition: 'transform 0.2s ease-in-out', hoverTransform: 'translateY(-2px)' },
      },
    },
  };
}
