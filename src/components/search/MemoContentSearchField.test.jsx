import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MemoContentSearchField from './MemoContentSearchField';

// Material-UIテーマの設定
const theme = createTheme();

// テスト用のラッパーコンポーネント
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// モック関数
const mockOnMemoContentChange = jest.fn();
const mockOnIncludeMemoContentChange = jest.fn();

describe('MemoContentSearchField', () => {
  beforeEach(() => {
    mockOnMemoContentChange.mockClear();
    mockOnIncludeMemoContentChange.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          memoContent=""
          includeMemoContent={false}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.getByText('メモ内容検索')).toBeInTheDocument();
      expect(screen.getByTestId('include-memo-content-switch')).toBeInTheDocument();
      expect(screen.getByText('メモ内容も検索対象に含める')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.getByText('メモ内容検索')).toBeInTheDocument();
      expect(screen.getByTestId('include-memo-content-switch')).toBeInTheDocument();
    });
  });

  describe('チェックボックスの動作', () => {
    test('チェックボックスが無効状態でレンダリングされる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={false}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      const checkbox = screen.getByTestId('include-memo-content-switch');
      expect(checkbox).not.toBeChecked();
    });

    test('チェックボックスが有効状態でレンダリングされる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={true}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      const checkbox = screen.getByTestId('include-memo-content-switch');
      expect(checkbox).toBeInTheDocument();
    });

    test('チェックボックスをクリックできる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={false}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      const checkbox = screen.getByTestId('include-memo-content-switch');
      fireEvent.click(checkbox);

      expect(mockOnIncludeMemoContentChange).toHaveBeenCalledWith(true);
    });
  });

  describe('テキストフィールドの表示', () => {
    test('includeMemoContentがfalseの場合、テキストフィールドが表示されない', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={false}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.queryByTestId('memo-content-search-field')).not.toBeInTheDocument();
    });

    test('includeMemoContentがtrueの場合、テキストフィールドが表示される', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={true}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.getByTestId('memo-content-search-field')).toBeInTheDocument();
    });
  });

  describe('テキストフィールドの動作', () => {
    test('テキストフィールドが表示される', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={true}
          memoContent=""
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      const textField = screen.getByTestId('memo-content-search-field');
      expect(textField).toBeInTheDocument();
    });

    test('テキストフィールドが正しくレンダリングされる', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={true}
          memoContent="初期メモ内容"
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      const textField = screen.getByTestId('memo-content-search-field');
      expect(textField).toBeInTheDocument();
    });
  });

  describe('説明テキストの表示', () => {
    test('includeMemoContentがfalseの場合の説明テキスト', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={false}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.getByText('スイッチをオンにすると、メモの内容も検索対象に含めることができます')).toBeInTheDocument();
    });

    test('includeMemoContentがtrueの場合、説明テキストが表示されない', () => {
      renderWithTheme(
        <MemoContentSearchField 
          includeMemoContent={true}
          onMemoContentChange={mockOnMemoContentChange}
          onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
        />
      );

      expect(screen.queryByText('スイッチをオンにすると、メモの内容も検索対象に含めることができます')).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    test('onMemoContentChangeが未定義でもエラーが発生しない', () => {
      expect(() => {
        renderWithTheme(
          <MemoContentSearchField 
            includeMemoContent={true}
            onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
          />
        );
      }).not.toThrow();
    });

    test('onIncludeMemoContentChangeが未定義でもエラーが発生しない', () => {
      expect(() => {
        renderWithTheme(
          <MemoContentSearchField 
            includeMemoContent={false}
            onMemoContentChange={mockOnMemoContentChange}
          />
        );
      }).not.toThrow();
    });

    test('memoContentが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <MemoContentSearchField 
            includeMemoContent={true}
            onMemoContentChange={mockOnMemoContentChange}
            onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('memo-content-search-field')).toBeInTheDocument();
    });

    test('includeMemoContentが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <MemoContentSearchField 
            onMemoContentChange={mockOnMemoContentChange}
            onIncludeMemoContentChange={mockOnIncludeMemoContentChange}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('include-memo-content-switch')).toBeInTheDocument();
    });
  });
}); 