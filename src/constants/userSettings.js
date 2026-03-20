/**
 * ユーザー設定の定数定義
 * Firestore users/{uid} の profile / preferences と一致（詳細は ARCHITECTURE.md）
 */

/** デフォルトのテーマプリセットID（タスクBで使用） */
export const DEFAULT_THEME_PRESET_ID = 'library-classic';

/** テーマモード: 'normal' = 明るい背景, 'dark' = 暗い背景 */
export const THEME_MODES = ['normal', 'dark'];

/** デフォルトのテーマモード */
export const DEFAULT_THEME_MODE = 'normal';

/** デフォルトの背景プリセットID（doc/design-background-customization-20250320.md） */
export const DEFAULT_BACKGROUND_PRESET_ID = 'library-patterned';

/** ユーザー設定のデフォルト値 */
export const DEFAULT_USER_SETTINGS = {
  profile: {
    displayName: '',
    avatarUrl: '',
  },
  preferences: {
    themePresetId: DEFAULT_THEME_PRESET_ID,
    themeMode: DEFAULT_THEME_MODE,
    backgroundPresetId: DEFAULT_BACKGROUND_PRESET_ID,
    backgroundColor: undefined,
  },
};
