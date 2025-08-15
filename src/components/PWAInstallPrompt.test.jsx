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
      shouldShowInstallPrompt: false, // デフォルトは基本プロンプト
      recordInstallPromptDismiss: jest.fn(),
    });
  });

  it('renders basic install prompt when installable', () => {
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
      shouldShowInstallPrompt: false,
      recordInstallPromptDismiss: jest.fn(),
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    expect(screen.getByText('オフラインです。一部の機能が制限される場合があります')).toBeInTheDocument();
  });

  it('handles basic install button click', async () => {
    const mockInstallApp = jest.fn();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: mockInstallApp,
      shouldShowInstallPrompt: false,
      recordInstallPromptDismiss: jest.fn(),
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    const installButton = screen.getByTestId('pwa-install-button');
    fireEvent.click(installButton);
    
    await waitFor(() => {
      expect(mockInstallApp).toHaveBeenCalled();
    }, { timeout: 10000 });
  });

  it('closes basic install prompt when close button is clicked', async () => {
    const mockRecordDismiss = jest.fn();
    // インストール可能状態でモックを設定
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: jest.fn(),
      shouldShowInstallPrompt: false,
      recordInstallPromptDismiss: mockRecordDismiss,
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

    // 閉じる記録が呼ばれることを確認
    expect(mockRecordDismiss).toHaveBeenCalled();
  });

  it('shows enhanced prompt when shouldShowInstallPrompt is true', async () => {
    const mockRecordDismiss = jest.fn();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: jest.fn(),
      shouldShowInstallPrompt: true,
      recordInstallPromptDismiss: mockRecordDismiss,
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    // 強化版プロンプトが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('📱 BookMemoをアプリとしてインストール')).toBeInTheDocument();
    });

    // PWAの利点が表示されることを確認
    expect(screen.getByText('高速起動')).toBeInTheDocument();
    expect(screen.getByText('オフライン対応')).toBeInTheDocument();
    expect(screen.getByText('ホーム画面に追加')).toBeInTheDocument();
  });

  it('handles enhanced prompt install button click', async () => {
    const mockInstallApp = jest.fn();
    const mockRecordDismiss = jest.fn();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: mockInstallApp,
      shouldShowInstallPrompt: true,
      recordInstallPromptDismiss: mockRecordDismiss,
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    // 強化版プロンプトのインストールボタンをクリック
    const installButton = screen.getByText('今すぐインストール');
    fireEvent.click(installButton);
    
    await waitFor(() => {
      expect(mockInstallApp).toHaveBeenCalled();
    });
  });

  it('handles enhanced prompt close button click', async () => {
    const mockRecordDismiss = jest.fn();
    mockUsePWA.mockReturnValue({
      isOnline: true,
      isInstallable: true,
      isInstalled: false,
      installApp: jest.fn(),
      shouldShowInstallPrompt: true,
      recordInstallPromptDismiss: mockRecordDismiss,
    });

    renderWithProviders(<PWAInstallPrompt />);
    
    // 強化版プロンプトの「後で」ボタンをクリック
    const laterButton = screen.getByText('後で');
    fireEvent.click(laterButton);
    
    // 閉じる記録が呼ばれることを確認
    expect(mockRecordDismiss).toHaveBeenCalled();
  });
});
