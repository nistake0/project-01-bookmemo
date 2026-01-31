import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { appTheme } from '../theme/appTheme';
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
        <ThemeProvider theme={appTheme}>
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
  });
});
