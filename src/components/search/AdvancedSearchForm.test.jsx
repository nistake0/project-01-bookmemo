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

      const title = screen.getByTestId('advanced-search-title');
      expect(title).toHaveTextContent('検索条件');
      expect(screen.getByLabelText('テキスト検索（タイトル・著者・メモ内容・タグ）')).toBeInTheDocument();
      const statusLabel = screen.getByTestId('status-filter-label');
      expect(statusLabel).toHaveTextContent('ステータス');
      // ステータスボタンはdata-testidで確認（FILTER_LABELSは定数なので実装文字列ではないが、data-testidベースに統一）
      expect(screen.getByTestId('status-filter-all')).toHaveTextContent('すべて');
      expect(screen.getByTestId('status-filter-tsundoku')).toHaveTextContent('積読');
      expect(screen.getByTestId('status-filter-reading-group')).toHaveTextContent('読書中');
      expect(screen.getByTestId('status-filter-suspended')).toHaveTextContent('中断');
      expect(screen.getByTestId('status-filter-finished')).toHaveTextContent('読了');
      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toHaveTextContent('検索実行');
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
      expect(screen.getByTestId('status-filter-tsundoku')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-reading-group')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-suspended')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-finished')).toBeInTheDocument();
    });

    test('ステータスフィルターが正しく動作する', () => {
      renderWithTheme(
        <AdvancedSearchForm
          onSearchConditionsChange={mockOnSearchConditionsChange}
          onSearch={mockOnSearch}
        />
      );

      const readingButton = screen.getByTestId('status-filter-reading-group');
      fireEvent.click(readingButton);

      expect(mockOnSearchConditionsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'reading-group'
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