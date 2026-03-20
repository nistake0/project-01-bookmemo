/**
 * 統一ログ管理システム
 *
 * - Vite ビルド: import.meta.env.DEV / PROD で本番のデバッグ出力を抑制
 * - Jest / Node: process.env.NODE_ENV が production のとき本番扱い
 * - VITE_LOG_LEVEL: ERROR | WARN | INFO | DEBUG（省略時は本番 WARN、開発 DEBUG）
 * - VITE_DEBUG_LOGS=true: 本番ビルドでも devLog / DEBUG レベルを有効化（暫定調査用）
 */

// ログレベル定義
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * アプリ実行環境（Vite の define で埋め込んだ process.env.* と Jest の NODE_ENV を共用）
 *
 * 重要: ブラウザには `process` が無い。`vite.config.js` の define が
 * `process.env.NODE_ENV` などをビルド時に文字列リテラルへ置換するため、
 * 「process.env オブジェクトから拾う」書き方（pe.NODE_ENV）だけだと置換されず、
 * 常に development 扱いになり devLog が本番でも出続ける。
 *
 * ※ import.meta は使わない（Jest 実行時にパースエラーになるため）
 * @returns {{ DEV: boolean, PROD: boolean, MODE: string, VITE_LOG_LEVEL?: string, VITE_DEBUG_LOGS?: string }}
 */
export function getAppEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const logLevelRaw = process.env.VITE_LOG_LEVEL;
  const debugLogsRaw = process.env.VITE_DEBUG_LOGS;
  return {
    DEV: !isProd,
    PROD: isProd,
    MODE: nodeEnv,
    VITE_LOG_LEVEL:
      logLevelRaw !== undefined && logLevelRaw !== null && String(logLevelRaw).length > 0
        ? String(logLevelRaw)
        : undefined,
    VITE_DEBUG_LOGS:
      debugLogsRaw !== undefined && debugLogsRaw !== null && String(debugLogsRaw).length > 0
        ? String(debugLogsRaw)
        : undefined,
  };
}

/** 本番ビルドでも console デバッグを出すか（一時調査用。通常は未設定） */
export function isForcedDebugLogging() {
  return getAppEnv().VITE_DEBUG_LOGS === 'true';
}

/**
 * 開発用の console.log 相当。本番ビルドでは無出力（VITE_DEBUG_LOGS=true のときのみ出力）
 * @param {...unknown} args - console.log にそのまま渡す
 */
export function devLog(...args) {
  const env = getAppEnv();
  if (env.PROD && !isForcedDebugLogging()) {
    return;
  }
  console.log(...args);
}

const resolveMaxLogLevel = () => {
  const env = getAppEnv();
  const levelStr = env.VITE_LOG_LEVEL;
  if (levelStr && LOG_LEVELS[String(levelStr).toUpperCase()] !== undefined) {
    return LOG_LEVELS[String(levelStr).toUpperCase()];
  }
  if (env.PROD && !isForcedDebugLogging()) {
    return LOG_LEVELS.WARN;
  }
  return LOG_LEVELS.DEBUG;
};

const currentLogLevel = resolveMaxLogLevel();

// ログカテゴリ定義
export const LOG_CATEGORIES = {
  AUTH: '🔐 AUTH',
  BOOK: '📖 BOOK',
  MEMO: '📝 MEMO',
  STATUS: '📊 STATUS',
  TAG: '🏷️ TAG',
  PWA: '📱 PWA',
  OCR: '📷 OCR',
  FIREBASE: '🔥 FIREBASE',
  ERROR: '❌ ERROR',
  DEBUG: '🐛 DEBUG',
};

/**
 * ログフォーマッター
 * @param {number} level - ログレベル
 * @param {string} category - ログカテゴリ
 * @param {string} message - メッセージ
 * @param {any} data - 追加データ
 * @returns {string} フォーマットされたログメッセージ
 */
const formatLog = (level, category, message, data = null) => {
  const timestamp = new Date().toISOString();
  const levelSymbol =
    {
      [LOG_LEVELS.ERROR]: '❌',
      [LOG_LEVELS.WARN]: '⚠️',
      [LOG_LEVELS.INFO]: 'ℹ️',
      [LOG_LEVELS.DEBUG]: '🐛',
    }[level] || '📝';

  let logMessage = `${levelSymbol} ${category} [${timestamp}] ${message}`;

  if (data !== null && data !== undefined) {
    logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
  }

  return logMessage;
};

/**
 * ログ出力関数
 * @param {number} level - ログレベル
 * @param {string} category - ログカテゴリ
 * @param {string} message - メッセージ
 * @param {any} data - 追加データ
 */
const log = (level, category, message, data = null) => {
  if (level > currentLogLevel) {
    return;
  }

  const formattedMessage = formatLog(level, category, message, data);

  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage);
      break;
    case LOG_LEVELS.INFO:
      console.info(formattedMessage);
      break;
    case LOG_LEVELS.DEBUG:
      console.log(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
};

/**
 * 統一ログAPI
 */
export const logger = {
  error: (category, message, data) => log(LOG_LEVELS.ERROR, category, message, data),
  warn: (category, message, data) => log(LOG_LEVELS.WARN, category, message, data),
  info: (category, message, data) => log(LOG_LEVELS.INFO, category, message, data),
  debug: (category, message, data) => log(LOG_LEVELS.DEBUG, category, message, data),

  auth: {
    error: (message, data) => logger.error(LOG_CATEGORIES.AUTH, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.AUTH, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.AUTH, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.AUTH, message, data),
  },

  book: {
    error: (message, data) => logger.error(LOG_CATEGORIES.BOOK, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.BOOK, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.BOOK, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.BOOK, message, data),
  },

  memo: {
    error: (message, data) => logger.error(LOG_CATEGORIES.MEMO, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.MEMO, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.MEMO, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.MEMO, message, data),
  },

  status: {
    error: (message, data) => logger.error(LOG_CATEGORIES.STATUS, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.STATUS, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.STATUS, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.STATUS, message, data),
  },

  firebase: {
    error: (message, data) => logger.error(LOG_CATEGORIES.FIREBASE, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.FIREBASE, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.FIREBASE, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.FIREBASE, message, data),
  },
};

export default logger;
