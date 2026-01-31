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
      cardAccent: 'brown',
      cardDecorations: { corners: true, innerBorder: true, centerLine: true },
      glassEffect: { opacity: 0.75, blur: '20px', saturate: '180%' },
      pageHeader: {
        backgroundImage: 'paper',
        goldOverlay: true,
        centerLine: true,
        borderRadius: { xs: 16, sm: 20 },
        accentKey: 'brown',
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
      cardAccent: 'neutral',
      cardDecorations: { corners: false, innerBorder: false, centerLine: false },
      glassEffect: { opacity: 0.9, blur: '12px', saturate: '140%' },
      pageHeader: {
        backgroundImage: 'none',
        goldOverlay: false,
        centerLine: false,
        borderRadius: 0,
        accentKey: 'neutral',
      },
    },
  };
}
