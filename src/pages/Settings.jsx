import { Typography, Box, Card, CardContent, Button, Divider, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../auth/AuthProvider';
import { getThemePresets } from '../theme/themePresets';
import { buildPath } from '../config/paths';

/**
 * 設定画面
 * タスクA: ユーザー設定の基盤
 * タスクB: テーマ選択UI
 * タスクC: プロフィール編集（未実装）
 */
export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, loading, error, updatePreferences } = useUserSettings();
  const themePresets = getThemePresets(buildPath);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('ログアウトに失敗しました:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mb: 10 }}>
      <PageHeader
        title="設定"
        subtitle="アカウントとアプリの設定"
      />

      <Box sx={{ p: 2 }}>
        {loading && (
          <LoadingIndicator
            variant="inline"
            message="読み込み中..."
            data-testid="settings-loading"
          />
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }} data-testid="settings-error">
            {error}
          </Typography>
        )}

        {!loading && (
          <>
            {/* アカウント情報（タスクCで拡張） */}
            <Card sx={{ mb: 2 }} data-testid="settings-account-section">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  アカウント
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.email || 'メールアドレス未設定'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  プロフィールの編集は近日追加予定です
                </Typography>
              </CardContent>
            </Card>

            {/* 表示設定 - テーマ選択（タスクB） */}
            <Card sx={{ mb: 2 }} data-testid="settings-display-section">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  表示設定
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  アプリの見た目を選択できます
                </Typography>
                <RadioGroup
                  value={settings.preferences?.themePresetId || 'library-classic'}
                  onChange={(e) => updatePreferences({ themePresetId: e.target.value })}
                  data-testid="theme-preset-radio-group"
                >
                  {Object.values(themePresets).map((preset) => (
                    <FormControlLabel
                      key={preset.id}
                      value={preset.id}
                      control={<Radio data-testid={`theme-preset-${preset.id}`} />}
                      label={
                        <Box>
                          <Typography variant="body1">{preset.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {preset.description}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            {/* ログアウト */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                data-testid="settings-logout-button"
              >
                ログアウト
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
