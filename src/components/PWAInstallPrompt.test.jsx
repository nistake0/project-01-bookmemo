import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import PWAInstallPrompt from './PWAInstallPrompt';

// usePWAフックのモック
const mockUsePWA = jest.fn();

jest.mock('../hooks/usePWA', () => ({
  usePWA: () => mockUsePWA(),
}));

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: jest.fn(),
    });
  });

  it('renders install prompt when installable', () => {
    renderWithProviders(<PWAInstallPrompt />);
    
    expect(screen.getByText('BookMemoをホーム画面に追加して、より快適にご利用いただけます')).toBeInTheDocument();
    expect(screen.getByTestId('pwa-install-button')).toBeInTheDocument();
  });

  it('shows offline alert when offline', () => {
    // オフライン状態のモック
    mockUsePWA.mockReturnValue({
      isOnline: false,
      isInstallable: false,
      isInstalled: false,
      installApp: jest.fn(),
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    expect(screen.getByText('オフラインです。一部の機能が制限される場合があります')).toBeInTheDocument();
  });

  it('handles install button click', async () => {
    const mockInstallApp = jest.fn();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: mockInstallApp,
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    const installButton = screen.getByTestId('pwa-install-button');
    fireEvent.click(installButton);
    
    await waitFor(() => {
      expect(mockInstallApp).toHaveBeenCalled();
    }, { timeout: 10000 });
  });

  it('closes install prompt when close button is clicked', async () => {
    // インストール可能状態でモックを設定
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: jest.fn(),
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    // プロンプトが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('BookMemoをホーム画面に追加して、より快適にご利用いただけます')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // プロンプトが非表示になることを確認
    await waitFor(() => {
      expect(screen.queryByText('BookMemoをホーム画面に追加して、より快適にご利用いただけます')).not.toBeInTheDocument();
    });
  });
});
