import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createThemeFromPreset } from '../theme/createThemeFromPreset';
import { getThemePresets } from '../theme/themePresets';
import { useUserSettings } from '../hooks/useUserSettings';
import { buildPath } from '../config/paths';
import { DEFAULT_THEME_PRESET_ID, DEFAULT_THEME_MODE, DEFAULT_BACKGROUND_PRESET_ID } from '../constants/userSettings';

/**
 * ユーザー設定に応じたテーマを提供するラッパー
 * useUserSettings から themePresetId, themeMode を取得し、ThemeProvider に渡す
 */
export default function ThemeProviderWithUserSettings({ children }) {
  const { settings, loading } = useUserSettings();

  const theme = useMemo(() => {
    const presetId = loading ? DEFAULT_THEME_PRESET_ID : (settings.preferences?.themePresetId || DEFAULT_THEME_PRESET_ID);
    const mode = loading ? DEFAULT_THEME_MODE : (settings.preferences?.themeMode || DEFAULT_THEME_MODE);
    const themePresets = getThemePresets(buildPath);
    const preset = themePresets[presetId] || themePresets[DEFAULT_THEME_PRESET_ID];
    const effectiveBgPresetId = loading
      ? DEFAULT_BACKGROUND_PRESET_ID
      : (settings.preferences?.backgroundPresetId ?? preset?.defaultBackgroundPresetId ?? DEFAULT_BACKGROUND_PRESET_ID);
    const backgroundColor = settings.preferences?.backgroundColor;
    return createThemeFromPreset(presetId, buildPath, mode, {
      backgroundPresetId: effectiveBgPresetId,
      backgroundColor,
    });
  }, [settings.preferences?.themePresetId, settings.preferences?.themeMode, settings.preferences?.backgroundPresetId, settings.preferences?.backgroundColor, loading]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
