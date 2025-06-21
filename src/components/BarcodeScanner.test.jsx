import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarcodeScanner from './BarcodeScanner';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// @zxing/library をモック化
jest.mock('@zxing/library', () => {
  const originalModule = jest.requireActual('@zxing/library');
  const mockReader = {
    decodeFromStream: jest.fn(),
    reset: jest.fn(),
  };
  return {
    ...originalModule,
    BrowserMultiFormatReader: jest.fn(() => mockReader),
  };
});

// navigator.mediaDevices.getUserMedia をモック化
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
};

// HTMLVideoElement.play をモック化
window.HTMLVideoElement.prototype.play = jest.fn(() => Promise.resolve());
window.HTMLVideoElement.prototype.pause = jest.fn();

describe('BarcodeScanner', () => {
  let mockDecodeFromStream;
  let mockReset;

  beforeEach(() => {
    jest.clearAllMocks();
    const readerInstance = new BrowserMultiFormatReader();
    mockDecodeFromStream = readerInstance.decodeFromStream;
    mockReset = readerInstance.reset;
    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  const renderAndFireEvents = (onDetected, onError) => {
    const { container } = render(<BarcodeScanner onDetected={onDetected} onError={onError} />);
    const video = container.querySelector('video');
    if (video) {
      fireEvent(video, new Event('loadedmetadata'));
      fireEvent(video, new Event('playing'));
    }
  };
  
  test('バーコードが検出されたらonDetectedが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const testBarcode = '1234567890';

    mockDecodeFromStream.mockImplementation((stream, video, callback) => {
      callback({ getText: () => testBarcode }, null);
      return {};
    });
    
    renderAndFireEvents(handleDetected, handleError);

    await waitFor(() => {
      expect(handleDetected).toHaveBeenCalledWith(testBarcode);
    });
    expect(handleError).not.toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });

  test('エラーが発生したらonErrorが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const testError = new Error('Test scan error');

    mockDecodeFromStream.mockImplementation((stream, video, callback) => {
      callback(null, testError);
      return {};
    });

    renderAndFireEvents(handleDetected, handleError);

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith('Test scan error');
    });
    expect(handleDetected).not.toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });
  
  test('NotFoundExceptionはエラーとして扱われない', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const notFoundError = new NotFoundException('Barcode not found');

    mockDecodeFromStream.mockImplementation((stream, video, callback) => {
      callback(null, notFoundError);
      return {};
    });

    renderAndFireEvents(handleDetected, handleError);

    await new Promise(r => setTimeout(r, 100));
    expect(handleError).not.toHaveBeenCalled();
    expect(handleDetected).not.toHaveBeenCalled();
  });

  test('コンポーネントのアンマウント時にリソースが解放される', async () => {
    const mockStop = jest.fn();
    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: mockStop }],
    });

    const { unmount } = render(<BarcodeScanner onDetected={() => {}} onError={() => {}} />);
    
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());

    unmount();

    expect(mockReset).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
  });

  test('カメラの起動に失敗したらonErrorが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();
    const cameraError = new Error('Camera permissions denied');
    navigator.mediaDevices.getUserMedia.mockRejectedValue(cameraError);

    render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith('カメラの起動に失敗しました。');
    });
    expect(handleDetected).not.toHaveBeenCalled();
  });
}); 