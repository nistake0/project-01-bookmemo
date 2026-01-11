import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CameraPasteOCR from './CameraPasteOCR';
import { renderWithProviders } from '../test-utils';

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

  describe('基本機能', () => {
    it('テキストペーストボタンを表示する', () => {
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('テキストをペースト');
    });

    it('ボタンクリック時にクリップボードからテキストを読み取る', async () => {
      const mockText = 'テストテキスト';
      mockClipboard.readText.mockResolvedValue(mockText);

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockClipboard.readText).toHaveBeenCalled();
        expect(mockOnTextDetected).toHaveBeenCalledWith(mockText);
      });
    });

    it('ローディング状態を表示する', async () => {
      mockClipboard.readText.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      expect(screen.getByText('読み取り中...')).toBeInTheDocument();
    });

    it('クリップボードが空の場合、エラーメッセージを表示する', async () => {
      mockClipboard.readText.mockResolvedValue('');

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('camera-paste-ocr-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('クリップボードが空です');
      });
    });

    it('クリップボード機能が利用できない場合、エラーメッセージを表示する', async () => {
      // navigator.clipboardを一時的に削除
      const originalClipboard = navigator.clipboard;
      delete navigator.clipboard;

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('camera-paste-ocr-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('クリップボード機能が利用できません');
      });

      // navigator.clipboardを復元
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      });
    });

    it('クリップボード読み取りエラーの場合、エラーメッセージを表示する', async () => {
      mockClipboard.readText.mockRejectedValue(new Error('Permission denied'));

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('camera-paste-ocr-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('テキストの読み取りに失敗しました');
      });
    });

    it('disabledプロパティが正しく動作する', () => {
      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} disabled={true} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      expect(button).toBeDisabled();
    });

    it('エラーメッセージを閉じることができる', async () => {
      mockClipboard.readText.mockResolvedValue('');

      renderWithProviders(<CameraPasteOCR onTextDetected={mockOnTextDetected} />);
      
      const button = screen.getByTestId('camera-paste-ocr-button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('camera-paste-ocr-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('クリップボードが空です');
      });

      // エラーメッセージを閉じる
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('クリップボードが空です')).not.toBeInTheDocument();
      });
    });
  });
});