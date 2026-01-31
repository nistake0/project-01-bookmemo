import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { testTheme } from '../../theme/testTheme';
import LoadingIndicator from './LoadingIndicator';

const renderWithTheme = (ui) =>
  render(<ThemeProvider theme={testTheme}>{ui}</ThemeProvider>);

describe('LoadingIndicator', () => {
  test('default inline variant renders with data-testid', () => {
    renderWithTheme(<LoadingIndicator />);
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('fullPage variant shows message', () => {
    renderWithTheme(
      <LoadingIndicator variant="fullPage" message="読み込み中..." />
    );
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  test('custom data-testid is applied', () => {
    renderWithTheme(
      <LoadingIndicator data-testid="custom-loading" />
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  test('inline variant with message', () => {
    renderWithTheme(
      <LoadingIndicator variant="inline" message="検索中..." />
    );
    expect(screen.getByText('検索中...')).toBeInTheDocument();
  });
});
