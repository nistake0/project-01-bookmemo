#!/usr/bin/env node
/**
 * import-bundle.json のスタブ書籍に対し Google Books API を再検索し、ヒットしたら
 * resolved / googleBooks を上書きする。apply.mjs で書き込まれる書誌が更新される。
 *
 * **key**（例: __orphan__…）は変更しない。メモ配列もそのまま。
 *
 * 用法:
 *   node scripts/import-reading-card/enrichStubBooks.mjs --bundle import-output/import-bundle.json
 *   [--out import-output/import-bundle.enriched.json]   省略時は --bundle を上書き
 *
 * 環境変数: GOOGLE_BOOKS_API_KEY（または VITE_*）、Referer 制限時は GOOGLE_BOOKS_API_HTTP_REFERER 等（preview と同様）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchBook } from './googleBooks.mjs';
import { loadImportEnvFiles } from './loadEnv.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadImportEnvFiles(path.join(__dirname, '../..'));

function parseArgs(argv) {
  const out = { bundle: null, outPath: null, verbose: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle' && argv[i + 1]) out.bundle = argv[++i];
    else if (a === '--out' && argv[i + 1]) out.outPath = argv[++i];
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function getApiKey() {
  return process.env.GOOGLE_BOOKS_API_KEY || process.env.VITE_GOOGLE_BOOKS_API_KEY || null;
}

/** @param {any} book */
function isStubBook(book) {
  if (!book) return false;
  if (book.isStub === true) return true;
  if (typeof book.key === 'string' && book.key.startsWith('__orphan__')) return true;
  return false;
}

async function main() {
  const { bundle: bundlePath, outPath, verbose, dryRun } = parseArgs(process.argv);
  if (!bundlePath) {
    console.error(
      '例: node scripts/import-reading-card/enrichStubBooks.mjs --bundle import-output/import-bundle.json [--out out.json]',
    );
    process.exit(1);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('GOOGLE_BOOKS_API_KEY または VITE_GOOGLE_BOOKS_API_KEY が必要です。');
    process.exit(1);
  }

  const abs = path.resolve(bundlePath);
  const bundle = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const books = bundle.books || [];
  /** @type {any[]} */
  const stubs = books.filter(isStubBook);

  if (dryRun) {
    console.log(
      `dry-run: スタブ候補 ${stubs.length} 件（API は呼びません。実行時は --dry-run を外してください）`,
    );
    process.exit(0);
  }

  const debugLog = verbose ? (s) => process.stdout.write(s) : null;
  let enriched = 0;
  let noHit = 0;
  let apiErrors = 0;
  let emptyTitle = 0;

  for (let i = 0; i < stubs.length; i++) {
    const book = stubs[i];
    const title = (
      book.spreadsheet?.googleSearchTitle ||
      book.spreadsheet?.title ||
      book.resolved?.title ||
      ''
    ).trim();
    const author = (book.spreadsheet?.author || book.resolved?.author || '').trim();
    if (!title) {
      emptyTitle += 1;
      continue;
    }

    if (verbose) process.stdout.write(`\n[${i + 1}/${stubs.length}] ${book.key}\n`);

    const gb = await searchBook(apiKey, title, author, {
      debugLog,
      bookContext: `${title} / ${author || '(著者なし)'}`,
    });

    if (gb.error) {
      apiErrors += 1;
      console.error(
        `[import] 書籍を確定できません — enrich-stubs (API)\n  key=${book.key}\n  検索題: ${title}\n  理由: ${gb.error}\n  試行: ${gb.queryTried?.length ? gb.queryTried.join(' | ') : '(なし)'}`,
      );
      continue;
    }
    if (!gb.hit) {
      noHit += 1;
      console.error(
        `[import] 書籍を確定できません — enrich-stubs (0件)\n  key=${book.key}\n  検索題: ${title}\n  試行: ${gb.queryTried?.length ? gb.queryTried.join(' | ') : '(なし)'}`,
      );
      continue;
    }

    const apiInfo = gb.hit.info;
    book.resolved = {
      title: apiInfo.title || title,
      author: apiInfo.author || author,
      isbn: apiInfo.isbn || '',
      publisher: apiInfo.publisher || '',
      publishedDate: apiInfo.publishedDate || '',
      coverImageUrl: apiInfo.coverImageUrl || '',
    };
    book.googleBooks = {
      queryTried: gb.queryTried,
      top: gb.hit.info,
      volumeId: gb.hit.raw?.id,
    };
    book.isStub = false;
    enriched += 1;
    if (!verbose) {
      console.log(
        `OK: ${title.slice(0, 36)}${title.length > 36 ? '…' : ''} → ${book.resolved.title.slice(0, 44)}`,
      );
    }
  }

  const dest = outPath ? path.resolve(outPath) : abs;
  fs.writeFileSync(dest, JSON.stringify(bundle, null, 2), 'utf8');

  console.log(
    `\nスタブ候補: ${stubs.length} 件 / 補完成功: ${enriched} / 0件: ${noHit} / APIエラー: ${apiErrors} / タイトル空: ${emptyTitle}`,
  );
  console.log(`出力: ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
