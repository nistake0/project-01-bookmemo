import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdvancedSearchForm from './AdvancedSearchForm';

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
const mockOnSearchConditionsChange = jest.fn();
const mockOnSearch = jest.fn();

describe('AdvancedSearchForm', () => {
  beforeEach(() => {
    mockOnSearchConditionsChange.mockClear();
    mockOnSearch.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('検索条件')).toBeInTheDocument();
      expect(screen.getByLabelText('テキスト検索（タイトル・著者・メモ内容・タグ）')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('すべて')).toBeInTheDocument();
      expect(screen.getByText('読書中')).toBeInTheDocument();
      expect(screen.getByText('読了')).toBeInTheDocument();
      expect(screen.getByText('積読')).toBeInTheDocument();
      expect(screen.getByText('再読中')).toBeInTheDocument();
      expect(screen.getByText('検索実行')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      const textField = screen.getByTestId('text-search-field');
      expect(textField).toBeInTheDocument();
    });
  });

  describe('統合テキスト検索', () => {
    test('テキスト検索フィールドが正しく表示される', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('text-search-field')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('検索したいキーワードを入力')).toBeInTheDocument();
    });

    test('テキスト検索フィールドの値が正しく設定される', () => {
      renderWithTheme(
        <AdvancedSearchForm
          searchConditions={{ text: 'テスト検索' }}
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      const textField = screen.getByTestId('text-search-field');
      expect(textField).toBeInTheDocument();
    });
  });

  describe('ステータスフィルター', () => {
    test('ステータスフィルターボタンが正しく表示される', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('status-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-reading')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-finished')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-tsundoku')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-re-reading')).toBeInTheDocument();
    });

    test('ステータスフィルターが正しく動作する', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      const readingButton = screen.getByTestId('status-filter-reading');
      fireEvent.click(readingButton);

      expect(mockOnSearchConditionsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'reading'
        })
      );
    });
  });

  describe('検索実行', () => {
    test('検索ボタンが正しく表示される', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByText('検索実行')).toBeInTheDocument();
    });

    test('検索ボタンクリック時にonSearchが呼ばれる', () => {
      const searchConditions = {
        text: 'テスト',
        status: 'all',
        dateRange: { type: 'none' },
        selectedTags: []
      };

      renderWithTheme(
        <AdvancedSearchForm
          searchConditions={searchConditions}
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(searchConditions);
    });
  });

  describe('エラーハンドリング', () => {
    test('searchConditionsが未定義でも正常にレンダリングされる', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByText('検索条件')).toBeInTheDocument();
      expect(screen.getByTestId('text-search-field')).toBeInTheDocument();
    });

    test('コールバック関数が未定義でも正常にレンダリングされる', () => {
      renderWithTheme(
        <AdvancedSearchForm />
      );

      expect(screen.getByText('検索条件')).toBeInTheDocument();
      expect(screen.getByTestId('text-search-field')).toBeInTheDocument();
    });
  });
}); 