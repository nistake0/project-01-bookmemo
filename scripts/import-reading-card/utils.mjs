import XLSX from 'xlsx';

/** @param {unknown} s */
export function norm(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * 書籍シート「名前」や API 検索用: 改行を空白にし、連続空白を畳んで1行にする。
 * @param {unknown} s
 */
export function collapseBookTitleForSearch(s) {
  return String(s ?? '')
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .replace(/[ \u3000]+/g, ' ')
    .trim();
}

/**
 * @param {unknown} title
 * @param {unknown} author
 */
export function makeBookKey(title, author) {
  return `${norm(title)}::${norm(author)}`;
}

/**
 * Excel / 文字列を Date に。
 * @param {unknown} value
 * @param {number} [fallbackYear] — 日付が無いときの placeholder 用（使う側で判断）
 */
export function parseExcelDate(value) {
  if (value === '' || value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const p = XLSX.SSF?.parse_date_code?.(value);
    if (p) return new Date(Date.UTC(p.y, p.m - 1, p.d, p.H || 0, p.M || 0, p.S || 0));
  }
  if (typeof value === 'string') {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
}

/** @param {Date} d */
export function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** @param {unknown[]} headerRow */
export function headerToMap(headerRow) {
  /** @type {Record<string, number>} */
  const m = {};
  headerRow.forEach((cell, i) => {
    if (cell === '' || cell == null) return;
    const k = String(cell).trim();
    if (k && m[k] === undefined) m[k] = i;
  });
  return m;
}

/**
 * @param {unknown[]} row
 * @param {Record<string, number>} map
 * @param {string} col
 */
export function cell(row, map, col) {
  const i = map[col];
  if (i === undefined) return '';
  const v = row[i];
  return v === undefined || v === null ? '' : v;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
