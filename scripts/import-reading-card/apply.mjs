#!/usr/bin/env node
/**
 * import-bundle.json を Firestore に書き込む。
 *
 * 用法:
 *   node scripts/import-reading-card/apply.mjs --bundle import-output/import-bundle.json --uid <Firebase Auth UID>
 *
 * サービスアカウント:
 *   プロジェクトルートの serviceAccountKey.json（.gitignore）を使用。
 *
 * オプション:
 *   --dry-run  Firestore には書かず、件数だけ表示
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

function parseArgs(argv) {
  const out = { bundle: null, uid: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle' && argv[i + 1]) out.bundle = argv[++i];
    else if (a === '--uid' && argv[i + 1]) out.uid = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function loadServiceAccount() {
  const p = path.join(process.cwd(), 'serviceAccountKey.json');
  if (!fs.existsSync(p)) {
    throw new Error(`serviceAccountKey.json が見つかりません: ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const BATCH_MAX = 400;

async function applyBundle(bundle, uid, dryRun) {
  const books = bundle.books || [];
  let bookCreates = 0;
  let memoCreates = 0;

  if (dryRun) {
    for (const b of books) {
      bookCreates += 1;
      memoCreates += b.memos?.length || 0;
    }
    console.log(`dry-run: 書籍 ${bookCreates} 件, メモ ${memoCreates} 件`);
    return;
  }

  const cred = loadServiceAccount();
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;

  /** @type {FirebaseFirestore.WriteBatch} */
  let batch = db.batch();
  let batchOps = 0;

  const flush = async () => {
    if (batchOps === 0) return;
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  /** @param {() => void} fn */
  const enqueue = async (fn) => {
    fn(batch);
    batchOps += 1;
    if (batchOps >= BATCH_MAX) await flush();
  };

  for (const book of books) {
    const bookRef = db.collection('books').doc();
    const finishedTs = book.finishedAtIso
      ? admin.firestore.Timestamp.fromDate(new Date(book.finishedAtIso))
      : null;

    await enqueue((b) =>
      b.set(bookRef, {
        userId: uid,
        isbn: book.resolved?.isbn || '',
        title: book.resolved?.title || '',
        author: book.resolved?.author || '',
        publisher: book.resolved?.publisher || '',
        publishedDate: book.resolved?.publishedDate || '',
        coverImageUrl: book.resolved?.coverImageUrl || '',
        tags: [],
        status: 'finished',
        acquisitionType: 'unknown',
        ...(finishedTs ? { finishedAt: finishedTs } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );

    const histRef = bookRef.collection('statusHistory').doc();
    await enqueue((b) =>
      b.set(histRef, {
        status: 'finished',
        previousStatus: null,
        changedAt: finishedTs || FieldValue.serverTimestamp(),
        changedBy: uid,
        notes: '読書カードインポート',
        createdAt: FieldValue.serverTimestamp(),
      }),
    );

    for (const m of book.memos || []) {
      const memoRef = bookRef.collection('memos').doc();
      const created = m.createdAt
        ? admin.firestore.Timestamp.fromDate(new Date(m.createdAt))
        : FieldValue.serverTimestamp();
      await enqueue((b) => {
        /** @type {Record<string, unknown>} */
        const doc = {
          userId: uid,
          text: m.text || '',
          comment: m.comment || '',
          page: m.page ?? null,
          tags: m.tags || [],
          rating: m.rating ?? 0,
          createdAt: created,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (m.storyTitle) doc.storyTitle = m.storyTitle;
        if (m.volumeLabel) doc.volumeLabel = m.volumeLabel;
        return b.set(memoRef, doc);
      });
    }

    await flush();
    bookCreates += 1;
    memoCreates += book.memos?.length || 0;
    console.log(`書籍作成: ${book.resolved?.title?.slice(0, 40)}… メモ ${book.memos?.length || 0} 件`);
  }

  await flush();

  console.log(`完了: 書籍 ${bookCreates} 件, メモ ${memoCreates} 件`);
}

async function main() {
  const { bundle: bundlePath, uid, dryRun } = parseArgs(process.argv);
  if (!bundlePath || !uid) {
    console.error(
      '例: node scripts/import-reading-card/apply.mjs --bundle import-output/import-bundle.json --uid YOUR_FIREBASE_UID',
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(bundlePath), 'utf8');
  const bundle = JSON.parse(raw);
  await applyBundle(bundle, uid, dryRun);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
