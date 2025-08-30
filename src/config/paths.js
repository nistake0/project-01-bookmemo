/**
 * 環境に応じたパス設定を管理
 */

// 環境判定
const isProduction = () => {
  // Node.js環境の場合
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  // ブラウザ環境の場合
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }
  return false;
};

// ベースパスの取得
export const getBasePath = () => {
  return isProduction() ? '/project-01-bookmemo' : '';
};

// パス構築ヘルパー
export const buildPath = (path) => {
  const basePath = getBasePath();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

// よく使用されるパス
export const PATHS = {
  // 静的ファイル
  MANIFEST: () => buildPath('/manifest.webmanifest'),
  SW_JS: () => buildPath('/sw.js'),
  VITE_SVG: () => buildPath('/vite.svg'),
  PAPER_TEXTURE: () => buildPath('/paper-texture.jpg'),
  
  // アイコン
  ICON_192: () => buildPath('/icons/icon-192x192.png'),
  ICON_512: () => buildPath('/icons/icon-512x512.png'),
  APPLE_TOUCH_ICON: () => buildPath('/icons/apple-touch-icon.png'),
  APPLE_TOUCH_ICON_512: () => buildPath('/icons/apple-touch-icon-512x512.png'),
  
  // アプリルート
  ROOT: () => buildPath('/'),
  ADD: () => buildPath('/add'),
  SEARCH: () => buildPath('/search'),
  
  // 環境情報
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: () => !isProduction(),
};
