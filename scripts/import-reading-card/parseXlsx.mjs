import XLSX from 'xlsx';
import fs from 'fs';
import { headerToMap, cell, parseExcelDate, norm, collapseBookTitleForSearch } from './utils.mjs';

/**
 * メモシート「rate」列のセル値 → 1〜5（星）／空・不正 → 0（未評価・MEMO_RATING.NONE 相当）
 * @param {unknown} raw
 */
export function parseMemoRateFromCell(raw) {
  if (raw === '' || raw == null) return 0;
  let n;
  if (typeof raw === 'number' && Number.isFinite(raw)) n = Math.round(raw);
  else {
    const s = String(raw).trim();
    if (!s) return 0;
    n = Math.round(parseFloat(s));
  }
  if (!Number.isFinite(n)) return 0;
  if (n >= 1 && n <= 5) return n;
  return 0;
}

/** @typedef {{ sheet: string, rowIndex: number, map: Record<string, number>, row: unknown[] }} RawYearRow */

/** 全角数字（巻号用・末尾1文字のみ抽出） */
const FULLWIDTH_DIGIT_CHARS = '０１２３４５６７８９';

/**
 * メモシート「名前」列の生文字列を、書籍名・章題・巻号に分解する。
 * - ` （再読）` 末尾は除去
 * - 改行、または半角 `-` の前後空白で区切り → 前半を書籍名、後半を storyTitle（章題・副題など）
 * - 書籍名部分の末尾が全角1桁なら巻号として切り出し、API検索用は `書名 ５` のように半角スペース区切り
 *
 * @param {unknown} raw
 */
export function parseMemoNameCell(raw) {
  let s = String(raw ?? '').trim();
  const memoNameRaw = s;
  if (!s) {
    return {
      memoNameRaw,
      bookTitle: '',
      storyTitle: null,
      volumeLabel: null,
      googleSearchTitle: '',
      bookTitleNorm: norm(''),
    };
  }

  s = s.replace(/（再読）\s*$/u, '').trim();

  let storyTitle = null;
  let bookPart = s;
  const nlParts = s.split(/\s*[\r\n]+\s*/);
  if (nlParts.length >= 2) {
    bookPart = nlParts[0].trim();
    storyTitle = nlParts.slice(1).join('\n').trim() || null;
  } else {
    const dash = s.match(/^(.+?)\s+-\s+(.+)$/);
    if (dash) {
      bookPart = dash[1].trim();
      storyTitle = dash[2].trim() || null;
    }
  }

  let volumeLabel = null;
  let bookTitle = bookPart;
  if (bookPart.length > 0) {
    const last = bookPart[bookPart.length - 1];
    if (FULLWIDTH_DIGIT_CHARS.includes(last)) {
      volumeLabel = last;
      bookTitle = bookPart.slice(0, -1).trimEnd();
    }
  }

  const googleSearchTitle = volumeLabel ? `${bookTitle} ${volumeLabel}` : bookTitle;

  return {
    memoNameRaw,
    bookTitle,
    storyTitle,
    volumeLabel,
    googleSearchTitle,
    bookTitleNorm: norm(bookTitle),
  };
}

/**
 * @param {string} filePath
 */
export function readWorkbook(filePath) {
  const buf = fs.readFileSync(filePath);
  return readWorkbookFromBuffer(buf);
}

/**
 * @param {Buffer|Uint8Array|ArrayBuffer} buf
 */
export function readWorkbookFromBuffer(buf) {
  return XLSX.read(buf, { type: 'buffer', cellStyles: true });
}

/**
 * セル内リッチテキストの rgb から rating を推定（赤5／青3／なし0）。
 * 読書カードインポートでは **使用しない**（`rate` 列のみ）。テストや他スクリプト用に残す。
 * @param {import('xlsx').CellObject | undefined} cell
 */
export function ratingFromRichTextCell(cell) {
  if (!cell || typeof cell.r !== 'string') return 0;
  const re = /rgb="([0-9A-Fa-f]{8})"/g;
  let hasRed = false;
  let hasBlue = false;
  let m;
  while ((m = re.exec(cell.r)) !== null) {
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    if (r >= 160 && r > g + 25 && r > b + 25) hasRed = true;
    if (b >= 140 && b > r + 15 && b > g + 15) hasBlue = true;
  }
  if (hasRed) return 5;
  if (hasBlue) return 3;
  return 0;
}

/**
 * メモシートで引用／メモ列のセルオブジェクトを取得（インポートの rating には未使用）。
 * @returns {{ addr: string | null, colName: string | null, col: number | null, xcell: import('xlsx').CellObject | undefined }}
 */
export function getMemoAppearanceCell(sheet, excelRow1Based, memoHeaderMap, textFromQuote) {
  if (!sheet) return { addr: null, colName: null, col: null, xcell: undefined };
  const colName = textFromQuote ? '引用' : 'メモ';
  const col = memoHeaderMap[colName];
  if (col === undefined) return { addr: null, colName, col: null, xcell: undefined };
  const addr = XLSX.utils.encode_cell({ r: excelRow1Based - 1, c: col });
  return { addr, colName, col, xcell: sheet[addr] };
}

export function ratingForMemoAppearance(sheet, excelRow1Based, memoHeaderMap, textFromQuote) {
  const { xcell } = getMemoAppearanceCell(sheet, excelRow1Based, memoHeaderMap, textFromQuote);
  return ratingFromRichTextCell(xcell);
}

/**
 * シート名が4桁年のみのものを年次読書シートとみなす。
 * @param {string} name
 */
export function isYearSheet(name) {
  return /^\d{4}$/.test(String(name).trim());
}

/**
 * メモシート: 1行目に 年・名前・メモ・引用 などを含む表を拾う。
 * @param {string[]} header
 */
export function isMemoSheetHeader(header) {
  const cells = header.map((c) => String(c ?? '').trim());
  const has = (x) => cells.includes(x);
  return has('名前') && has('年') && (has('メモ') || has('引用'));
}

/**
 * @param {import('xlsx').WorkBook} wb
 * @returns {{ yearRows: RawYearRow[], memoSheetName: string | null, memoHeaderMap: Record<string, number> | null, memoRows: unknown[][] }}
 */
export function extractRaw(wb) {
  /** @type {RawYearRow[]} */
  const yearRows = [];
  let memoSheetName = null;
  /** @type {Record<string, number> | null} */
  let memoHeaderMap = null;
  /** @type {unknown[][]} */
  let memoRows = [];

  for (const sheetName of wb.SheetNames) {
    const sh = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
    if (!rows.length) continue;

    const header = /** @type {unknown[]} */ (rows[0]);
    const hMap = headerToMap(header);

    if (isYearSheet(sheetName) && hMap['名前'] !== undefined) {
      for (let r = 1; r < rows.length; r++) {
        const row = /** @type {unknown[]} */ (rows[r]);
        const title = collapseBookTitleForSearch(cell(row, hMap, '名前'));
        if (!title) continue;
        yearRows.push({ sheet: sheetName, rowIndex: r + 1, map: hMap, row });
      }
      continue;
    }

    if (isMemoSheetHeader(/** @type {string[]} */ (header))) {
      memoSheetName = sheetName;
      memoHeaderMap = hMap;
      memoRows = rows.slice(1);
    }
  }

  return { yearRows, memoSheetName, memoHeaderMap, memoRows };
}

/**
 * @param {RawYearRow} yr
 */
export function parseYearRow(yr) {
  const { row, map, sheet } = yr;
  const title = collapseBookTitleForSearch(cell(row, map, '名前'));
  const author = String(cell(row, map, '著者') ?? '').trim();
  const rawFinished = cell(row, map, '読み終わった日');
  const finishedAt = parseExcelDate(rawFinished);
  const kansou = String(cell(row, map, '感想') ?? '').trim();
  const kikkake = String(cell(row, map, 'きっかけ') ?? '').trim();
  const sheetYear = parseInt(sheet, 10);

  return {
    sheet,
    rowIndex: yr.rowIndex,
    title,
    author,
    finishedAt,
    kansou,
    kikkake,
    sheetYear: Number.isFinite(sheetYear) ? sheetYear : null,
  };
}

/**
 * @param {unknown[]} row
 * @param {Record<string, number>} memoHeaderMap
 * @param {string} sheet
 * @param {number} rowIndex
 */
export function parseMemoRow(row, memoHeaderMap, sheet, rowIndex) {
  const nameParsed = parseMemoNameCell(cell(row, memoHeaderMap, '名前'));
  if (!nameParsed.bookTitle) {
    return { skip: true, reason: '書籍名（名前）が空' };
  }
  const bookTitle = nameParsed.bookTitle;
  const yearVal = cell(row, memoHeaderMap, '年');
  let memoYear = null;
  if (typeof yearVal === 'number' && Number.isFinite(yearVal)) memoYear = yearVal;
  else if (yearVal !== '' && yearVal != null) {
    const n = parseInt(String(yearVal), 10);
    if (Number.isFinite(n)) memoYear = n;
  }
  const memoText = String(cell(row, memoHeaderMap, 'メモ') ?? '').trim();
  const quote = String(cell(row, memoHeaderMap, '引用') ?? '').trim();
  const pageRaw = cell(row, memoHeaderMap, 'ページ');
  let page = null;
  if (pageRaw !== '' && pageRaw != null) {
    const n = typeof pageRaw === 'number' ? pageRaw : parseInt(String(pageRaw), 10);
    if (Number.isFinite(n)) page = n;
  }
  const tsuiki = String(cell(row, memoHeaderMap, '追記') ?? '').trim();
  const hasRateColumn = memoHeaderMap.rate !== undefined;
  const rating = hasRateColumn ? parseMemoRateFromCell(cell(row, memoHeaderMap, 'rate')) : 0;
  const textFromQuote = !!quote.trim();

  let text = quote;
  let comment = memoText;
  if (!quote.trim() && memoText) {
    text = memoText;
    comment = '';
  }
  if (tsuiki) {
    comment = comment ? `${comment}\n\n【追記】${tsuiki}` : `【追記】${tsuiki}`;
  }
  if (!text.trim()) {
    return { skip: true, reason: '引用・メモ・追記がすべて空' };
  }

  /** @type {Record<string, unknown>} */
  const memoExtra = {};
  if (nameParsed.storyTitle) memoExtra.storyTitle = nameParsed.storyTitle;
  if (nameParsed.volumeLabel) memoExtra.volumeLabel = nameParsed.volumeLabel;

  return {
    skip: false,
    sheet,
    rowIndex,
    bookTitle,
    bookTitleNorm: nameParsed.bookTitleNorm,
    memoNameRaw: nameParsed.memoNameRaw,
    googleSearchTitle: nameParsed.googleSearchTitle,
    storyTitle: nameParsed.storyTitle,
    volumeLabel: nameParsed.volumeLabel,
    memoYear,
    textFromQuote,
    memo: { text, comment, page, rating, tags: [], ...memoExtra },
  };
}
