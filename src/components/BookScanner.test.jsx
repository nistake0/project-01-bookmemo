import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookScanner from './BookScanner';
import { ErrorDialogContext } from './CommonErrorDialog';

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

const mockSetGlobalError = jest.fn();

/**
 * テスト用のレンダリング関数
 * ErrorDialogContextでコンポーネントをラップ
 */
const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {component}
    </ErrorDialogContext.Provider>
  );
};

describe('BookScanner', () => {
  const mockOnScanDetected = jest.fn();
  const mockOnScanError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: スキャンボタンの表示
   * 
   * 目的: バーコードスキャンボタンが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. バーコードスキャンボタンが存在することを確認
   */
  it('renders scan button', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    expect(screen.getByRole('button', { name: /バーコードスキャン/ })).toBeInTheDocument();
  });

  /**
   * テストケース: スキャンボタンクリック時のモーダル表示
   * 
   * 目的: スキャンボタンをクリックした場合、バーコードスキャナーのモーダルが
   * 表示されることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. バーコードスキャンボタンをクリック
   * 3. バーコードスキャナーがモーダル内に表示されることを確認
   */
  it('opens modal when scan button is clicked', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    // スキャンボタンをクリック
    const scanButton = screen.getByRole('button', { name: /バーコードスキャン/ });
    fireEvent.click(scanButton);

    // バーコードスキャナーがモーダル内に表示されることを確認
    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
  });

  /**
   * テストケース: モーダル閉じるボタンの動作
   * 
   * 目的: モーダルの閉じるボタン（×）をクリックした場合、モーダルが閉じられることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリックしてモーダルを開く
   * 3. 閉じるボタン（×）をクリック
   * 4. モーダルが閉じられていることを確認
   */
  it('closes modal when close button is clicked', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    // モーダルを開く
    const scanButton = screen.getByRole('button', { name: /バーコードスキャン/ });
    fireEvent.click(scanButton);

    // 閉じるボタンをクリック
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // モーダルが閉じられていることを確認
    expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument();
  });

  /**
   * テストケース: バーコード検出時の処理
   * 
   * 目的: バーコードが検出された場合、onScanDetectedコールバックが呼ばれ、
   * モーダルが自動的に閉じられることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリックしてモーダルを開く
   * 3. モックのスキャン成功ボタンをクリック
   * 4. onScanDetectedが正しいISBNで呼ばれることを確認
   * 5. モーダルが自動的に閉じられることを確認
   */
  it('calls onScanDetected when barcode is detected', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    // モーダルを開く
    const scanButton = screen.getByRole('button', { name: /バーコードスキャン/ });
    fireEvent.click(scanButton);

    // スキャン成功ボタンをクリック（バーコード検出をシミュレート）
    const scanSuccessButton = screen.getByText('Scan Success');
    fireEvent.click(scanSuccessButton);

    // onScanDetectedが正しいISBNで呼ばれることを確認
    expect(mockOnScanDetected).toHaveBeenCalledWith('9784873119485');
    
    // モーダルが自動的に閉じられることを確認
    expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument();
  });

  /**
   * テストケース: スキャンエラー時の処理
   * 
   * 目的: スキャンエラーが発生した場合、setGlobalErrorが呼ばれ、
   * モーダルが自動的に閉じられることを確認
   * 
   * テストステップ:
   * 1. BookScannerコンポーネントをレンダリング
   * 2. スキャンボタンをクリックしてモーダルを開く
   * 3. モックのスキャンエラーボタンをクリック
   * 4. setGlobalErrorが正しいエラーメッセージで呼ばれることを確認
   * 5. モーダルが自動的に閉じられることを確認
   */
  it('calls setGlobalError when scan error occurs', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    // モーダルを開く
    const scanButton = screen.getByRole('button', { name: /バーコードスキャン/ });
    fireEvent.click(scanButton);

    // スキャンエラーボタンをクリック（スキャンエラーをシミュレート）
    const scanErrorButton = screen.getByText('Scan Error');
    fireEvent.click(scanErrorButton);

    // setGlobalErrorが正しいエラーメッセージで呼ばれることを確認
    expect(mockSetGlobalError).toHaveBeenCalledWith('Scanner error');
    
    // モーダルが自動的に閉じられることを確認
    expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument();
  });
}); 