#!/usr/bin/env node
/**
 * 読書カード.xlsx からインポート用バンドルとレポートを生成する。
 *
 * 用法:
 *   node scripts/import-reading-card/preview.mjs --input "path/to/読書カード.xlsx" [--out dir]
 *
 * 環境変数:
 *   GOOGLE_BOOKS_API_KEY または VITE_GOOGLE_BOOKS_API_KEY … 省略時は書誌メタは表のタイトル・著者のみ
 *   GOOGLE_BOOKS_API_HTTP_REFERER または VITE_GOOGLE_BOOKS_API_HTTP_REFERER … リファラ制限キー用（.env.local に書くと preview が読み込む）
 *
 * オプション:
 *   --skip-google   Google Books を呼ばない（構造確認用）
 *   --limit N       年シートから読み込む最大行数（デバッグ用）
 *   --verbose       import-debug.log を out ディレクトリに出力（詳細ログ）
 *   --debug-log P   詳細ログの出力パス（--verbose より優先）
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readWorkbookFromBuffer, extractRaw } from './parseXlsx.mjs';
import { buildImportBundle } from './buildBundle.mjs';
import { loadImportEnvFiles } from './loadEnv.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');
loadImportEnvFiles(projectRoot);

function parseArgs(argv) {
  const out = { input: null, outDir: null, skipGoogle: false, limit: null, verbose: false, debugLog: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' && argv[i + 1]) out.input = argv[++i];
    else if (a === '--out' && argv[i + 1]) out.outDir = argv[++i];
    else if (a === '--skip-google') out.skipGoogle = true;
    else if (a === '--limit' && argv[i + 1]) out.limit = parseInt(argv[++i], 10);
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--debug-log' && argv[i + 1]) out.debugLog = argv[++i];
  }
  return out;
}

function getApiKey() {
  return (
    process.env.GOOGLE_BOOKS_API_KEY ||
    process.env.VITE_GOOGLE_BOOKS_API_KEY ||
    null
  );
}

function writeReport(outPath, bundle, meta) {
  const lines = [
    '# 読書カード import プレビューレポート',
    '',
    `- 生成: ${bundle.generatedAt}`,
    `- 入力: ${meta.sourceFile}`,
    `- Google Books: ${meta.usedGoogle ? '使用' : '未使用（--skip-google または API キーなし）'}`,
    '',
    `## 書籍（バンドル内）: ${bundle.books.length} 件`,
    `## メモ総数: ${bundle.books.reduce((n, b) => n + (b.memos?.length || 0), 0)} 件`,
    '',
    '## 警告',
    ...(bundle.report.warnings.length ? bundle.report.warnings.map((w) => `- ${w}`) : ['- （なし）']),
    '',
    '## スキップしたメモ行',
    ...(bundle.report.skippedMemos?.length
      ? bundle.report.skippedMemos.slice(0, 200).map((w) => `- ${w}`)
      : ['- （なし）']),
    '',
  ];
  if (bundle.report.skippedMemos?.length > 200) {
    lines.push(`… 他 ${bundle.report.skippedMemos.length - 200} 件`, '');
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

async function main() {
  const { input, outDir, skipGoogle, limit, verbose, debugLog: debugLogArg } = parseArgs(process.argv);
  if (!input) {
    console.error(
      '例: node scripts/import-reading-card/preview.mjs --input "D:/work/bookmemoproject/読書カード.xlsx" --out ./import-output',
    );
    process.exit(1);
  }

  const absIn = path.resolve(input);
  const destDir = outDir ? path.resolve(outDir) : path.join(__dirname, '../../import-output');
  fs.mkdirSync(destDir, { recursive: true });

  const apiKey = skipGoogle ? null : getApiKey();
  if (!skipGoogle && !apiKey) {
    console.warn('警告: GOOGLE_BOOKS_API_KEY 未設定のため Google Books をスキップします。');
  } else if (!skipGoogle && apiKey) {
    const ref =
      process.env.GOOGLE_BOOKS_API_HTTP_REFERER ||
      process.env.VITE_GOOGLE_BOOKS_API_HTTP_REFERER ||
      '';
    if (!ref) {
      console.warn(
        'ヒント: Google Books が 403 (referer empty) になる場合、.env.local に GOOGLE_BOOKS_API_HTTP_REFERER=http://localhost:5173/ などを追加してください（APIキー側のリファラ制限と一致させる）。',
      );
    }
  }

  console.log('読み込み:', absIn);
  const buf = fs.readFileSync(absIn);
  const wb = readWorkbookFromBuffer(buf);
  let { yearRows, memoSheetName, memoHeaderMap, memoRows } = extractRaw(wb);

  if (Number.isFinite(limit) && limit > 0) {
    yearRows = yearRows.slice(0, limit);
    console.log(`--limit: 年シート行を ${limit} 件に制限`);
  }

  console.log(`年シート行: ${yearRows.length}, メモシート: ${memoSheetName || 'なし'} (${memoRows.length} 行)`);

  const debugLogPath = debugLogArg
    ? path.resolve(debugLogArg)
    : verbose
      ? path.join(destDir, 'import-debug.log')
      : null;
  /** @type {import('fs').WriteStream | null} */
  let logStream = null;
  /** @param {string} s */
  const debugLog = (s) => {
    if (logStream) logStream.write(s);
  };
  if (debugLogPath) {
    logStream = fs.createWriteStream(debugLogPath, { flags: 'w' });
    debugLog(`# import debug log\n# ${new Date().toISOString()}\n# input: ${absIn}\n\n`);
  }

  const bundle = await buildImportBundle(yearRows, memoSheetName, memoHeaderMap, memoRows, apiKey, {
    skipOrphanMemos: Number.isFinite(limit) && limit > 0,
    debugLog: logStream ? debugLog : null,
  });
  bundle.sourceFile = absIn;

  const jsonPath = path.join(destDir, 'import-bundle.json');
  const reportPath = path.join(destDir, 'import-report.md');
  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2), 'utf8');
  writeReport(reportPath, bundle, {
    sourceFile: absIn,
    usedGoogle: !!(apiKey && !skipGoogle),
  });

  console.log('書き出し:', jsonPath);
  console.log('レポート:', reportPath);
  if (logStream) {
    await new Promise((resolve, reject) => {
      logStream.end(() => resolve(null));
      logStream.on('error', reject);
    });
    console.log('デバッグログ:', debugLogPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
