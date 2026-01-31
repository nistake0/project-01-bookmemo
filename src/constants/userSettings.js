/**
 * ユーザー設定の定数定義
 * doc/discussion-user-profile-and-theme-tasks.md のデータ構造に準拠
 */

/** デフォルトのテーマプリセットID（タスクBで使用） */
export const DEFAULT_THEME_PRESET_ID = 'library-classic';


/** ユーザー設定のデフォルト値 */
export const DEFAULT_USER_SETTINGS = {
  profile: {
    displayName: '',
    avatarUrl: '',
  },
  preferences: {
    themePresetId: DEFAULT_THEME_PRESET_ID,
  },
};
