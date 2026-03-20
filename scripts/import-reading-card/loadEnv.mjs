import fs from 'fs';
import path from 'path';

/**
 * Vite と同様にプロジェクト直下の .env を読み、未設定の process.env のみ埋める。
 * import スクリプトは Vite を経由しないため、--input 実行でもキー・Referer を効かせる。
 *
 * 優先: .env.local → .env（.env.production は CLI 開発時と競合しやすいので含めない）
 *
 * @param {string} projectRoot package.json があるディレクトリ
 */
export function loadImportEnvFiles(projectRoot) {
  for (const name of ['.env.local', '.env']) {
    const p = path.join(projectRoot, name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}
