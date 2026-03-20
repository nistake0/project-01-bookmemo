/**
 * 背景プリセット定義
 * doc/design-background-customization-20250320.md に基づく
 * テーマとは独立し、ユーザーが選択可能な背景候補を定義
 * 背景画像は public/backgrounds/ に配置（他アセットと分離）
 *
 * @param {Function} buildPath - パス構築関数 (path) => string
 */

/** 背景画像のベースパス（public/backgrounds/ 配下） */
const BG_BASE = '/backgrounds';

export const BACKGROUND_PRESET_IDS = ['none', 'library', 'library-patterned', 'bookshelf'];

export function getBackgroundPresets(buildPath) {
  const bp = (path) => `url("${buildPath(path)}")`;

  return {
    none: {
      id: 'none',
      name: 'なし（単色）',
      description: '背景は単色のみ。色を選べます',
      type: 'solid',
      image: null,
      pattern: null,
      thumbnail: null,
    },
    library: {
      id: 'library',
      name: '図書館',
      description: '図書館の写真',
      type: 'image',
      image: bp(`${BG_BASE}/library.jpg`),
      pattern: null,
      thumbnail: bp(`${BG_BASE}/library.jpg`),
    },
    'library-patterned': {
      id: 'library-patterned',
      name: '図書館（柄付き）',
      description: '図書館の写真とパターン',
      type: 'image',
      image: bp(`${BG_BASE}/library.jpg`),
      pattern: bp(`${BG_BASE}/library-pattern.svg`),
      thumbnail: bp(`${BG_BASE}/library.jpg`),
    },
    bookshelf: {
      id: 'bookshelf',
      name: '本棚',
      description: '本棚の写真',
      type: 'image',
      image: bp(`${BG_BASE}/bookshelf.jpg`),
      pattern: null,
      thumbnail: bp(`${BG_BASE}/bookshelf.jpg`),
    },
  };
}
