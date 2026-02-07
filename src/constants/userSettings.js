/**
 * ユーザー設定の定数定義
 * doc/discussion-user-profile-and-theme-tasks.md のデータ構造に準拠
 */

/** デフォルトのテーマプリセットID（タスクBで使用） */
export const DEFAULT_THEME_PRESET_ID = 'library-classic';

/** テーマモード: 'normal' = 明るい背景, 'dark' = 暗い背景 */
export const THEME_MODES = ['normal', 'dark'];

/** デフォルトのテーマモード */
export const DEFAULT_THEME_MODE = 'normal';

/** ユーザー設定のデフォルト値 */
export const DEFAULT_USER_SETTINGS = {
  profile: {
    displayName: '',
    avatarUrl: '',
  },
  preferences: {
    themePresetId: DEFAULT_THEME_PRESET_ID,
    themeMode: DEFAULT_THEME_MODE,
  },
};
