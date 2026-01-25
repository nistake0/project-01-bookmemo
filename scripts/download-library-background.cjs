/**
 * design-image-candidates #4: ウェルズ大聖堂図書館 (Annie Spratt)
 * https://unsplash.com/photos/GWCvnsMtiBg
 * 商用利用可・クレジット不要
 */
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const URL = 'https://unsplash.com/photos/GWCvnsMtiBg/download?force=true&w=1920';
const out = path.join(__dirname, '..', 'public', 'library-background.jpg');

fetch(URL, { redirect: 'follow' })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.buffer();
  })
  .then((buf) => fs.promises.writeFile(out, buf))
  .then(() => console.log('Saved:', out))
  .catch((e) => {
    console.error('Download failed:', e.message);
    process.exit(1);
  });
