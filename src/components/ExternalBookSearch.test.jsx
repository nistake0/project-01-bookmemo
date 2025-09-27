import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ExternalBookSearch from './ExternalBookSearch';

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
const mockOnBookSelect = jest.fn();
const mockOnCancel = jest.fn();

// useExternalBookSearchフックのモック
jest.mock('../hooks/useExternalBookSearch', () => ({
  useExternalBookSearch: jest.fn()
}));

jest.mock('../hooks/useBookDuplicateCheck', () => ({
  useBookDuplicateCheck: jest.fn()
}));

import { useExternalBookSearch } from '../hooks/useExternalBookSearch';
import { useBookDuplicateCheck } from '../hooks/useBookDuplicateCheck';

describe('ExternalBookSearch', () => {
  beforeEach(() => {
    mockOnBookSelect.mockClear();
    mockOnCancel.mockClear();
    
    // デフォルトのモック実装
    useExternalBookSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
      searchBooks: jest.fn(),
      clearSearchResults: jest.fn(),
      clearError: jest.fn(),
      // 検索履歴関連のモック
      searchHistory: [],
      loadSearchHistory: jest.fn(),
      removeFromSearchHistory: jest.fn(),
      clearSearchHistory: jest.fn(),
      // フィルタリング関連のモック
      filteredResults: [
        {
          id: 'book-1',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          description: 'JavaScriptの入門書です'
        }
      ],
      filters: {
        author: '',
        publisher: '',
        yearFrom: '',
        yearTo: ''
      },
      updateFilters: jest.fn(),
      clearFilters: jest.fn()
    });

    // useBookDuplicateCheckのモック実装
    useBookDuplicateCheck.mockReturnValue({
      checkDuplicate: jest.fn()
    });
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('🔍 外部検索モード')).toBeInTheDocument();
      expect(screen.getByTestId('search-type-title')).toBeInTheDocument();
      expect(screen.getByTestId('search-query-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('デフォルトでタイトル検索が選択される', () => {
      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      const toggleButtons = screen.getAllByRole('button');
      const titleButton = toggleButtons.find(button => 
        button.textContent === 'タイトル'
      );
      expect(titleButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('検索タイプの切り替え', () => {
    it('検索タイプを切り替えできる', () => {
      const mockClearSearchResults = jest.fn();
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: mockClearSearchResults,
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      // 著者検索に切り替え
      fireEvent.click(screen.getByText('著者'));
      
      expect(mockClearSearchResults).toHaveBeenCalled();
    });

    it('検索タイプ切り替え時に結果がクリアされる', () => {
      const mockClearSearchResults = jest.fn();
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: mockClearSearchResults,
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      fireEvent.click(screen.getByText('出版社'));
      expect(mockClearSearchResults).toHaveBeenCalled();
    });
  });

  describe('検索機能', () => {
    it('検索ボタンが表示される', () => {
      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByTestId('search-button')).toBeInTheDocument();
    });

    it('検索入力フィールドが表示される', () => {
      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByTestId('search-query-input')).toBeInTheDocument();
    });

    it('空のクエリでは検索が実行されない', () => {
      const mockSearchBooks = jest.fn();
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: mockSearchBooks,
        clearSearchResults: jest.fn(),
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      fireEvent.click(screen.getByTestId('search-button'));
      
      expect(mockSearchBooks).not.toHaveBeenCalled();
    });
  });

  describe('検索結果の表示', () => {
    it('検索結果が表示される', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          confidence: 0.8
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('検索結果 (1件)')).toBeInTheDocument();
      expect(screen.getByText('JavaScript入門')).toBeInTheDocument();
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByText('オライリー - 2023-05-15')).toBeInTheDocument();
    });

    it('複数の検索結果が表示される', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          confidence: 0.8
        },
        {
          id: 'book-2',
          source: 'openbd',
          title: 'JavaScript実践',
          author: '田中花子',
          publisher: '技術評論社',
          publishedDate: '2023-08-20',
          isbn: '978-4-7741-1234-5',
          coverImageUrl: 'https://example.com/cover2.jpg',
          confidence: 0.6
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument();
      expect(screen.getByText('JavaScript入門')).toBeInTheDocument();
      expect(screen.getByText('JavaScript実践')).toBeInTheDocument();
    });

    it('検索結果なしのメッセージが表示される', () => {
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('検索キーワードを入力して検索を実行してください。')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスケルトンが表示される', () => {
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByTestId('search-button')).toHaveTextContent('検索中...');
    });
  });

  describe('エラー状態', () => {
    it('エラーが表示される', () => {
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: '検索サービスに接続できませんでした。',
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('検索サービスに接続できませんでした。')).toBeInTheDocument();
    });
  });

  describe('書籍選択機能', () => {
    it('書籍を選択できる', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          confidence: 0.8
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      fireEvent.click(screen.getByTestId('select-book-book-1'));
      
      expect(mockOnBookSelect).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('書籍カードをクリックして選択できる', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          confidence: 0.8
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      fireEvent.click(screen.getByTestId('search-result-book-1'));
      
      expect(mockOnBookSelect).toHaveBeenCalledWith(mockSearchResults[0]);
    });
  });

  describe('キャンセル機能', () => {
    it('キャンセルボタンでキャンセルできる', () => {
      const mockClearSearchResults = jest.fn();
      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: mockClearSearchResults,
        clearError: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      fireEvent.click(screen.getByTestId('cancel-button'));
      
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockClearSearchResults).toHaveBeenCalled();
    });
  });

  describe('表紙画像の表示', () => {
    it('表紙画像がある場合は表示される', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: 'https://example.com/cover.jpg',
          confidence: 0.8
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      const image = screen.getByAltText('JavaScript入門');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/cover.jpg');
    });

    it('表紙画像がない場合はプレースホルダーが表示される', () => {
      const mockSearchResults = [
        {
          id: 'book-1',
          source: 'google',
          title: 'JavaScript入門',
          author: '山田太郎',
          publisher: 'オライリー',
          publishedDate: '2023-05-15',
          isbn: '978-4-87311-123-4',
          coverImageUrl: '',
          confidence: 0.8
        }
      ];

      useExternalBookSearch.mockReturnValue({
        searchResults: mockSearchResults,
        filteredResults: mockSearchResults,
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        // 検索履歴関連のモック
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        // フィルタリング関連のモック
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByText('表紙なし')).toBeInTheDocument();
    });
  });

  describe.skip('重複チェック機能', () => {
    it('重複する書籍がある場合、「追加済み」ボタンが表示される', async () => {
      const mockCheckDuplicate = jest.fn();
      useBookDuplicateCheck.mockReturnValue({
        checkDuplicate: mockCheckDuplicate
      });

      // 重複する書籍のモック
      const duplicateBook = {
        id: 'duplicate-book-id',
        title: '重複テスト本',
        author: '重複テスト著者',
        isbn: '978-4-87311-123-4'
      };

      mockCheckDuplicate.mockResolvedValue(duplicateBook);

      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        filteredResults: [
          {
            id: 'book-1',
            title: 'JavaScript入門',
            author: '山田太郎',
            publisher: 'オライリー',
            publishedDate: '2023-05-15',
            isbn: '978-4-87311-123-4',
            coverImageUrl: 'https://example.com/cover.jpg',
            description: 'JavaScriptの入門書です'
          }
        ],
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      // 重複チェックが実行されるまで待機
      await waitFor(() => {
        expect(mockCheckDuplicate).toHaveBeenCalledWith('978-4-87311-123-4');
      }, { timeout: 10000 });

      // 「追加済み」ボタンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('duplicate-book-book-1')).toBeInTheDocument();
        expect(screen.getByText('追加済み')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('重複しない書籍がある場合、「選択」ボタンが表示される', async () => {
      const mockCheckDuplicate = jest.fn();
      useBookDuplicateCheck.mockReturnValue({
        checkDuplicate: mockCheckDuplicate
      });

      // 重複しない場合（nullを返す）
      mockCheckDuplicate.mockResolvedValue(null);

      useExternalBookSearch.mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
        searchBooks: jest.fn(),
        clearSearchResults: jest.fn(),
        clearError: jest.fn(),
        searchHistory: [],
        loadSearchHistory: jest.fn(),
        removeFromSearchHistory: jest.fn(),
        clearSearchHistory: jest.fn(),
        filteredResults: [
          {
            id: 'book-1',
            title: 'JavaScript入門',
            author: '山田太郎',
            publisher: 'オライリー',
            publishedDate: '2023-05-15',
            isbn: '978-4-87311-123-4',
            coverImageUrl: 'https://example.com/cover.jpg',
            description: 'JavaScriptの入門書です'
          }
        ],
        filters: {
          author: '',
          publisher: '',
          yearFrom: '',
          yearTo: ''
        },
        updateFilters: jest.fn(),
        clearFilters: jest.fn()
      });

      renderWithTheme(
        <ExternalBookSearch 
          onBookSelect={mockOnBookSelect} 
          onCancel={mockOnCancel} 
        />
      );

      // 重複チェックが実行されるまで待機
      await waitFor(() => {
        expect(mockCheckDuplicate).toHaveBeenCalledWith('978-4-87311-123-4');
      }, { timeout: 10000 });

      // 「選択」ボタンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('select-book-book-1')).toBeInTheDocument();
        expect(screen.getByText('選択')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
});