import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookScanner from './BookScanner';
import { ErrorDialogContext } from './CommonErrorDialog';

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

  it('renders scan button', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    expect(screen.getByRole('button', { name: /バーコードスキャン/ })).toBeInTheDocument();
  });

  it('opens modal when scan button is clicked', () => {
    renderWithProviders(
      <BookScanner 
        onScanDetected={mockOnScanDetected}
        onScanError={mockOnScanError}
      />
    );

    const scanButton = screen.getByRole('button', { name: /バーコードスキャン/ });
    fireEvent.click(scanButton);

    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
  });

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

    // スキャン成功ボタンをクリック
    const scanSuccessButton = screen.getByText('Scan Success');
    fireEvent.click(scanSuccessButton);

    expect(mockOnScanDetected).toHaveBeenCalledWith('9784873119485');
    expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument();
  });

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

    // スキャンエラーボタンをクリック
    const scanErrorButton = screen.getByText('Scan Error');
    fireEvent.click(scanErrorButton);

    expect(mockSetGlobalError).toHaveBeenCalledWith('Scanner error');
    expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument();
  });
}); 