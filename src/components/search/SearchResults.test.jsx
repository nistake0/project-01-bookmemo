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

describe('SearchResults', () => {
  beforeEach(() => {
    mockOnResultClick.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <SearchResults
          results={[]}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <SearchResults
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('ローディング中はCircularProgressが表示される', () => {
      renderWithTheme(
        <SearchResults
          loading={true}
          onResultClick={mockOnResultClick}
        />
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
        <SearchResults
          results={[]}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });

  describe('統合検索結果表示', () => {
    const mockBooks = [
      {
        id: 'book-1',
        type: 'book',
        title: 'テスト本1',
        author: 'テスト著者1',
        status: 'tsundoku',
        tags: ['タグ1', 'タグ2'],
        updatedAt: { toDate: () => new Date('2024-01-01') }
      },
      {
        id: 'book-2',
        type: 'book',
        title: 'テスト本2',
        author: 'テスト著者2',
        status: 'finished',
        tags: ['タグ3'],
        updatedAt: { toDate: () => new Date('2024-01-02') }
      }
    ];

    const mockMemos = [
      {
        id: 'memo-1',
        type: 'memo',
        bookId: 'book-1',
        bookTitle: 'テスト本1',
        page: 123,
        text: 'テストメモ内容1',
        comment: 'テストコメント1',
        tags: ['タグ1'],
        createdAt: { toDate: () => new Date('2024-01-01') }
      },
      {
        id: 'memo-2',
        type: 'memo',
        bookId: 'book-2',
        bookTitle: 'テスト本2',
        page: 456,
        text: 'テストメモ内容2',
        comment: 'テストコメント2',
        tags: ['タグ2'],
        createdAt: { toDate: () => new Date('2024-01-02') }
      }
    ];

    test('検索結果統計が正しく表示される', () => {
      const results = [...mockBooks, ...mockMemos];
      renderWithTheme(
        <SearchResults
          results={results}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('検索結果 (4件)')).toBeInTheDocument();
      expect(screen.getByText('📚 書籍: 2件, 📝 メモ: 2件')).toBeInTheDocument();
    });

    test('書籍の検索結果が表示される', () => {
      renderWithTheme(
        <SearchResults
          results={mockBooks}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('テスト本1')).toBeInTheDocument();
      expect(screen.getByText('テスト本2')).toBeInTheDocument();
      expect(screen.getByText('テスト著者1')).toBeInTheDocument();
      expect(screen.getByText('テスト著者2')).toBeInTheDocument();
    });

    test('メモの検索結果が表示される', () => {
      renderWithTheme(
        <SearchResults
          results={mockMemos}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('テスト本1 - ページ123')).toBeInTheDocument();
      expect(screen.getByText('テスト本2 - ページ456')).toBeInTheDocument();
      expect(screen.getByText('テストメモ内容1')).toBeInTheDocument();
      expect(screen.getByText('テストメモ内容2')).toBeInTheDocument();
    });

    test('書籍とメモの混合結果が表示される', () => {
      const results = [mockBooks[0], mockMemos[0]];
      renderWithTheme(
        <SearchResults
          results={results}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
      expect(screen.getByText('📚 書籍: 1件, 📝 メモ: 1件')).toBeInTheDocument();
      expect(screen.getByText('テスト本1')).toBeInTheDocument();
      expect(screen.getByText('テスト本1 - ページ123')).toBeInTheDocument();
    });
  });

  describe('クリック機能', () => {
    test('書籍をクリックできる', () => {
      const mockBook = {
        id: 'book-1',
        type: 'book',
        title: 'テスト本',
        author: 'テスト著者',
        status: 'tsundoku',
        tags: [],
        updatedAt: { toDate: () => new Date('2024-01-01') }
      };

      renderWithTheme(
        <SearchResults
          results={[mockBook]}
          onResultClick={mockOnResultClick}
        />
      );

      const bookCard = screen.getByTestId('book-result-book-1');
      fireEvent.click(bookCard);

      expect(mockOnResultClick).toHaveBeenCalledWith('book', 'book-1');
    });

    test('メモをクリックできる', () => {
      const mockMemo = {
        id: 'memo-1',
        type: 'memo',
        bookId: 'book-1',
        bookTitle: 'テスト本',
        page: 123,
        text: 'テストメモ',
        tags: [],
        createdAt: { toDate: () => new Date('2024-01-01') }
      };

      renderWithTheme(
        <SearchResults
          results={[mockMemo]}
          onResultClick={mockOnResultClick}
        />
      );

      const memoCard = screen.getByTestId('memo-result-memo-1');
      fireEvent.click(memoCard);

      expect(mockOnResultClick).toHaveBeenCalledWith('memo', 'book-1', 'memo-1');
    });
  });

  describe('視覚的区別', () => {
    test('書籍とメモが視覚的に区別される', () => {
      const mockBook = {
        id: 'book-1',
        type: 'book',
        title: 'テスト本',
        author: 'テスト著者',
        status: 'tsundoku',
        tags: [],
        updatedAt: { toDate: () => new Date('2024-01-01') }
      };

      const mockMemo = {
        id: 'memo-1',
        type: 'memo',
        bookId: 'book-1',
        bookTitle: 'テスト本',
        page: 123,
        text: 'テストメモ',
        tags: [],
        createdAt: { toDate: () => new Date('2024-01-01') }
      };

      renderWithTheme(
        <SearchResults
          results={[mockBook, mockMemo]}
          onResultClick={mockOnResultClick}
        />
      );

      // 書籍アイコンとメモアイコンの確認
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    test('onResultClickが未定義でもエラーが発生しない', () => {
      const mockBook = {
        id: 'book-1',
        type: 'book',
        title: 'テスト本',
        author: 'テスト著者',
        status: 'tsundoku',
        tags: [],
        updatedAt: { toDate: () => new Date('2024-01-01') }
      };

      expect(() => {
        renderWithTheme(
          <SearchResults
            results={[mockBook]}
          />
        );
      }).not.toThrow();
    });

    test('resultsが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <SearchResults
            onResultClick={mockOnResultClick}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('検索条件を設定して検索を実行してください。')).toBeInTheDocument();
    });
  });
}); 