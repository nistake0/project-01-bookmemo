import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createThemeFromPreset } from '../theme/createThemeFromPreset';
import { useUserSettings } from '../hooks/useUserSettings';
import { buildPath } from '../config/paths';
import { DEFAULT_THEME_PRESET_ID } from '../constants/userSettings';

/**
 * ユーザー設定に応じたテーマを提供するラッパー
 * useUserSettings から themePresetId を取得し、ThemeProvider に渡す
 */
export default function ThemeProviderWithUserSettings({ children }) {
  const { settings, loading } = useUserSettings();

  const theme = useMemo(() => {
    const presetId = loading ? DEFAULT_THEME_PRESET_ID : (settings.preferences?.themePresetId || DEFAULT_THEME_PRESET_ID);
    return createThemeFromPreset(presetId, buildPath);
  }, [settings.preferences?.themePresetId, loading]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
