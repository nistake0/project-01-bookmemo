/**
 * デバッグログ用: APIキーを伏せた URL 文字列
 * @param {string} url
 */
export function redactGoogleBooksUrl(url) {
  return String(url).replace(/key=[^&]*/i, 'key=***REDACTED***');
}
