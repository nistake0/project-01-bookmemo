import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookScanner from './BookScanner';
import { ErrorDialogContext } from './CommonErrorDialog';
import { resetMocks } from '../test-utils';

/**
 * BookScanner コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - バーコードスキャンボタンの表示
 * - スキャンモーダルの開閉
 * - バーコード検出時のコールバック処理
 * - スキャンエラー時のエラーハンドリング
 * - モーダルの自動閉じ機能
 */

// BarcodeScanner モック
jest.mock('./BarcodeScanner', () => {
  return function MockBarcodeScanner({ onDetected, onError }) {
    return (
      <div data-testid="barcode-scanner">
        <button onClick={() => onDetected('9784873119485')}>Scan Success</button>
        <button onClick={() => onError('Scanner error')}>Scan Error</button>
      </div>
    );
  };
});

// モック関数
const mockOnScan = jest.fn();

// テスト用のレンダリング関数
const mockSetGlobalError = jest.fn();
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {component}
    </ErrorDialogContext.Provider>
  );
};

describe('BookScanner', () => {
  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    mockOnScan.mockClear();
    mockSetGlobalError.mockClear();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  /**
   * テストケース: バーコードスキャンボタンの表示確認
   * 
   * 目的: BookScannerコンポーネントが正しくレンダリングされ、
   * バーコードスキャンボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. バーコードスキャンボタンが表示されることを確認
   */
  it('renders scan button', () => {
    renderWithProviders(<BookScanner onScan={mockOnScan} />);
    
    expect(screen.getByTestId('barcode-scan-button')).toBeInTheDocument();
  });

  /**
   * テストケース: モーダルの開閉機能
   * 
   * 目的: スキャンボタンをクリックした場合、モーダルが開き、
   * 閉じるボタンをクリックした場合、モーダルが閉じることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリック
   * 3. モーダルが開くことを確認
   * 4. 閉じるボタンをクリック
   * 5. モーダルが閉じることを確認
   */
  it('opens and closes modal', () => {
    renderWithProviders(<BookScanner onScan={mockOnScan} />);

    // スキャンボタンをクリック
    const scanButton = screen.getByTestId('barcode-scan-button');
    fireEvent.click(scanButton);

    // モーダルが開くことを確認
    expect(screen.getByTestId('barcode-scan-modal')).toBeInTheDocument();

    // 閉じるボタンをクリック
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // モーダルが閉じることを確認
    expect(screen.queryByTestId('barcode-scan-modal')).not.toBeInTheDocument();
  });

  /**
   * テストケース: バーコード検出時のコールバック呼び出し
   * 
   * 目的: バーコードが検出された場合、onScanコールバックが正しいISBNで呼ばれることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリック
   * 3. モーダルが開くことを確認
   * 4. 成功ボタンをクリック
   * 5. onScanコールバックが正しいISBNで呼ばれることを確認
   */
  it('calls onScan when barcode is detected', async () => {
    renderWithProviders(<BookScanner onScan={mockOnScan} />);

    // スキャンボタンをクリック
    const scanButton = screen.getByTestId('barcode-scan-button');
    fireEvent.click(scanButton);

    // モーダルが開くことを確認
    expect(screen.getByTestId('barcode-scan-modal')).toBeInTheDocument();

    // 成功ボタンをクリック
    const successButton = screen.getByText('Scan Success');
    fireEvent.click(successButton);

    // onScanコールバックが正しいISBNで呼ばれることを確認
    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('9784873119485');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: スキャンエラー時の処理
   * 
   * 目的: バーコードスキャンでエラーが発生した場合、エラーメッセージが表示されることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリック
   * 3. モーダルが開くことを確認
   * 4. エラーボタンをクリック
   * 5. setGlobalErrorが呼ばれることを確認
   */
  it('handles scan errors', async () => {
    renderWithProviders(<BookScanner onScan={mockOnScan} />);

    // スキャンボタンをクリック
    const scanButton = screen.getByTestId('barcode-scan-button');
    fireEvent.click(scanButton);

    // モーダルが開くことを確認
    expect(screen.getByTestId('barcode-scan-modal')).toBeInTheDocument();

    // エラーボタンをクリック
    const errorButton = screen.getByText('Scan Error');
    fireEvent.click(errorButton);

    // setGlobalErrorが呼ばれることを確認
    await waitFor(() => {
      expect(mockSetGlobalError).toHaveBeenCalledWith('Scanner error');
    }, { timeout: 3000 });
  });

  /**
   * テストケース: バーコード検出時のモーダル自動閉じ
   * 
   * 目的: バーコードが検出された場合、モーダルが自動的に閉じることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリック
   * 3. モーダルが開くことを確認
   * 4. 成功ボタンをクリック
   * 5. モーダルが自動的に閉じることを確認
   */
  it('closes modal automatically when barcode is detected', async () => {
    renderWithProviders(<BookScanner onScan={mockOnScan} />);

    // スキャンボタンをクリック
    const scanButton = screen.getByTestId('barcode-scan-button');
    fireEvent.click(scanButton);

    // モーダルが開くことを確認
    expect(screen.getByTestId('barcode-scan-modal')).toBeInTheDocument();

    // 成功ボタンをクリック
    const successButton = screen.getByText('Scan Success');
    fireEvent.click(successButton);

    // モーダルが自動的に閉じることを確認
    await waitFor(() => {
      expect(screen.queryByTestId('barcode-scan-modal')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 