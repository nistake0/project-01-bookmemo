/**
 * doc/design-image-candidates.md の候補 #1-#10 を Unsplash からダウンロード
 * 商用利用可・クレジット不要
 */
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'backgrounds');

/** #1-#10: { id, name, unsplashPhotoId } */
const CANDIDATES = [
  { id: 'bg-01', name: 'NYPL・ローズ閲覧室', unsplashPhotoId: 'YTJCRRNi-bM' },
  { id: 'bg-02', name: '茶色の木製書棚', unsplashPhotoId: 'Zqmia99hgF8' },
  { id: 'bg-03', name: 'ストックホルム市立図書館', unsplashPhotoId: '2JIvboGLeho' },
  { id: 'bg-04', name: 'ウェルズ大聖堂図書館', unsplashPhotoId: 'GWCvnsMtiBg' },
  { id: 'bg-05', name: 'ノルウェー国立図書館', unsplashPhotoId: '5-qP-0ea_uo' },
  { id: 'bg-06', name: 'ヴィンテージ図書館', unsplashPhotoId: 'aT88kga0g_M' },
  { id: 'bg-07', name: '古い図書館室内', unsplashPhotoId: '3S3ovhAuWQA' },
  { id: 'bg-08', name: 'ヴィンテージ図書館', unsplashPhotoId: 'lIWF2uHxs0Q' },
  { id: 'bg-09', name: 'はしご付き書棚', unsplashPhotoId: '8muUTAmcWU4' },
  { id: 'bg-10', name: 'ノルウェー国立図書館', unsplashPhotoId: 'LSCF7g4ANMs' },
];

async function downloadOne(candidate) {
  const url = `https://unsplash.com/photos/${candidate.unsplashPhotoId}/download?force=true&w=1920`;
  const outPath = path.join(OUT_DIR, `${candidate.id}.jpg`);

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${candidate.id}`);
  const buf = await res.buffer();
  await fs.promises.writeFile(outPath, buf);
  console.log(`Saved: ${candidate.id}.jpg (${candidate.name})`);
}

async function main() {
  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  for (const c of CANDIDATES) {
    try {
      await downloadOne(c);
    } catch (e) {
      console.error(`Failed ${c.id}:`, e.message);
      process.exitCode = 1;
    }
  }
}

main();
