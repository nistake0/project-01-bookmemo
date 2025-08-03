import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DateRangeSelector from './DateRangeSelector';

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
const mockOnChange = jest.fn();

describe('DateRangeSelector', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'none' }} onChange={mockOnChange} />
      );

      expect(screen.getByText('読了日時')).toBeInTheDocument();
      expect(screen.getByTestId('date-range-type-select')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'none' }} onChange={mockOnChange} />
      );

      const typeSelect = screen.getByTestId('date-range-type-select');
      expect(typeSelect).toBeInTheDocument();
    });

    test('初期値が正しく設定される', () => {
      const initialValue = { type: 'year', year: 2023 };
      renderWithTheme(
        <DateRangeSelector value={initialValue} onChange={mockOnChange} />
      );

      const typeSelect = screen.getByTestId('date-range-type-select');
      expect(typeSelect).toBeInTheDocument();
    });
  });

  describe('条件付きレンダリング', () => {
    test('年別選択時に年選択が表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'year' }} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('year-select')).toBeInTheDocument();
    });

    test('年月別選択時に月選択が表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'month' }} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('year-select')).toBeInTheDocument();
      expect(screen.getByTestId('month-select')).toBeInTheDocument();
    });

    test('四半期別選択時に四半期選択が表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'quarter' }} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('year-select')).toBeInTheDocument();
      expect(screen.getByTestId('quarter-select')).toBeInTheDocument();
    });

    test('カスタム期間選択時に日付入力が表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'custom' }} onChange={mockOnChange} />
      );

      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
    });
  });

  describe('カスタム期間選択機能', () => {
    test('開始日を変更できる', async () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'custom' }} onChange={mockOnChange} />
      );

      const startDateInput = screen.getByTestId('start-date-input');
      fireEvent.input(startDateInput, { target: { value: '2024-01-01' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'custom', startDate: '2024-01-01' })
        );
      });
    });

    test('終了日を変更できる', async () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'custom' }} onChange={mockOnChange} />
      );

      const endDateInput = screen.getByTestId('end-date-input');
      fireEvent.input(endDateInput, { target: { value: '2024-12-31' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'custom', endDate: '2024-12-31' })
        );
      });
    });
  });

  describe('説明テキストの表示', () => {
    test('年別選択時に説明テキストが表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'year', year: 2024 }} onChange={mockOnChange} />
      );

      expect(screen.getByText('2024年に読了した本を検索します')).toBeInTheDocument();
    });

    test('年月別選択時に説明テキストが表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'month', year: 2024, month: 3 }} onChange={mockOnChange} />
      );

      expect(screen.getByText('2024年3月に読了した本を検索します')).toBeInTheDocument();
    });

    test('四半期別選択時に説明テキストが表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'quarter', year: 2024, quarter: 2 }} onChange={mockOnChange} />
      );

      expect(screen.getByText('2024年第2四半期に読了した本を検索します')).toBeInTheDocument();
    });

    test('カスタム期間選択時に説明テキストが表示される', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'custom' }} onChange={mockOnChange} />
      );

      expect(screen.getByText('指定した期間に読了した本を検索します')).toBeInTheDocument();
    });

    test('指定なし選択時は説明テキストが表示されない', () => {
      renderWithTheme(
        <DateRangeSelector value={{ type: 'none' }} onChange={mockOnChange} />
      );

      expect(screen.queryByText(/読了した本を検索します/)).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    test('onChangeが未定義でもエラーが発生しない', () => {
      expect(() => {
        renderWithTheme(
          <DateRangeSelector value={{ type: 'none' }} />
        );
      }).not.toThrow();
    });

    test('valueが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <DateRangeSelector onChange={mockOnChange} />
        );
      }).not.toThrow();

      expect(screen.getByTestId('date-range-type-select')).toBeInTheDocument();
    });
  });
}); 