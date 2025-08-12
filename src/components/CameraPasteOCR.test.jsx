import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CameraPasteOCR from './CameraPasteOCR';
import { renderWithProviders } from '../test-utils';

// navigator.userAgentのモック
const mockUserAgent = (userAgent) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true
  });
};

// navigator.clipboardのモック
const mockClipboard = {
  readText: jest.fn()
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true
});

describe('CameraPasteOCR', () => {
  const mockOnTextDetected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.readText.mockClear();
    
    // console.errorのモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('デバイス検出', () => {
    it('iPhone Safariの場合、適切なボタンテキストを表示する', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
      
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      expect(screen.getByText('カメラでスキャン（コピーしてペースト）')).toBeInTheDocument();
    });

    it('非iPhone Safariの場合、適切なボタンテキストを表示する', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      expect(screen.getByText('カメラでスキャン')).toBeInTheDocument();
    });
  });

  describe('iPhone Safariでの動作', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
    });

    it('ボタンクリックで指示ダイアログが開く', async () => {
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('camera-instructions-dialog')).toBeInTheDocument();
      });
    });

         it('指示ダイアログに適切な内容が表示される', async () => {
       renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
       
       const button = screen.getByTestId('camera-paste-ocr-button');
       fireEvent.click(button);
       
       await waitFor(() => {
         expect(screen.getByText('カメラでテキストスキャン')).toBeInTheDocument();
         expect(screen.getByText('カメラアプリを手動で起動してください')).toBeInTheDocument();
         expect(screen.getByText('テキストが認識されたら、テキストをタップして選択してください')).toBeInTheDocument();
         expect(screen.getByText('「コピー」をタップしてテキストをコピーしてください')).toBeInTheDocument();
         expect(screen.getByText('この画面に戻って、下の「ペースト」ボタンをタップしてください')).toBeInTheDocument();
       });
     });

         it('ペーストボタンが表示される', async () => {
       renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
       
       const button = screen.getByTestId('camera-paste-ocr-button');
       fireEvent.click(button);
       
       await waitFor(() => {
         expect(screen.getByTestId('manual-paste-button')).toBeInTheDocument();
       });
     });

    it('キャンセルボタンでダイアログが閉じる', async () => {
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('camera-instructions-dialog')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('キャンセル');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('camera-instructions-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('非iPhone Safariでの動作', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // alertのモック
      global.alert = jest.fn();
    });

    it('ボタンクリックでアラートが表示される', () => {
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);
      
      expect(global.alert).toHaveBeenCalledWith('この機能は現在iPhone Safariでのみ利用可能です。');
    });
  });

  

   describe('ペースト機能', () => {
     beforeEach(() => {
       mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
     });

    it('手動ペーストボタンでクリップボードから読み取り', async () => {
      const mockText = 'テストテキスト';
      mockClipboard.readText.mockResolvedValue(mockText);
      
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('manual-paste-button')).toBeInTheDocument();
      });
      
      const pasteButton = screen.getByTestId('manual-paste-button');
      fireEvent.click(pasteButton);
      
      await waitFor(() => {
        expect(mockClipboard.readText).toHaveBeenCalled();
        expect(mockOnTextDetected).toHaveBeenCalledWith(mockText);
      });
    });

    

    it('クリップボード読み取りエラー時の処理', async () => {
      mockClipboard.readText.mockRejectedValue(new Error('Permission denied'));
      
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('manual-paste-button')).toBeInTheDocument();
      });
      
      const pasteButton = screen.getByTestId('manual-paste-button');
      fireEvent.click(pasteButton);
      
      // エラーがログに出力されることを確認
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      }, { timeout: 1000 });
    }, 10000);
  });

  describe('disabled状態', () => {
    it('disabledプロパティが正しく適用される', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
      
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} disabled={true} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      expect(button).toBeDisabled();
    });
  });
});
