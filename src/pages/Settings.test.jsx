import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { testTheme } from '../theme/testTheme';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import { UserSettingsProvider } from '../hooks/useUserSettings';
import Settings from './Settings';

// useNavigate のモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderSettings = () =>
  render(
    <ErrorDialogContext.Provider value={{ setGlobalError: jest.fn() }}>
      <UserSettingsProvider>
        <ThemeProvider theme={testTheme}>
          <MemoryRouter>
            <Settings />
          </MemoryRouter>
        </ThemeProvider>
      </UserSettingsProvider>
    </ErrorDialogContext.Provider>
  );

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('設定画面が表示される', () => {
    renderSettings();

    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  test('ログアウトボタンが表示される', async () => {
    renderSettings();

    await screen.findByTestId('settings-logout-button');
    expect(screen.getByTestId('settings-logout-button')).toHaveTextContent('ログアウト');
  });

  test('テーマ選択のラジオボタンが表示される', async () => {
    renderSettings();

    await screen.findByTestId('theme-preset-radio-group');
    expect(screen.getByTestId('theme-preset-library-classic')).toBeInTheDocument();
    expect(screen.getByTestId('theme-preset-minimal-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-preset-slim-compact')).toBeInTheDocument();
  });

  test('モード（ノーマル/ダーク）の切り替えが表示される', async () => {
    renderSettings();

    await screen.findByTestId('theme-mode-radio-group');
    expect(screen.getByTestId('theme-mode-normal')).toBeInTheDocument();
    expect(screen.getByTestId('theme-mode-dark')).toBeInTheDocument();
  });

  test('プロフィール編集ボタンが表示される', async () => {
    renderSettings();

    await screen.findByTestId('profile-edit-button');
    expect(screen.getByTestId('profile-edit-button')).toHaveTextContent('編集');
  });

  test('編集ボタンクリックでプロフィール編集ダイアログが開く', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('profile-edit-button');
    await user.click(screen.getByTestId('profile-edit-button'));

    expect(screen.getByRole('dialog', { name: /プロフィール編集/i })).toBeInTheDocument();
    expect(screen.getByTestId('profile-display-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('profile-avatar-url-input')).toBeInTheDocument();
  });

  test('プロフィールを編集して保存できる', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('profile-edit-button');
    await user.click(screen.getByTestId('profile-edit-button'));

    await user.type(screen.getByTestId('profile-display-name-input'), 'テストユーザー');
    await user.click(screen.getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /プロフィール編集/i })).not.toBeInTheDocument();
    });
  });

  test('library-classic 選択時に背景セクションが表示される', async () => {
    renderSettings();

    await screen.findByTestId('theme-preset-radio-group');
    expect(screen.getByTestId('settings-background-section')).toBeInTheDocument();
    expect(screen.getByTestId('background-preset-none')).toBeInTheDocument();
    expect(screen.getByTestId('background-preset-bg-01')).toBeInTheDocument();
    expect(screen.getByTestId('background-preset-bg-04')).toBeInTheDocument();
    expect(screen.getByTestId('background-preset-bg-10')).toBeInTheDocument();
  });

  test('ミニマル（ライト）選択時は画像選択は非表示だが背景色変更は表示される', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('theme-preset-minimal-light');
    await user.click(screen.getByTestId('theme-preset-minimal-light'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-background-section')).toBeInTheDocument();
      expect(screen.queryByTestId('background-preset-bg-01')).not.toBeInTheDocument();
      expect(screen.getByTestId('background-color-picker')).toBeInTheDocument();
      expect(screen.getByTestId('background-color-input')).toBeInTheDocument();
    });
  });

  test('背景「なし」選択時に色選択が表示される', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('background-preset-none');
    await user.click(screen.getByTestId('background-preset-none'));

    await waitFor(() => {
      expect(screen.getByTestId('background-color-picker')).toBeInTheDocument();
      expect(screen.getByTestId('background-color-input')).toBeInTheDocument();
    });
  });
});
