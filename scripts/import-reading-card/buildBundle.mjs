import XLSX from 'xlsx';
import { makeBookKey, norm } from './utils.mjs';
import { parseYearRow, parseMemoRow } from './parseXlsx.mjs';
import { searchBook } from './googleBooks.mjs';

const KANSOU_TAG = '感想文';
const KIKKAKE_TAG = 'きっかけ';

/**
 * @param {string} where
 * @param {string[]} detailLines
 */
function stderrBookUnresolvable(where, detailLines) {
  console.error(`[import] 書籍を確定できません — ${where}`);
  for (const ln of detailLines) console.error(`  ${ln}`);
}
/**
 * @param {import('./parseXlsx.mjs').RawYearRow[]} yearRows
 */
function groupYearRows(yearRows) {
  /** @type {Map<string, ReturnType<typeof parseYearRow>[]>} */
  const m = new Map();
  for (const yr of yearRows) {
    const p = parseYearRow(yr);
    const key = makeBookKey(p.title, p.author);
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(p);
  }
  return m;
}

/**
 * @param {ReturnType<typeof parseYearRow>[]} rows
 */
function mergeYearGroup(rows) {
  let maxFinished = null;
  let maxSheetYear = null;
  for (const r of rows) {
    if (r.finishedAt && (!maxFinished || r.finishedAt > maxFinished)) maxFinished = r.finishedAt;
    if (r.sheetYear != null && (!maxSheetYear || r.sheetYear > maxSheetYear)) maxSheetYear = r.sheetYear;
  }
  rows.sort((a, b) => {
    const ta = a.finishedAt?.getTime() ?? 0;
    const tb = b.finishedAt?.getTime() ?? 0;
    return tb - ta;
  });
  const primary = rows[0];
  const kansous = [...new Set(rows.map((r) => r.kansou).filter(Boolean))];
  const kikkakes = [...new Set(rows.map((r) => r.kikkake).filter(Boolean))];
  return { rows, primary, maxFinished, maxSheetYear, kansous, kikkakes };
}

/**
 * @param {Date | null} finished
 * @param {number | null} sheetYear
 */
function placeholderFinished(finished, sheetYear) {
  if (finished) return finished;
  if (sheetYear) return new Date(Date.UTC(sheetYear, 0, 1));
  return null;
}

/**
 * @param {string | null} apiKey
 * @param {Map<string, ReturnType<typeof mergeYearGroup>>} grouped
 * @param {{ warnings: string[], skippedMemos: string[] }} report
 * @param {((s: string) => void) | null} debugLog
 */
async function enrichWithGoogle(apiKey, grouped, report, debugLog) {
  /** @type {Map<string, any>} */
  const out = new Map();
  let n = 0;
  for (const [key, merged] of grouped) {
    n += 1;
    const { primary, maxFinished, maxSheetYear, kansous, kikkakes } = merged;
    const sheetY = maxSheetYear;
    const ph = placeholderFinished(maxFinished, sheetY);

    let gb = { hit: null, queryTried: [], error: null };
    if (!apiKey) {
      const w = `Google Books APIキー未設定のため書誌未解決 (${primary.title})`;
      report.warnings.push(w);
      stderrBookUnresolvable('書籍シート', [
        `理由: ${w}`,
        `名前(1行化): ${primary.title}`,
        `著者: ${primary.author || '(なし)'}`,
        `年シート行: ${merged.rows.map((r) => `${r.sheet}:${r.rowIndex}`).join(', ')}`,
      ]);
    } else {
      gb = await searchBook(apiKey, primary.title, primary.author, {
        debugLog,
        bookContext: `${primary.title} / ${primary.author || '(著者なし)'}`,
      });
      if (gb.error) {
        report.warnings.push(`Google Books エラー (${primary.title}): ${gb.error}`);
        stderrBookUnresolvable('書籍シート', [
          `理由: ${gb.error}`,
          `名前(1行化): ${primary.title}`,
          `著者: ${primary.author || '(なし)'}`,
          `試行クエリ: ${gb.queryTried.length ? gb.queryTried.join(' | ') : '(なし)'}`,
          `年シート行: ${merged.rows.map((r) => `${r.sheet}:${r.rowIndex}`).join(', ')}`,
        ]);
      } else if (!gb.hit) {
        report.warnings.push(`Google Books 0件: ${primary.title} / ${primary.author || '(著者なし)'}`);
        stderrBookUnresolvable('書籍シート', [
          `理由: Google Books APIは成功したが該当ボリューム0件`,
          `名前(1行化): ${primary.title}`,
          `著者: ${primary.author || '(なし)'}`,
          `試行クエリ: ${gb.queryTried.length ? gb.queryTried.join(' | ') : '(なし)'}`,
          `年シート行: ${merged.rows.map((r) => `${r.sheet}:${r.rowIndex}`).join(', ')}`,
        ]);
      }
    }

    const apiInfo = gb.hit?.info;
    const resolved = {
      title: apiInfo?.title || primary.title,
      author: apiInfo?.author || primary.author,
      isbn: apiInfo?.isbn || '',
      publisher: apiInfo?.publisher || '',
      publishedDate: apiInfo?.publishedDate || '',
      coverImageUrl: apiInfo?.coverImageUrl || '',
    };

    /** @type {object[]} */
    const memos = [];
    for (const text of kansous) {
      const created = ph || placeholderFinished(null, sheetY);
      if (!created) continue;
      memos.push({
        kind: 'kansou',
        text,
        comment: '',
        page: null,
        rating: 0,
        tags: [KANSOU_TAG],
        source: { type: 'year_sheet', rows: merged.rows.map((r) => ({ sheet: r.sheet, row: r.rowIndex })) },
        createdAt: created.toISOString(),
      });
    }

    for (const text of kikkakes) {
      const created = ph || placeholderFinished(null, sheetY);
      if (!created) continue;
      memos.push({
        kind: 'quote',
        text,
        comment: '',
        page: null,
        rating: 0,
        tags: [KIKKAKE_TAG],
        source: {
          type: 'year_sheet',
          kikkake: true,
          rows: merged.rows.map((r) => ({ sheet: r.sheet, row: r.rowIndex })),
        },
        createdAt: created.toISOString(),
      });
    }

    out.set(key, {
      key,
      spreadsheet: {
        title: primary.title,
        author: primary.author,
        finishedAtIso: maxFinished ? maxFinished.toISOString() : null,
        sheetYear: sheetY,
        sources: merged.rows.map((r) => ({ sheet: r.sheet, row: r.rowIndex })),
      },
      googleBooks: gb.hit
        ? { queryTried: gb.queryTried, top: gb.hit.info, volumeId: gb.hit.raw?.id }
        : { queryTried: gb.queryTried, top: null, message: gb.error || 'no results' },
      resolved,
      finishedAtIso: ph ? ph.toISOString() : null,
      displayTitleNorm: norm(primary.title),
      memos,
    });

    if (n % 20 === 0) process.stdout.write(`… Google Books ${n}/${grouped.size}\r`);
  }
  if (grouped.size) process.stdout.write(`\n`);
  return out;
}

/**
 * @param {Map<string, any>} booksByKey
 * @param {string} memoTitleNorm
 */
function findBookKeyForMemoTitle(booksByKey, memoTitleNorm) {
  /** @type {string | null} */
  let orphan = null;
  for (const [k, book] of booksByKey) {
    const resolvedNorm = norm(book.resolved?.title || '');
    const sheetNorm = norm(book.spreadsheet?.title || '');
    const match =
      book.displayTitleNorm === memoTitleNorm ||
      resolvedNorm === memoTitleNorm ||
      sheetNorm === memoTitleNorm;
    if (!match) continue;
    if (!k.startsWith('__orphan__')) return k;
    if (!orphan) orphan = k;
  }
  return orphan;
}

/**
 * @param {any} book
 * @param {{ memoYear: number | null }} memoMeta
 */
function memoDateForQuote(book, memoMeta) {
  const finished = book.finishedAtIso ? new Date(book.finishedAtIso) : null;
  if (finished && !Number.isNaN(finished.getTime())) return finished;
  if (memoMeta.memoYear) return new Date(Date.UTC(memoMeta.memoYear, 0, 1));
  const sy = book.spreadsheet?.sheetYear;
  if (sy) return new Date(Date.UTC(sy, 0, 1));
  return new Date();
}

/**
 * @param {import('./parseXlsx.mjs').RawYearRow[]} yearRows
 * @param {string | null} memoSheetName
 * @param {Record<string, number> | null} memoHeaderMap
 * @param {unknown[][]} memoRows
 * @param {string | null} apiKey
 * @param {{ skipOrphanMemos?: boolean, debugLog?: ((s: string) => void) | null }} [options]
 */
export async function buildImportBundle(yearRows, memoSheetName, memoHeaderMap, memoRows, apiKey, options = {}) {
  const { skipOrphanMemos = false, debugLog = null } = options;
  /** @type {{ warnings: string[], skippedMemos: string[] }} */
  const report = { warnings: [], skippedMemos: [] };
  let orphanMemoNoted = false;

  const rawGroups = groupYearRows(yearRows);
  /** @type {Map<string, ReturnType<typeof mergeYearGroup>>} */
  const mergedGroups = new Map();
  for (const [key, rows] of rawGroups) {
    mergedGroups.set(key, mergeYearGroup(rows));
  }

  if (debugLog) {
    debugLog(`\n################ 読書カード import デバッグログ ################\n`);
    debugLog(`生成: ${new Date().toISOString()}\n`);
  }

  const booksByKey = await enrichWithGoogle(apiKey, mergedGroups, report, debugLog);

  if (debugLog && memoSheetName) {
    debugLog(`\n\n######## メモシート「${memoSheetName}」rating（rate列のみ・テキスト色は不使用）########\n`);
  }

  if (!memoHeaderMap) {
    report.warnings.push('メモシート（年・名前・メモ・引用 等）が見つかりませんでした。イロイロ引用シートを確認してください。');
  } else {
    for (let i = 0; i < memoRows.length; i++) {
      const row = /** @type {unknown[]} */ (memoRows[i]);
      const parsed = parseMemoRow(row, memoHeaderMap, memoSheetName || 'memos', i + 2);
      if (parsed.skip) {
        if (parsed.reason && parsed.reason !== '書籍名（名前）が空') {
          report.skippedMemos.push(`行${i + 2}: ${parsed.reason}`);
        }
        continue;
      }

      const bookKey = findBookKeyForMemoTitle(booksByKey, parsed.bookTitleNorm);
      const excelRow = i + 2;
      const rating = parsed.memo.rating;

      if (debugLog) {
        const rateAddr =
          memoHeaderMap.rate != null
            ? XLSX.utils.encode_cell({ r: excelRow - 1, c: memoHeaderMap.rate })
            : '（rate列なし→0）';
        debugLog(
          `\n--- row ${excelRow} sheet=${memoSheetName} 名前セル生=${JSON.stringify(parsed.memoNameRaw)} 書籍名=${JSON.stringify(parsed.bookTitle)} rateセル=${rateAddr} textFromQuote=${parsed.textFromQuote} ---\n`,
        );
        if (parsed.storyTitle) debugLog(`  storyTitle(章題等)=${JSON.stringify(parsed.storyTitle)}\n`);
        if (parsed.volumeLabel) debugLog(`  volumeLabel(巻)=${JSON.stringify(parsed.volumeLabel)} google検索題=${JSON.stringify(parsed.googleSearchTitle)}\n`);
        debugLog(`text先頭60文字: ${JSON.stringify(parsed.memo.text.slice(0, 60))}\n`);
        debugLog(`rating=${rating}（rate列の数値のみ・1〜5／空・不正・列なしは0）\n`);
      }

      const quoteMemo = {
        kind: 'quote',
        text: parsed.memo.text,
        comment: parsed.memo.comment,
        page: parsed.memo.page,
        rating,
        tags: [],
        source: { type: 'memo_sheet', sheet: memoSheetName, row: excelRow },
        createdAt: null,
        ...(parsed.storyTitle ? { storyTitle: parsed.storyTitle } : {}),
        ...(parsed.volumeLabel ? { volumeLabel: parsed.volumeLabel } : {}),
      };

      if (bookKey && booksByKey.has(bookKey)) {
        const book = booksByKey.get(bookKey);
        quoteMemo.createdAt = memoDateForQuote(book, { memoYear: parsed.memoYear }).toISOString();
        book.memos.push(quoteMemo);
      } else {
        if (skipOrphanMemos) {
          report.skippedMemos.push(
            `行${i + 2}: 年シートに該当書籍なし（プレビュー用スキップ） — ${parsed.memoNameRaw}`,
          );
          stderrBookUnresolvable('メモシート（スタブ未作成）', [
            `理由: --limit 実行のため年シート外メモをスタブ化していない`,
            `イロイロ引用「名前」(生): ${parsed.memoNameRaw}`,
            `紐付け用書籍名: ${parsed.bookTitle}（norm: ${parsed.bookTitleNorm}）`,
            `行: ${memoSheetName} / ${excelRow}`,
          ]);
          continue;
        }
        stderrBookUnresolvable('メモシート（スタブ作成）', [
          `理由: 正規化後の書籍名が年シートのいずれの書籍とも一致せずスタブ化`,
          `イロイロ引用「名前」(生): ${parsed.memoNameRaw}`,
          `紐付け用書籍名: ${parsed.bookTitle}`,
          `正規化キー: ${parsed.bookTitleNorm}`,
          `行: ${memoSheetName} / ${excelRow}`,
        ]);
        quoteMemo.createdAt = memoDateForQuote(
          { finishedAtIso: null, spreadsheet: { sheetYear: parsed.memoYear } },
          { memoYear: parsed.memoYear },
        ).toISOString();
        if (!orphanMemoNoted) {
          report.warnings.push(
            'イロイロ引用のうち、年シートと書名が一致しないものはスタブ書籍（著者なし・当該メモのみ）として追加されます。',
          );
          orphanMemoNoted = true;
        }
        const orphanKey = `__orphan__${parsed.bookTitleNorm}`;
        if (!booksByKey.has(orphanKey)) {
          booksByKey.set(orphanKey, {
            key: orphanKey,
            isStub: true,
            spreadsheet: {
              title: parsed.bookTitle,
              memoNameRaw: parsed.memoNameRaw,
              googleSearchTitle: parsed.googleSearchTitle,
              author: '',
              finishedAtIso: null,
              sheetYear: parsed.memoYear,
              sources: [],
            },
            googleBooks: { queryTried: [], top: null, message: 'stub (memo only)' },
            resolved: {
              title: parsed.bookTitle,
              author: '',
              isbn: '',
              publisher: '',
              publishedDate: '',
              coverImageUrl: '',
            },
            finishedAtIso: quoteMemo.createdAt,
            displayTitleNorm: parsed.bookTitleNorm,
            memos: [],
          });
        }
        const ob = booksByKey.get(orphanKey);
        ob.spreadsheet.sources.push({ sheet: memoSheetName, row: excelRow });
        ob.memos.push(quoteMemo);
      }
    }
  }

  const books = [...booksByKey.values()];
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    books,
    report,
  };
}
