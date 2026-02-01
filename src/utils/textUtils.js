/**
 * テキスト処理ユーティリティ
 * メモテキストのURL検出・リンク化に使用
 */

/**
 * テキストからURLを検出し、URL部分と非URL部分に分割する
 * @param {string} text - 検索対象のテキスト
 * @returns {Array<{text: string, isUrl: boolean}>} テキストパーツの配列
 */
export function parseUrls(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // https?:// で始まるURL（スペース・改行・括弧等で終端）
  const urlRegex = /(https?:\/\/[^\s\]\)'"<>]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // URLの前のテキスト
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isUrl: false,
      });
    }
    parts.push({
      text: match[1],
      isUrl: true,
    });
    lastIndex = match.index + match[1].length;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isUrl: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, isUrl: false }];
}

/**
 * テキストにURLが含まれるかどうか
 * @param {string} text
 * @returns {boolean}
 */
export function hasUrl(text) {
  if (!text || typeof text !== 'string') return false;
  return /https?:\/\//.test(text);
}
