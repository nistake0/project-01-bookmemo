import { useState, useCallback, useEffect, useContext, createContext } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { DEFAULT_USER_SETTINGS } from '../constants/userSettings';
import { ErrorDialogContext } from '../components/CommonErrorDialog';

const UserSettingsContext = createContext(null);

/**
 * ユーザー設定の取得・更新フック
 * UserSettingsProvider 経由で state を共有するため、
 * Settings で updatePreferences を呼ぶと ThemeProviderWithUserSettings にも即時反映される
 *
 * @returns {Object} { settings, loading, error, updatePreferences, updateProfile }
 */
export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return ctx;
}

function UserSettingsProviderInner({ children }) {
  const { user } = useAuth();
  const errorContext = useContext(ErrorDialogContext);
  const setGlobalError = errorContext?.setGlobalError || (() => {});

  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!user?.uid) {
      setSettings(DEFAULT_USER_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          profile: {
            displayName: data.profile?.displayName ?? DEFAULT_USER_SETTINGS.profile.displayName,
            avatarUrl: data.profile?.avatarUrl ?? DEFAULT_USER_SETTINGS.profile.avatarUrl,
          },
          preferences: {
            themePresetId: data.preferences?.themePresetId ?? DEFAULT_USER_SETTINGS.preferences.themePresetId,
            themeMode: data.preferences?.themeMode ?? DEFAULT_USER_SETTINGS.preferences.themeMode,
          },
        });
      } else {
        setSettings(DEFAULT_USER_SETTINGS);
      }
    } catch (err) {
      console.error('ユーザー設定の取得に失敗しました:', err);
      setGlobalError('ユーザー設定の取得に失敗しました。');
      setError('ユーザー設定の取得に失敗しました。');
      setSettings(DEFAULT_USER_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, setGlobalError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updatePreferences = useCallback(
    async (updates) => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentProfile = currentData.profile ?? DEFAULT_USER_SETTINGS.profile;
        const currentPreferences = currentData.preferences ?? DEFAULT_USER_SETTINGS.preferences;

        const newPreferences = { ...currentPreferences, ...updates };
        await setDoc(docRef, {
          profile: currentProfile,
          preferences: newPreferences,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setSettings((prev) => ({
          ...prev,
          preferences: newPreferences,
        }));
      } catch (err) {
        console.error('設定の更新に失敗しました:', err);
        setGlobalError('設定の更新に失敗しました。');
        throw err;
      }
    },
    [user?.uid, setGlobalError]
  );

  const updateProfile = useCallback(
    async (updates) => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentProfile = currentData.profile ?? DEFAULT_USER_SETTINGS.profile;
        const currentPreferences = currentData.preferences ?? DEFAULT_USER_SETTINGS.preferences;

        const newProfile = { ...currentProfile, ...updates };
        await setDoc(docRef, {
          profile: newProfile,
          preferences: currentPreferences,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setSettings((prev) => ({
          ...prev,
          profile: newProfile,
        }));
      } catch (err) {
        console.error('プロフィールの更新に失敗しました:', err);
        setGlobalError('プロフィールの更新に失敗しました。');
        throw err;
      }
    },
    [user?.uid, setGlobalError]
  );

  const value = {
    settings,
    loading,
    error,
    updatePreferences,
    updateProfile,
    refresh: fetchSettings,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

/**
 * ユーザー設定を Context で提供するプロバイダ
 * AuthProvider と ErrorDialogProvider の内側に配置すること
 */
export function UserSettingsProvider({ children }) {
  return <UserSettingsProviderInner>{children}</UserSettingsProviderInner>;
}
