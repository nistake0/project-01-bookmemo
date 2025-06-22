import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BarcodeScanner from './BarcodeScanner';
import { BrowserMultiFormatReader } from '@zxing/library';

// jest.setup.jsで@zxing/libraryはモック化済み

describe.skip('バーコードスキャナー', () => {
  let mockReader;

  beforeEach(() => {
    // 各テストの前にモックインスタンスを取得
    mockReader = new BrowserMultiFormatReader();
    // モックの関数をクリア
    mockReader.decodeFromVideoDevice.mockClear();
    mockReader.reset.mockClear();
  });

  test('バーコードが検出されたらonDetectedが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const testBarcode = '1234567890';

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);

    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    // decodeFromVideoDeviceが呼ばれた際に、テスト用のバーコードを返すように設定
    mockReader.decodeFromVideoDevice.mockImplementation((deviceId, video, callback) => {
       callback({ getText: () => testBarcode }, null);
       return Promise.resolve({ stop: jest.fn() });
    });

    // BarcodeScannerコンポーネントが内部で非同期にリーダーを実行するのを待つ
    // このテストでは、コンポーネントのマウントによってdecodeFromVideoDeviceが呼ばれることを期待
    await waitFor(() => {
       expect(mockReader.decodeFromVideoDevice).toHaveBeenCalled();
    });

    // onDetectedが正しいバーコードで呼び出されたことを確認
    await waitFor(() => {
      expect(handleDetected).toHaveBeenCalledWith(testBarcode);
    });

    expect(handleError).not.toHaveBeenCalled();
    expect(mockReader.reset).toHaveBeenCalled();
  });


  test('エラーが発生したらonErrorが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const testError = new Error('Test scan error');

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);

    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    // decodeFromVideoDeviceが呼ばれた際に、エラーを返すように設定
    mockReader.decodeFromVideoDevice.mockImplementation((deviceId, video, callback) => {
        callback(null, testError);
        return Promise.resolve({ stop: jest.fn() });
    });

    await waitFor(() => {
        expect(mockReader.decodeFromVideoDevice).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith('バーコードのスキャンに失敗しました。');
    });

    expect(handleDetected).not.toHaveBeenCalled();
    expect(mockReader.reset).toHaveBeenCalled();
  });

  test('カメラのパーミッションが拒否されたらonErrorが呼ばれる', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();

    // decodeFromVideoDeviceが呼ばれた際に、パーミッションエラーをシミュレート
    mockReader.decodeFromVideoDevice.mockRejectedValue(new Error('Permission denied'));

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);
    
    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    await waitFor(() => {
        expect(mockReader.decodeFromVideoDevice).toHaveBeenCalled();
    });

    await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith("カメラの起動に失敗しました。");
    });

    expect(handleDetected).not.toHaveBeenCalled();
    // resetは呼ばれないはず
    expect(mockReader.reset).not.toHaveBeenCalled();
  });
}); 