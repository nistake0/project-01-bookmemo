import { sleep, norm, collapseBookTitleForSearch } from './utils.mjs';
import { redactGoogleBooksUrl } from './debugLog.mjs';

const GB_URL = 'https://www.googleapis.com/books/v1/volumes';

/** @typedef {(s: string) => void} DebugLogFn */

/**
 * norm(書籍ベース名) → API で先に試す ISBN（検索が弱いタイトル向け）
 * ※ 折り畳み済み1行タイトルに対して baseTitleNormForIsbnHint を適用してから参照
 */
const FORCED_ISBN_BY_BASE_TITLE_NORM = new Map([
  [norm('鹿の王'), '9784041054895'],
  [norm('華氏451度'), '9784150119553'],
  [norm('記憶翻訳者'), '9784488787011'],
  [norm('博士の愛した地味な昆虫'), '9784005009169'],
]);

/**
 * 「時の子供たち」の直後に 上 / 下 が付くタイトル用 ISBN（折り畳み1行）
 * @param {string} collapsedTitle
 */
export function forcedIsbnTokiNoKodomotachi(collapsedTitle) {
  const t = String(collapsedTitle || '').trim();
  if (!t.includes('時の子供たち')) return null;
  const rest = t.slice(t.indexOf('時の子供たち') + '時の子供たち'.length).trim();
  const restCompact = rest.replace(/[\s　]+/g, '');
  if (!restCompact) return null;
  if (restCompact.startsWith('上')) return '9784801927391';
  if (restCompact.startsWith('下')) return '9784801927407';
  return null;
}

/**
 * （再読）除去後・末尾全角1桁を除いたベース題 Collapse→norm — ISBN マップ参照用
 * @param {string} t
 */
export function baseTitleNormForIsbnHint(t) {
  let s = collapseBookTitleForSearch(t)
    .trim()
    .replace(/（再読）\s*$/u, '')
    .trim();
  const FW = '０１２３４５６７８９';
  if (s.length > 0 && FW.includes(s[s.length - 1])) {
    s = s.slice(0, -1).trimEnd();
  }
  return norm(s);
}

/**
 * @param {object} volumeInfo
 */
export function volumeToBook(volumeInfo) {
  const industryIdentifiers = volumeInfo.industryIdentifiers || [];
  const isbn =
    industryIdentifiers.find((id) => id.type === 'ISBN_13')?.identifier ||
    industryIdentifiers.find((id) => id.type === 'ISBN_10')?.identifier ||
    '';

  return {
    title: volumeInfo.title || '',
    author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
    publisher: volumeInfo.publisher || '',
    publishedDate: volumeInfo.publishedDate || '',
    isbn,
    coverImageUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
    description: volumeInfo.description || '',
  };
}

/**
 * @param {string} apiKey
 * @param {string} q
 * @param {{ langRestrict?: string | null }} [opts]
 * @param {DebugLogFn | null} [debugLog]
 */
async function fetchVolumes(apiKey, q, opts = {}, debugLog) {
  const lang = opts.langRestrict === undefined ? 'ja' : opts.langRestrict;
  let url = `${GB_URL}?q=${encodeURIComponent(q)}&key=${apiKey}&maxResults=10`;
  if (lang) url += `&langRestrict=${encodeURIComponent(lang)}`;

  if (debugLog) {
    debugLog(`    [fetch] q(raw)=${JSON.stringify(q)}\n`);
    debugLog(`    [fetch] GET ${redactGoogleBooksUrl(url)}\n`);
  }

  /** @type {Record<string, string>} */
  const headers = { Accept: 'application/json' };
  const referer =
    process.env.GOOGLE_BOOKS_API_HTTP_REFERER ||
    process.env.VITE_GOOGLE_BOOKS_API_HTTP_REFERER ||
    null;
  if (referer) {
    headers.Referer = referer;
    try {
      const u = new URL(referer);
      headers.Origin = `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }

  const res = await fetch(url, { headers });
  const textBody = await res.text();
  if (!res.ok) {
    if (debugLog) {
      debugLog(`    [fetch] HTTP ${res.status} body: ${textBody.slice(0, 500)}\n`);
      if (res.status === 403 && textBody.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        debugLog(
          `    [hint] APIキーが「HTTPリファラ」制限付きのとき、CLI では Referer が空で 403 になります。対処: (1) GCPでインポート用キーを適切な制限で作成、(2) プロジェクト直下の .env.local に GOOGLE_BOOKS_API_HTTP_REFERER（または VITE_GOOGLE_BOOKS_API_HTTP_REFERER）=GCPで許可したURL（例: http://localhost:5173/）を書き、preview が process.env に読み込むこと。\n`,
        );
      }
    }
    throw new Error(`Google Books HTTP ${res.status}: ${textBody.slice(0, 200)}`);
  }

  /** @type {{ items?: any[], totalItems?: number }} */
  let data;
  try {
    data = JSON.parse(textBody);
  } catch {
    if (debugLog) debugLog(`    [fetch] JSON parse fail, body: ${textBody.slice(0, 300)}\n`);
    throw new Error('Google Books: invalid JSON');
  }

  const items = data.items || [];
  if (debugLog) {
    debugLog(
      `    [fetch] -> totalItems=${data.totalItems ?? 'n/a'} items.length=${items.length} langRestrict=${lang ?? 'none'}\n`,
    );
    const preview = items.slice(0, 6).map((item, i) => {
      const vi = item.volumeInfo || {};
      const ids = (vi.industryIdentifiers || []).map((x) => `${x.type}:${x.identifier}`).join(', ');
      return `      [${i}] title=${JSON.stringify(vi.title)} authors=${JSON.stringify(vi.authors)} ids=[${ids}]`;
    });
    if (preview.length) debugLog(`${preview.join('\n')}\n`);
  }

  return items.map((item) => ({
    raw: item,
    info: volumeToBook(item.volumeInfo || {}),
  }));
}

function normalizeAuthorCompact(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * @param {{ title: string, author: string }} info
 * @param {string} wantTitle
 * @param {string} wantAuthor
 */
function scoreCandidate(info, wantTitle, wantAuthor) {
  let score = 0;
  const wt = norm(wantTitle);
  const at = norm(info.title || '');
  if (!wt) return 0;
  if (at === wt) score += 120;
  else if (at.includes(wt) || wt.includes(at)) score += 75;
  else {
    const wa = wt.replace(/\s/g, '');
    const aa = at.replace(/\s/g, '');
    if (aa === wa) score += 110;
    else if (aa.includes(wa) || wa.includes(aa)) score += 65;
  }

  const wa = normalizeAuthorCompact(wantAuthor);
  const ia = normalizeAuthorCompact(info.author || '');
  if (wa && ia) {
    if (ia === wa) score += 80;
    else if (ia.includes(wa) || wa.includes(ia)) score += 55;
  } else if (!wantAuthor && info.author) {
    score += 5;
  }
  return score;
}

/** @param {{ raw: any, info: ReturnType<typeof volumeToBook>}[]} list */
function pickBestMatch(list, title, author) {
  if (!list.length) return null;
  let best = list[0];
  let bestScore = scoreCandidate(best.info, title, author);
  for (let i = 1; i < list.length; i++) {
    const s = scoreCandidate(list[i].info, title, author);
    if (s > bestScore) {
      bestScore = s;
      best = list[i];
    }
  }
  return best;
}

/**
 * @param {string} apiKey
 * @param {string} title
 * @param {string} author
 * @param {{ throttleMs?: number, debugLog?: DebugLogFn | null, bookContext?: string }} [opts]
 */
export async function searchBook(apiKey, title, author, opts = {}) {
  const { throttleMs = 120, debugLog = null, bookContext = '' } = opts;
  const t = collapseBookTitleForSearch(title).trim();
  const a = (author || '').trim();

  if (!apiKey) {
    return { hit: null, queryTried: [], error: 'GOOGLE_BOOKS_API_KEY が未設定です' };
  }
  if (!t) {
    return { hit: null, queryTried: [], error: 'タイトルが空です' };
  }

  if (debugLog) {
    debugLog(`\n======== Google Books: ${bookContext || t} ========\n`);
    debugLog(`  spreadsheet title=${JSON.stringify(t)} author=${JSON.stringify(a)}\n`);
  }

  /** @type {string[]} */
  const queryTried = [];

  try {
    let isbnHint = forcedIsbnTokiNoKodomotachi(t);
    let isbnHintNote = isbnHint ? '時の子供たち(上/下)' : '';
    if (!isbnHint) {
      isbnHint = FORCED_ISBN_BY_BASE_TITLE_NORM.get(baseTitleNormForIsbnHint(t)) ?? null;
      isbnHintNote = isbnHint ? `baseTitleNorm=${baseTitleNormForIsbnHint(t)}` : '';
    }
    if (isbnHint) {
      const iq = `isbn:${isbnHint}`;
      queryTried.push(iq);
      if (debugLog) {
        debugLog(`  [isbn固定] ${iq} (${isbnHintNote})\n`);
      }
      let list = await fetchVolumes(apiKey, iq, { langRestrict: null }, debugLog);
      await sleep(throttleMs);
      if (list.length) {
        const hit = list[0];
        if (debugLog) {
          debugLog(
            `  => ISBN命中 volumeId=${hit?.raw?.id} title=${JSON.stringify(hit?.info?.title)} author=${JSON.stringify(hit?.info?.author)}\n`,
          );
        }
        return { hit, queryTried, error: null };
      }
      if (debugLog) debugLog(`  => ISBN検索 0件、通常クエリへ\n`);
    }

    const tryQueries = [];
    tryQueries.push(t);
    tryQueries.push(`{${t}}`);
    tryQueries.push(`intitle:${t}`);

    if (a) {
      tryQueries.push(`intitle:${t} inauthor:${a}`);
      const aNoSpace = a.replace(/\s+/g, '');
      if (aNoSpace !== a) tryQueries.push(`intitle:${t} inauthor:${aNoSpace}`);
      const aFirst = a.split(/[\s　]+/)[0];
      if (aFirst && aFirst !== a) tryQueries.push(`intitle:${t} inauthor:${aFirst}`);
    }

    const seen = new Set();
    for (const q of tryQueries) {
      if (seen.has(q)) continue;
      seen.add(q);
      queryTried.push(q);

      if (debugLog) debugLog(`  --- try query: ${JSON.stringify(q)} ---\n`);

      let list = await fetchVolumes(apiKey, q, { langRestrict: 'ja' }, debugLog);
      await sleep(throttleMs);
      if (!list.length) {
        if (debugLog) debugLog(`    (0件) langRestrict なしで再試行\n`);
        list = await fetchVolumes(apiKey, q, { langRestrict: null }, debugLog);
        await sleep(throttleMs);
      }
      if (list.length) {
        const hit = pickBestMatch(list, t, a);
        const sc = hit ? scoreCandidate(hit.info, t, a) : 0;
        if (debugLog) {
          debugLog(
            `  => 採用 (${list.length}件中) score=${sc} volumeId=${hit?.raw?.id} title=${JSON.stringify(hit?.info?.title)} author=${JSON.stringify(hit?.info?.author)}\n`,
          );
        }
        return { hit, queryTried, error: null };
      }
      if (debugLog) debugLog(`  => このクエリでは 0 件\n`);
    }

    if (debugLog) debugLog(`  ** すべてのクエリで 0 件 **\n`);
    return { hit: null, queryTried, error: 'no results' };
  } catch (e) {
    if (debugLog) debugLog(`  !! 例外: ${e instanceof Error ? e.message : String(e)}\n`);
    return {
      hit: null,
      queryTried,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
