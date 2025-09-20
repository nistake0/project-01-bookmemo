/**
 * 統一ログ管理システム
 * 
 * 機能:
 * - 環境別ログレベル制御
 * - 統一フォーマット
 * - パフォーマンス最適化
 * - カテゴリ別ログ管理
 */

// ログレベル定義
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 現在のログレベル（環境変数から取得、デフォルトはINFO）
const getCurrentLogLevel = () => {
  // 環境変数の取得
  let envLevel;
  let isProd = false;
  
  // ブラウザ環境での環境変数取得（Viteの環境変数）
  try {
    // ブラウザ環境では window.__VITE_ENV__ やその他の方法で環境変数を取得
    if (typeof window !== 'undefined') {
      // Viteの環境変数はビルド時に置換されるため、直接参照
      const viteEnv = window.__VITE_ENV__ || {};
      envLevel = viteEnv.VITE_LOG_LEVEL;
      isProd = viteEnv.PROD;
    }
  } catch (e) {
    // 環境変数取得に失敗した場合はスキップ
  }
  
  // Node.js環境でのprocess.envの使用（テスト環境等）
  if (typeof process !== 'undefined' && process.env) {
    if (!envLevel) {
      envLevel = process.env.VITE_LOG_LEVEL;
    }
    if (!isProd) {
      isProd = process.env.NODE_ENV === 'production';
    }
  }
  
  if (envLevel && LOG_LEVELS[envLevel.toUpperCase()] !== undefined) {
    return LOG_LEVELS[envLevel.toUpperCase()];
  }
  
  // デフォルト: 開発環境ではDEBUG、本番環境ではWARN
  // ブラウザ環境では開発モードと仮定
  return isProd ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
};

const currentLogLevel = getCurrentLogLevel();

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
  DEBUG: '🐛 DEBUG'
};

/**
 * ログフォーマッター
 * @param {string} level - ログレベル
 * @param {string} category - ログカテゴリ
 * @param {string} message - メッセージ
 * @param {any} data - 追加データ
 * @returns {string} フォーマットされたログメッセージ
 */
const formatLog = (level, category, message, data = null) => {
  const timestamp = new Date().toISOString();
  const levelSymbol = {
    [LOG_LEVELS.ERROR]: '❌',
    [LOG_LEVELS.WARN]: '⚠️',
    [LOG_LEVELS.INFO]: 'ℹ️',
    [LOG_LEVELS.DEBUG]: '🐛'
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
  // ログレベルチェック
  if (level > currentLogLevel) {
    return;
  }

  const formattedMessage = formatLog(level, category, message, data);
  
  // レベル別出力先選択
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
  // エラーログ
  error: (category, message, data) => log(LOG_LEVELS.ERROR, category, message, data),
  
  // 警告ログ
  warn: (category, message, data) => log(LOG_LEVELS.WARN, category, message, data),
  
  // 情報ログ
  info: (category, message, data) => log(LOG_LEVELS.INFO, category, message, data),
  
  // デバッグログ
  debug: (category, message, data) => log(LOG_LEVELS.DEBUG, category, message, data),
  
  // カテゴリ別ヘルパー関数
  auth: {
    error: (message, data) => logger.error(LOG_CATEGORIES.AUTH, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.AUTH, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.AUTH, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.AUTH, message, data)
  },
  
  book: {
    error: (message, data) => logger.error(LOG_CATEGORIES.BOOK, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.BOOK, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.BOOK, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.BOOK, message, data)
  },
  
  memo: {
    error: (message, data) => logger.error(LOG_CATEGORIES.MEMO, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.MEMO, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.MEMO, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.MEMO, message, data)
  },
  
  status: {
    error: (message, data) => logger.error(LOG_CATEGORIES.STATUS, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.STATUS, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.STATUS, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.STATUS, message, data)
  },
  
  firebase: {
    error: (message, data) => logger.error(LOG_CATEGORIES.FIREBASE, message, data),
    warn: (message, data) => logger.warn(LOG_CATEGORIES.FIREBASE, message, data),
    info: (message, data) => logger.info(LOG_CATEGORIES.FIREBASE, message, data),
    debug: (message, data) => logger.debug(LOG_CATEGORIES.FIREBASE, message, data)
  }
};

export default logger;
