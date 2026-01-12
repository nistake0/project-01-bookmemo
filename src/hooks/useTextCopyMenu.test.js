import { renderHook, act } from '@testing-library/react';
import { useTextCopyMenu } from './useTextCopyMenu';

// navigator.clipboardのモック
const mockClipboard = {
  writeText: jest.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true,
});

// window.openのモック
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('useTextCopyMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockClear();
    mockWindowOpen.mockClear();
  });

  describe('メニューの開閉', () => {
    it('handleClickでメニューが開く', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      act(() => {
        result.current.handleClick(mockEvent, 'テストテキスト');
      });

      expect(result.current.menuProps.open).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('handleContextMenuでメニューが開く', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      act(() => {
        result.current.handleContextMenu(mockEvent, 'テストテキスト');
      });

      expect(result.current.menuProps.open).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('handleCloseでメニューが閉じる', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テストテキスト');
      });
      expect(result.current.menuProps.open).toBe(true);

      // メニューを閉じる
      act(() => {
        result.current.menuProps.onClose();
      });
      expect(result.current.menuProps.open).toBe(false);
    });
  });

  describe('コピー機能', () => {
    it('コピーが成功する', async () => {
      mockClipboard.writeText.mockResolvedValue();
      const mockShowSnackbar = jest.fn();

      const { result } = renderHook(() =>
        useTextCopyMenu({ showSnackbar: mockShowSnackbar })
      );
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テストテキスト');
      });

      // コピーを実行
      await act(async () => {
        await result.current.handleCopy();
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('テストテキスト');
      expect(mockShowSnackbar).toHaveBeenCalledWith('コピーしました', 'success');
      expect(result.current.menuProps.open).toBe(false);
    });

    it('コピーが失敗する', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));
      const mockShowSnackbar = jest.fn();

      const { result } = renderHook(() =>
        useTextCopyMenu({ showSnackbar: mockShowSnackbar })
      );
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テストテキスト');
      });

      // コピーを実行
      await act(async () => {
        await result.current.handleCopy();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith('コピーに失敗しました', 'error');
    });

    it('showSnackbarが未指定でも動作する', async () => {
      mockClipboard.writeText.mockResolvedValue();

      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テストテキスト');
      });

      // コピーを実行（エラーが発生しないことを確認）
      await act(async () => {
        await result.current.handleCopy();
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('テストテキスト');
    });
  });

  describe('外部検索機能', () => {
    it('Google検索URLが正しく生成される', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テスト書籍');
      });

      // 外部検索を実行
      act(() => {
        result.current.handleExternalSearch('google');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search?q='),
        '_blank',
        'noopener,noreferrer'
      );
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search?q='),
        '_blank',
        'noopener,noreferrer'
      );
      // URLエンコードされた文字列が含まれていることを確認
      const calls = mockWindowOpen.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(decodeURIComponent(lastCall[0])).toContain('テスト書籍');
      expect(result.current.menuProps.open).toBe(false);
    });

    it('Amazon検索URLが正しく生成される', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テスト書籍');
      });

      // 外部検索を実行
      act(() => {
        result.current.handleExternalSearch('amazon');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('amazon.co.jp/s?k='),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('書籍情報がある場合、タイトルを選択したときはタイトル + 著者で検索', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };
      const mockBook = {
        title: 'テスト書籍',
        author: 'テスト著者',
      };

      // メニューを開く（タイトルを選択）
      act(() => {
        result.current.handleClick(mockEvent, 'テスト書籍', mockBook);
      });

      // 外部検索を実行
      act(() => {
        result.current.handleExternalSearch('google');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search?q='),
        '_blank',
        'noopener,noreferrer'
      );
      // URLエンコードされた文字列が含まれていることを確認
      const calls = mockWindowOpen.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(decodeURIComponent(lastCall[0])).toContain('テスト書籍 テスト著者');
    });

    it('著者名を選択した場合は著者名のみで検索', () => {
      const { result } = renderHook(() => useTextCopyMenu());
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };
      const mockBook = {
        title: 'テスト書籍',
        author: 'テスト著者',
      };

      // メニューを開く（著者名を選択）
      act(() => {
        result.current.handleClick(mockEvent, 'テスト著者', mockBook);
      });

      // 外部検索を実行
      act(() => {
        result.current.handleExternalSearch('google');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search?q='),
        '_blank',
        'noopener,noreferrer'
      );
      // URLエンコードされた文字列が含まれていることを確認
      const calls = mockWindowOpen.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(decodeURIComponent(lastCall[0])).toContain('テスト著者');
      // タイトルが含まれていないことを確認
      expect(decodeURIComponent(lastCall[0])).not.toContain('テスト書籍');
    });

    it('enableExternalSearchがfalseの場合は外部検索が無効', () => {
      const { result } = renderHook(() =>
        useTextCopyMenu({ enableExternalSearch: false })
      );
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: mockElement,
      };

      // メニューを開く
      act(() => {
        result.current.handleClick(mockEvent, 'テスト書籍');
      });

      // 外部検索を実行
      act(() => {
        result.current.handleExternalSearch('google');
      });

      // window.openが呼ばれないことを確認
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });
});
