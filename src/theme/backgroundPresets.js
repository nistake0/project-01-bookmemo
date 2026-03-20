/**
 * 背景プリセット定義
 * doc/design-background-customization-20250320.md に基づく
 * doc/design-image-candidates.md の候補 #1-#10 を使用
 * テーマとは独立し、ユーザーが選択可能な背景候補を定義
 * 背景画像は public/backgrounds/ に配置（他アセットと分離）
 *
 * @param {Function} buildPath - パス構築関数 (path) => string
 */

/** 背景画像のベースパス（public/backgrounds/ 配下） */
const BG_BASE = '/backgrounds';

export const BACKGROUND_PRESET_IDS = [
  'none',
  'bg-01',
  'bg-02',
  'bg-03',
  'bg-04',
  'bg-05',
  'bg-06',
  'bg-07',
  'bg-08',
  'bg-09',
  'bg-10',
];

/** doc/design-image-candidates.md の候補 #1-#10 */
const CANDIDATES = [
  { id: 'bg-01', name: 'NYPL・ローズ閲覧室', desc: 'ニューヨーク公共図書館', file: 'bg-01.jpg' },
  { id: 'bg-02', name: '茶色の木製書棚', desc: '暖色・パースあり', file: 'bg-02.jpg' },
  { id: 'bg-03', name: 'ストックホルム市立図書館', desc: 'スウェーデン・温かい光', file: 'bg-03.jpg' },
  { id: 'bg-04', name: 'ウェルズ大聖堂図書館', desc: '英国・重厚な書棚', file: 'bg-04.jpg' },
  { id: 'bg-05', name: 'ノルウェー国立図書館', desc: '北欧・落ち着いた雰囲気', file: 'bg-05.jpg' },
  { id: 'bg-06', name: 'ヴィンテージ図書館', desc: '古典的な書架', file: 'bg-06.jpg' },
  { id: 'bg-07', name: '古い図書館室内', desc: '暖色・落ち着いたトーン', file: 'bg-07.jpg' },
  { id: 'bg-08', name: 'ヴィンテージ図書館', desc: '書棚＋奥行き', file: 'bg-08.jpg' },
  { id: 'bg-09', name: 'はしご付き書棚', desc: '図書館らしい構図', file: 'bg-09.jpg' },
  { id: 'bg-10', name: 'ノルウェー国立図書館', desc: '天井高め・重厚', file: 'bg-10.jpg' },
];

export function getBackgroundPresets(buildPath) {
  const bp = (path) => `url("${buildPath(path)}")`;

  const presets = {
    none: {
      id: 'none',
      name: 'なし（単色）',
      description: '背景は単色のみ。色を選べます',
      type: 'solid',
      image: null,
      pattern: null,
      thumbnail: null,
    },
  };

  CANDIDATES.forEach((c) => {
    const path = `${BG_BASE}/${c.file}`;
    presets[c.id] = {
      id: c.id,
      name: c.name,
      description: c.desc,
      type: 'image',
      image: bp(path),
      pattern: null,
      thumbnail: bp(path),
    };
  });

  return presets;
}
