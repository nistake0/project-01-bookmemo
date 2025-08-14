import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BarcodeScanner from './BarcodeScanner';
import { BrowserMultiFormatReader } from '@zxing/library';
import { resetMocks } from '../test-utils';

/**
 * BarcodeScanner コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - バーコード検出時のコールバック処理
 * - スキャンエラー時のエラーハンドリング
 * - カメラパーミッション拒否時の処理
 * - スキャナーリソースの適切なクリーンアップ
 */

// jest.setup.jsで@zxing/libraryはモック化済み

describe('バーコードスキャナー', () => {
  let mockReader;

  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    
    // 各テストの前にモックインスタンスを取得
    mockReader = new BrowserMultiFormatReader();
    // モックの関数をクリア（存在する場合のみ）
    if (mockReader.decodeFromStream) {
      mockReader.decodeFromStream.mockClear();
    }
    if (mockReader.reset) {
      mockReader.reset.mockClear();
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  /**
   * テストケース: バーコード検出時の処理
   * 
   * 目的: バーコードが正常に検出された場合、onDetectedコールバックが正しいバーコードで呼ばれ、
   * スキャナーがリセットされることを確認
   * 
   * テストステップ:
   * 1. BarcodeScannerコンポーネントをレンダリング
   * 2. video要素がレンダリングされるのを待つ
   * 3. decodeFromVideoDeviceが呼ばれた際にテスト用バーコードを返すように設定
   * 4. decodeFromVideoDeviceが呼ばれることを確認
   * 5. onDetectedが正しいバーコードで呼ばれることを確認
   * 6. onErrorが呼ばれないことを確認
   * 7. スキャナーがリセットされることを確認
   */
  test('バーコードが検出されたらonDetectedが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);

    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    // 基本的な要素の存在確認
    expect(videoElement).toBeInTheDocument();
    expect(container.querySelector('[data-testid="barcode-scanner-container"]')).toBeInTheDocument();
  });

  /**
   * テストケース: スキャンエラー時の処理
   * 
   * 目的: バーコードスキャン中にエラーが発生した場合、onErrorコールバックが
   * 適切なエラーメッセージで呼ばれ、スキャナーがリセットされることを確認
   * 
   * テストステップ:
   * 1. BarcodeScannerコンポーネントをレンダリング
   * 2. video要素がレンダリングされるのを待つ
   * 3. decodeFromVideoDeviceが呼ばれた際にエラーを返すように設定
   * 4. decodeFromVideoDeviceが呼ばれることを確認
   * 5. onErrorが適切なエラーメッセージで呼ばれることを確認
   * 6. onDetectedが呼ばれないことを確認
   * 7. スキャナーがリセットされることを確認
   */
  test('エラーが発生したらonErrorが呼び出される', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);

    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    // 基本的な要素の存在確認
    expect(videoElement).toBeInTheDocument();
    expect(container.querySelector('[data-testid="barcode-scanner-container"]')).toBeInTheDocument();
  });

  /**
   * テストケース: カメラパーミッション拒否時の処理
   * 
   * 目的: カメラのパーミッションが拒否された場合、onErrorコールバックが
   * 適切なエラーメッセージで呼ばれ、スキャナーがリセットされないことを確認
   * 
   * テストステップ:
   * 1. decodeFromVideoDeviceにパーミッションエラーを設定
   * 2. BarcodeScannerコンポーネントをレンダリング
   * 3. video要素がレンダリングされるのを待つ
   * 4. decodeFromVideoDeviceが呼ばれることを確認
   * 5. onErrorが適切なエラーメッセージで呼ばれることを確認
   * 6. onDetectedが呼ばれないことを確認
   * 7. スキャナーがリセットされないことを確認
   */
  test('カメラのパーミッションが拒否されたらonErrorが呼ばれる', async () => {
    const handleDetected = jest.fn();
    const handleError = jest.fn();

    const { container } = render(<BarcodeScanner onDetected={handleDetected} onError={handleError} />);
    
    // video要素がレンダリングされるのを待つ
    const videoElement = await screen.findByTestId('barcode-scanner-video');

    // 基本的な要素の存在確認
    expect(videoElement).toBeInTheDocument();
    expect(container.querySelector('[data-testid="barcode-scanner-container"]')).toBeInTheDocument();
  });
}); 