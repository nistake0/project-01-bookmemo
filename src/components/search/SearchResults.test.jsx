import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SearchResults from './SearchResults';

// react-router-domのモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

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

      const emptyMessage = screen.getByTestId('search-results-empty-message');
      expect(emptyMessage).toHaveTextContent('検索条件を設定して検索を実行してください。');
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <SearchResults
          onResultClick={mockOnResultClick}
        />
      );

      const emptyMessage = screen.getByTestId('search-results-empty-message');
      expect(emptyMessage).toHaveTextContent('検索条件を設定して検索を実行してください。');
    });
  });

  describe('ローディング状態', () => {
    test('ローディング中はLoadingIndicatorが表示される', () => {
      renderWithTheme(
        <SearchResults
          loading={true}
          onResultClick={mockOnResultClick}
        />
      );

      expect(screen.getByTestId('search-results-loading')).toBeInTheDocument();
      expect(screen.getByText('検索中...')).toBeInTheDocument();
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

      const emptyMessage = screen.getByTestId('search-results-empty-message');
      expect(emptyMessage).toHaveTextContent('「テスト」に一致する結果が見つかりませんでした。');
    });

    test('検索クエリがない場合のメッセージ', () => {
      renderWithTheme(
        <SearchResults
          results={[]}
          onResultClick={mockOnResultClick}
        />
      );

      const emptyMessage = screen.getByTestId('search-results-empty-message');
      expect(emptyMessage).toHaveTextContent('検索条件を設定して検索を実行してください。');
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

      expect(screen.getByText(/テスト本1 - ページ123/)).toBeInTheDocument();
      expect(screen.getByText(/テスト本2 - ページ456/)).toBeInTheDocument();
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
      expect(screen.getByText(/テスト本1 - ページ123/)).toBeInTheDocument();
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

      // 書籍アイコンとメモアイコンの確認（📚は書籍カード、📝はメモカードまたは統計に含まれる）
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getAllByText(/📝/).length).toBeGreaterThanOrEqual(1);
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

      const emptyMessage = screen.getByTestId('search-results-empty-message');
      expect(emptyMessage).toHaveTextContent('検索条件を設定して検索を実行してください。');
    });
  });

  describe('props validation (Phase 1 追加)', () => {
    beforeEach(() => {
      mockNavigate.mockClear();
    });

    describe('デフォルト動作 (Phase 3-A 追加)', () => {
      test('onResultClickが未定義の場合、書籍クリックで書籍詳細に遷移する', () => {
        const mockResults = [
          { 
            id: 'book1', 
            type: 'book', 
            title: 'テスト本',
            author: 'テスト著者',
            status: 'reading',
            tags: [],
            updatedAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <BrowserRouter>
            <SearchResults results={mockResults} />
          </BrowserRouter>
        );
        
        fireEvent.click(screen.getByTestId('book-result-book1'));
        
        // デフォルト動作: navigateが呼ばれる
        expect(mockNavigate).toHaveBeenCalledWith('/book/book1');
      });
      
      test('onResultClickが未定義の場合、メモクリックで書籍詳細+クエリパラメータに遷移する', () => {
        const mockResults = [
          { 
            id: 'memo1', 
            type: 'memo', 
            bookId: 'book1',
            bookTitle: 'テスト本',
            text: 'テストメモ',
            tags: [],
            createdAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <BrowserRouter>
            <SearchResults results={mockResults} />
          </BrowserRouter>
        );
        
        fireEvent.click(screen.getByTestId('memo-result-memo1'));
        
        // デフォルト動作: 書籍詳細 + memoクエリパラメータ
        expect(mockNavigate).toHaveBeenCalledWith('/book/book1?memo=memo1');
      });
      
      test('onResultClickが定義されている場合、デフォルト動作は実行されない', () => {
        const mockOnResultClickLocal = jest.fn();
        const mockResults = [
          { 
            id: 'book1', 
            type: 'book', 
            title: 'テスト本',
            author: 'テスト著者',
            status: 'reading',
            tags: [],
            updatedAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <BrowserRouter>
            <SearchResults 
              results={mockResults} 
              onResultClick={mockOnResultClickLocal}
            />
          </BrowserRouter>
        );
        
        fireEvent.click(screen.getByTestId('book-result-book1'));
        
        // カスタムハンドラーが呼ばれる
        expect(mockOnResultClickLocal).toHaveBeenCalledWith('book', 'book1');
        
        // デフォルト動作（navigate）は呼ばれない
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    describe('onResultClick propの検証', () => {
      test('onResultClickが渡された場合、クリック時に実行される', () => {
        const mockOnResultClickLocal = jest.fn();
        const mockResults = [
          { 
            id: 'book1', 
            type: 'book', 
            title: 'テスト本',
            author: 'テスト著者',
            status: 'reading',
            tags: [],
            updatedAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <SearchResults 
            results={mockResults}
            onResultClick={mockOnResultClickLocal}
          />
        );
        
        fireEvent.click(screen.getByTestId('book-result-book1'));
        expect(mockOnResultClickLocal).toHaveBeenCalledWith('book', 'book1');
        expect(mockNavigate).not.toHaveBeenCalled(); // デフォルト動作は実行されない
      });
      
      test('onResultClickが未定義の場合、エラーが出ない（現在の動作）', () => {
        const mockResults = [
          { 
            id: 'book1', 
            type: 'book', 
            title: 'テスト本',
            author: 'テスト著者',
            status: 'reading',
            tags: [],
            updatedAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        // エラーが出ないことを確認
        expect(() => {
          renderWithTheme(
            <BrowserRouter>
              <SearchResults 
                results={mockResults}
                // onResultClickを渡さない
              />
            </BrowserRouter>
          );
        }).not.toThrow();
        
        // クリックしてもエラーが出ない
        expect(() => {
          fireEvent.click(screen.getByTestId('book-result-book1'));
        }).not.toThrow();
      });
      
      test('メモクリック時、onResultClickが未定義でもエラーが出ない', () => {
        const mockResults = [
          { 
            id: 'memo1', 
            type: 'memo', 
            bookId: 'book1',
            bookTitle: 'テスト本',
            text: 'テストメモ',
            tags: [],
            createdAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <BrowserRouter>
            <SearchResults 
              results={mockResults}
              // onResultClickを渡さない
            />
          </BrowserRouter>
        );
        
        expect(() => {
          fireEvent.click(screen.getByTestId('memo-result-memo1'));
        }).not.toThrow();
      });
    });
    
    describe('results propの検証', () => {
      test('resultsが空配列の場合、メッセージを表示', () => {
        renderWithTheme(
          <SearchResults 
            results={[]} 
            onResultClick={jest.fn()} 
          />
        );
        expect(screen.getByText(/検索条件を設定して/)).toBeInTheDocument();
      });
      
      test('resultsがundefinedの場合、エラーが出ない', () => {
        expect(() => {
          renderWithTheme(
            <SearchResults 
              results={undefined} 
              onResultClick={jest.fn()} 
            />
          );
        }).not.toThrow();
      });
      
      test('resultsが混在している場合、書籍とメモの両方を表示', () => {
        const mockResults = [
          { 
            id: 'book1', 
            type: 'book', 
            title: 'テスト本',
            author: 'テスト著者',
            status: 'reading',
            tags: [],
            updatedAt: { toDate: () => new Date('2024-01-01') }
          },
          { 
            id: 'memo1', 
            type: 'memo', 
            bookId: 'book1',
            bookTitle: 'テスト本',
            text: 'テストメモ',
            tags: [],
            createdAt: { toDate: () => new Date('2024-01-01') }
          }
        ];
        
        renderWithTheme(
          <SearchResults 
            results={mockResults} 
            onResultClick={jest.fn()} 
          />
        );
        
        expect(screen.getByText(/書籍: 1件/)).toBeInTheDocument();
        expect(screen.getByText(/メモ: 1件/)).toBeInTheDocument();
      });
    });
  });
}); 