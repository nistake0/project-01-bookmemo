/**
 * テスト用テーマ
 * createThemeFromPreset に一本化するため、appTheme.js の代替として使用
 */
import { createThemeFromPreset } from './createThemeFromPreset';
import { buildPath } from '../config/paths';
import { DEFAULT_THEME_PRESET_ID } from '../constants/userSettings';

export const testTheme = createThemeFromPreset(DEFAULT_THEME_PRESET_ID, buildPath);
