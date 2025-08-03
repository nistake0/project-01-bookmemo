import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SearchResults from './SearchResults';

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
const mockOnResultClick = jest.fn();

// useAuthのモック
jest.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false
  })
}));

describe('SearchResults', () => {
  beforeEach(() => {
    mockOnResultClick.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <SearchResults results={[]} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <SearchResults onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('ローディング中はCircularProgressが表示される', () => {
      renderWithTheme(
        <SearchResults loading={true} results={[]} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('検索結果なし', () => {
    test('検索クエリがある場合のメッセージ', () => {
      renderWithTheme(
        <SearchResults 
          results={[]} 
          searchQuery="テスト" 
          onResultClick={mockOnResultClick} 
        />
      );

      expect(screen.getByText('「テスト」に一致する結果が見つかりませんでした。')).toBeInTheDocument();
    });

    test('検索クエリがない場合のメッセージ', () => {
      renderWithTheme(
        <SearchResults results={[]} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });

  describe('本の検索結果表示', () => {
    const mockBookResults = [
      {
        id: 'book-1',
        type: 'book',
        title: 'テスト本1',
        author: 'テスト著者1',
        publisher: 'テスト出版社',
        publishedDate: '2024-01-01',
        status: 'reading',
        tags: ['小説', '名作'],
        coverImageUrl: 'https://example.com/cover1.jpg'
      },
      {
        id: 'book-2',
        type: 'book',
        title: 'テスト本2',
        author: 'テスト著者2',
        publisher: 'テスト出版社2',
        publishedDate: '2024-02-01',
        status: 'finished',
        tags: ['技術書'],
        coverImageUrl: null
      }
    ];

    test('本の検索結果が表示される', () => {
      renderWithTheme(
        <SearchResults results={mockBookResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
      expect(screen.getByText('本 (2件)')).toBeInTheDocument();
      expect(screen.getByText('本: 2件, メモ: 0件')).toBeInTheDocument();
      expect(screen.getByText('テスト本1')).toBeInTheDocument();
      expect(screen.getByText('テスト本2')).toBeInTheDocument();
    });

    test('本の詳細情報が表示される', () => {
      renderWithTheme(
        <SearchResults results={mockBookResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('テスト著者1')).toBeInTheDocument();
      expect(screen.getByText('テスト出版社 • 2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('ステータス: 読書中')).toBeInTheDocument();
      expect(screen.getByText('ステータス: 読了')).toBeInTheDocument();
    });

    test('本のタグが表示される', () => {
      renderWithTheme(
        <SearchResults results={mockBookResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('小説')).toBeInTheDocument();
      expect(screen.getByText('名作')).toBeInTheDocument();
      expect(screen.getByText('技術書')).toBeInTheDocument();
    });

    test('本をクリックできる', () => {
      renderWithTheme(
        <SearchResults results={mockBookResults} onResultClick={mockOnResultClick} />
      );

      const bookCard = screen.getByTestId('book-result-book-1');
      fireEvent.click(bookCard);

      expect(mockOnResultClick).toHaveBeenCalledWith('book', 'book-1');
    });
  });

  describe('メモの検索結果表示', () => {
    const mockMemoResults = [
      {
        id: 'memo-1',
        type: 'memo',
        bookId: 'book-1',
        bookTitle: 'テスト本1',
        page: 123,
        text: 'これはテストメモのテキストです。',
        comment: 'これはテストメモのコメントです。',
        tags: ['名言', '感想']
      },
      {
        id: 'memo-2',
        type: 'memo',
        bookId: 'book-2',
        bookTitle: 'テスト本2',
        page: 456,
        text: 'これは2番目のテストメモのテキストです。',
        comment: null,
        tags: []
      }
    ];

    test('メモの検索結果が表示される', () => {
      renderWithTheme(
        <SearchResults results={mockMemoResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
      expect(screen.getByText('本: 0件, メモ: 2件')).toBeInTheDocument();
      expect(screen.getByText('メモ (2件)')).toBeInTheDocument();
      expect(screen.getByText('テスト本1')).toBeInTheDocument();
      expect(screen.getByText('テスト本2')).toBeInTheDocument();
    });

    test('メモの詳細情報が表示される', () => {
      renderWithTheme(
        <SearchResults results={mockMemoResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('ページ: 123')).toBeInTheDocument();
      expect(screen.getByText('ページ: 456')).toBeInTheDocument();
      expect(screen.getByText('これはテストメモのテキストです。')).toBeInTheDocument();
      expect(screen.getByText('これはテストメモのコメントです。')).toBeInTheDocument();
    });

    test('メモのタグが表示される', () => {
      renderWithTheme(
        <SearchResults results={mockMemoResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('名言')).toBeInTheDocument();
      expect(screen.getByText('感想')).toBeInTheDocument();
    });

    test('メモをクリックできる', () => {
      renderWithTheme(
        <SearchResults results={mockMemoResults} onResultClick={mockOnResultClick} />
      );

      const memoCard = screen.getByTestId('memo-result-memo-1');
      fireEvent.click(memoCard);

      expect(mockOnResultClick).toHaveBeenCalledWith('memo', 'book-1', 'memo-1');
    });
  });

  describe('本とメモの混合結果', () => {
    const mockMixedResults = [
      {
        id: 'book-1',
        type: 'book',
        title: 'テスト本1',
        author: 'テスト著者1',
        publisher: 'テスト出版社',
        publishedDate: '2024-01-01',
        status: 'reading',
        tags: ['小説']
      },
      {
        id: 'memo-1',
        type: 'memo',
        bookId: 'book-1',
        bookTitle: 'テスト本1',
        page: 123,
        text: 'テストメモ',
        comment: 'テストコメント',
        tags: ['名言']
      }
    ];

    test('本とメモの両方が表示される', () => {
      renderWithTheme(
        <SearchResults results={mockMixedResults} onResultClick={mockOnResultClick} />
      );

      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
      expect(screen.getByText('本: 1件, メモ: 1件')).toBeInTheDocument();
      expect(screen.getByText('本 (1件)')).toBeInTheDocument();
      expect(screen.getByText('メモ (1件)')).toBeInTheDocument();
      expect(screen.getAllByText('テスト本1')).toHaveLength(2);
      expect(screen.getByText('ページ: 123')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    test('onResultClickが未定義でもエラーが発生しない', () => {
      expect(() => {
        renderWithTheme(
          <SearchResults results={[]} />
        );
      }).not.toThrow();
    });

    test('resultsが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <SearchResults onResultClick={mockOnResultClick} />
        );
      }).not.toThrow();

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });
}); 