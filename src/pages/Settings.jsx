import { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../auth/AuthProvider';
import { getThemePresets } from '../theme/themePresets';
import { buildPath } from '../config/paths';
import { DEFAULT_THEME_MODE } from '../constants/userSettings';

/**
 * 設定画面
 * タスクA: ユーザー設定の基盤
 * タスクB: テーマ選択UI
 * タスクC: プロフィール編集
 */
export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, loading, error, updatePreferences, updateProfile } = useUserSettings();
  const themePresets = getThemePresets(buildPath);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const handleOpenProfileDialog = () => {
    setEditDisplayName(settings.profile?.displayName || '');
    setEditAvatarUrl(settings.profile?.avatarUrl || '');
    setProfileDialogOpen(true);
  };

  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({
        displayName: editDisplayName.trim(),
        avatarUrl: editAvatarUrl.trim(),
      });
      handleCloseProfileDialog();
    } catch (err) {
      console.error('プロフィールの保存に失敗しました:', err);
    } finally {
      setProfileSaving(false);
    }
  };

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
            {/* アカウント・プロフィール（タスクC） */}
            <Card sx={{ mb: 2 }} data-testid="settings-account-section">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  アカウント
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.email || 'メールアドレス未設定'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <Avatar
                    src={settings.profile?.avatarUrl || undefined}
                    alt={settings.profile?.displayName || 'アバター'}
                    sx={{ width: 56, height: 56 }}
                  >
                    {settings.profile?.displayName ? (
                      settings.profile.displayName.charAt(0).toUpperCase()
                    ) : (
                      <PersonIcon />
                    )}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {settings.profile?.displayName || '表示名未設定'}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleOpenProfileDialog}
                      data-testid="profile-edit-button"
                    >
                      編集
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* プロフィール編集ダイアログ */}
            <Dialog open={profileDialogOpen} onClose={handleCloseProfileDialog} maxWidth="sm" fullWidth>
              <DialogTitle>プロフィール編集</DialogTitle>
              <DialogContent>
                <TextField
                  label="表示名"
                  fullWidth
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                  sx={{ mt: 1, mb: 2 }}
                  inputProps={{ 'data-testid': 'profile-display-name-input' }}
                />
                <TextField
                  label="アバター画像URL"
                  fullWidth
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  helperText="画像のURLを入力するとアバターとして表示されます"
                  inputProps={{ 'data-testid': 'profile-avatar-url-input' }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseProfileDialog}>キャンセル</Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  data-testid="profile-save-button"
                >
                  {profileSaving ? '保存中...' : '保存'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* 表示設定 - テーマ選択（タスクB） */}
            <Card sx={{ mb: 2 }} data-testid="settings-display-section">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  表示設定
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  アプリの見た目を選択できます
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    テーマ
                  </Typography>
                  <ToggleButtonGroup
                    value={settings.preferences?.themePresetId || 'library-classic'}
                    exclusive
                    onChange={(e, value) => value != null && updatePreferences({ themePresetId: value })}
                    fullWidth
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    data-testid="theme-preset-radio-group"
                  >
                    {Object.values(themePresets).map((preset) => (
                      <ToggleButton
                        key={preset.id}
                        value={preset.id}
                        sx={{ flex: '1 1 auto', minWidth: 120 }}
                        data-testid={`theme-preset-${preset.id}`}
                      >
                        <Box sx={{ textAlign: 'center', py: 0.5 }}>
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            {preset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {preset.description}
                          </Typography>
                        </Box>
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    モード
                  </Typography>
                  <ToggleButtonGroup
                    value={settings.preferences?.themeMode || DEFAULT_THEME_MODE}
                    exclusive
                    onChange={(e, value) => value != null && updatePreferences({ themeMode: value })}
                    fullWidth
                    size="small"
                    data-testid="theme-mode-radio-group"
                  >
                    <ToggleButton value="normal" data-testid="theme-mode-normal">
                      ノーマル
                    </ToggleButton>
                    <ToggleButton value="dark" data-testid="theme-mode-dark">
                      ダーク
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
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
