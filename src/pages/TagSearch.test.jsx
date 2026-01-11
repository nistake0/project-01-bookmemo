// モックを最初に定義
jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn()
}));

jest.mock('../hooks/useSearch', () => ({
  useSearch: jest.fn()
}));

jest.mock('../components/search/FullTextSearch', () => {
  return function MockFullTextSearch({ onBookClick, onMemoClick }) {
    return (
      <div data-testid="full-text-search">
        <button onClick={() => onBookClick && onBookClick('book1')} data-testid="full-text-search-book">
          書籍結果
        </button>
        <button onClick={() => onMemoClick && onMemoClick('book1', 'memo1')} data-testid="full-text-search-memo">
          メモ結果
        </button>
      </div>
    );
  };
});

jest.mock('../components/search/AdvancedSearchForm', () => {
  return function MockAdvancedSearchForm({ searchConditions, onSearchConditionsChange, onSearch }) {
    return (
      <div data-testid="advanced-search-form">
        <button onClick={() => onSearch(searchConditions)} data-testid="search-button">
          検索実行
        </button>
        <button onClick={() => onSearchConditionsChange({ ...searchConditions, text: 'test' })} data-testid="update-conditions">
          条件更新
        </button>
      </div>
    );
  };
});

jest.mock('../components/search/SearchResults', () => {
  return function MockSearchResults({ results, loading, onResultClick }) {
    if (loading) return <div data-testid="search-results-loading">読み込み中...</div>;
    return (
      <div data-testid="search-results">
        {results.map((result, index) => (
          <div key={index} onClick={() => onResultClick && onResultClick(result.type, result.bookId || result.id, result.id)} data-testid={`result-${index}`}>
            {result.title || result.content}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../components/tags/TagStats', () => {
  return function MockTagStats({ onTagClick }) {
    return (
      <div data-testid="tag-stats">
        <button onClick={() => onTagClick('小説')} data-testid="tag-click-小説">
          小説
        </button>
        <button onClick={() => onTagClick('技術書')} data-testid="tag-click-技術書">
          技術書
        </button>
      </div>
    );
  };
});

jest.mock('../components/MemoEditor', () => {
  return function MockMemoEditor({ open, memo, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="memo-detail-dialog">
        メモ詳細ダイアログ
        <button onClick={onClose}>閉じる</button>
      </div>
    );
  };
});

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import { screen, fireEvent, waitFor } from '@testing-library/react';
import TagSearch from './TagSearch';
import { useAuth } from '../auth/AuthProvider';
import { useSearch } from '../hooks/useSearch';
import { renderWithProviders } from '../test-utils';

describe('TagSearch', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockExecuteSearch = jest.fn();
  const mockClearResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({ user: mockUser });
    useSearch.mockReturnValue({
      results: [],
      loading: false,
      error: null,
      executeSearch: mockExecuteSearch,
      clearResults: mockClearResults
    });
  });

  const renderTagSearch = () => {
    return renderWithProviders(<TagSearch />);
  };

  describe('基本表示', () => {
    test('タイトルとタブが正しく表示される', () => {
      renderTagSearch();
      
      // PageHeaderコンポーネントのタイトルを確認
      expect(screen.getByText('検索・タグ')).toBeInTheDocument();
      expect(screen.getByText('高度な検索とタグ管理')).toBeInTheDocument();
      
      // 3タブ構成の確認
      expect(screen.getByTestId('full-text-search-tab')).toHaveTextContent('全文検索');
      expect(screen.getByTestId('advanced-search-tab')).toHaveTextContent('詳細検索');
      expect(screen.getByTestId('tag-management-tab')).toHaveTextContent('タグ管理');
    });

    test('タブコンテナにstickyスタイルが付与されている', () => {
      renderTagSearch();
      const tabsContainer = screen.getByTestId('tag-search-tabs-container');
      expect(tabsContainer).toBeInTheDocument();
      expect(tabsContainer.style.position).toBe('sticky');
    });

    test('ログインしていない場合はエラーメッセージが表示される', () => {
      useAuth.mockReturnValue({ user: null });
      renderTagSearch();
      
      expect(screen.getByText('ログインが必要です')).toBeInTheDocument();
    });
  });

  describe('タブ切り替え', () => {
    test('タブをクリックすると切り替わる', () => {
      renderTagSearch();
      
      // 初期状態では全文検索タブが表示される
      expect(screen.getByTestId('full-text-search-tab-panel')).toBeInTheDocument();
      expect(screen.getByTestId('full-text-search')).toBeInTheDocument();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      expect(screen.getByTestId('advanced-search-tab-panel')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-search-form')).toBeInTheDocument();
      
      // タグ管理タブに切り替え
      fireEvent.click(screen.getByTestId('tag-management-tab'));
      expect(screen.getByTestId('tag-management-tab-panel')).toBeInTheDocument();
      expect(screen.getByTestId('tag-stats')).toBeInTheDocument();
      
      // 全文検索タブに戻る
      fireEvent.click(screen.getByTestId('full-text-search-tab'));
      expect(screen.getByTestId('full-text-search-tab-panel')).toBeInTheDocument();
    });
  });

  describe('全文検索機能', () => {
    test('全文検索フォームが表示される', () => {
      renderTagSearch();
      
      // 初期状態で全文検索タブが表示される
      expect(screen.getByTestId('full-text-search')).toBeInTheDocument();
    });
  });

  describe('詳細検索機能', () => {
    test('詳細検索フォームが表示される', () => {
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      expect(screen.getByTestId('advanced-search-form')).toBeInTheDocument();
    });

    test('検索ボタンをクリックすると検索が実行される', () => {
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      fireEvent.click(screen.getByTestId('search-button'));
      
      expect(mockExecuteSearch).toHaveBeenCalled();
    });

    test('検索結果が表示される', () => {
      const mockResults = [
        { id: '1', type: 'book', title: 'テスト本1' },
        { id: '2', type: 'memo', content: 'テストメモ1' }
      ];
      
      useSearch.mockReturnValue({
        results: mockResults,
        loading: false,
        error: null,
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      expect(screen.getByTestId('result-0')).toHaveTextContent('テスト本1');
      expect(screen.getByTestId('result-1')).toHaveTextContent('テストメモ1');
    });

    test('検索エラーが表示される', () => {
      useSearch.mockReturnValue({
        results: [],
        loading: false,
        error: '検索エラーが発生しました',
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      expect(screen.getByText('検索エラーが発生しました')).toBeInTheDocument();
    });

    test('検索結果クリック: 本は遷移し、メモはダイアログを開く', async () => {
      const mockResults = [
        { id: 'book1', type: 'book', title: 'テスト本' },
        { id: 'memo1', type: 'memo', content: 'テストメモ', bookId: 'book1' }
      ];
      
      useSearch.mockReturnValue({
        results: mockResults,
        loading: false,
        error: null,
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      // 本の結果をクリック → 書籍詳細へ遷移
      fireEvent.click(screen.getByTestId('result-0'));
      expect(mockNavigate).toHaveBeenCalledWith('/book/book1', expect.objectContaining({
        state: expect.objectContaining({
          returnPath: expect.any(String),
          searchState: expect.objectContaining({
            results: expect.any(Array)
          })
        })
      }));

      // メモの結果をクリック → メモ詳細ダイアログが開く（遷移しない）
      fireEvent.click(screen.getByTestId('result-1'));
      await waitFor(() => {
        expect(screen.getByTestId('memo-detail-dialog')).toBeInTheDocument();
      });
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('タグクリック検索機能', () => {
    test('タグをクリックすると詳細検索タブに切り替わり、そのタグで検索が実行される', async () => {
      renderTagSearch();
      
      // タグ管理タブに切り替え
      fireEvent.click(screen.getByTestId('tag-management-tab'));
      expect(screen.getByTestId('tag-management-tab-panel')).toBeInTheDocument();
      
      // タグをクリック
      fireEvent.click(screen.getByTestId('tag-click-小説'));
      
      // 詳細検索タブに自動切り替え
      await waitFor(() => {
        expect(screen.getByTestId('advanced-search-tab-panel')).toBeInTheDocument();
      });
      
      // 検索が実行される（選択されたタグで）
      expect(mockExecuteSearch).toHaveBeenCalledWith({
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
    });

    test('複数のタグをクリックすると、最後にクリックしたタグで検索される', async () => {
      renderTagSearch();
      
      // タグ管理タブに切り替え
      fireEvent.click(screen.getByTestId('tag-management-tab'));
      
      // 最初のタグをクリック
      fireEvent.click(screen.getByTestId('tag-click-小説'));
      
      // 詳細検索タブに自動切り替えを待つ
      await waitFor(() => {
        expect(screen.getByTestId('advanced-search-tab-panel')).toBeInTheDocument();
      });
      
      // 再度タグ管理タブに切り替え
      fireEvent.click(screen.getByTestId('tag-management-tab'));
      
      // 2番目のタグをクリック
      fireEvent.click(screen.getByTestId('tag-click-技術書'));
      
      // 詳細検索タブに自動切り替えを待つ
      await waitFor(() => {
        expect(screen.getByTestId('advanced-search-tab-panel')).toBeInTheDocument();
      });
      
      // 最後にクリックしたタグで検索が実行される
      expect(mockExecuteSearch).toHaveBeenLastCalledWith({
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        selectedTags: ['技術書'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
    });

    test('タグクリック時にテキスト検索とメモ内容検索がクリアされる', async () => {
      // 初期検索条件にテキストとメモ内容を設定
      useSearch.mockReturnValue({
        results: [],
        loading: false,
        error: null,
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      // 検索条件を更新（テキストとメモ内容を設定）
      fireEvent.click(screen.getByTestId('update-conditions'));
      
      // タグ管理タブに切り替え
      fireEvent.click(screen.getByTestId('tag-management-tab'));
      
      // タグをクリック
      fireEvent.click(screen.getByTestId('tag-click-小説'));
      
      // 検索が実行される（テキストとメモ内容がクリアされている）
      expect(mockExecuteSearch).toHaveBeenCalledWith({
        text: '',
        status: 'all',
        dateRange: { type: 'none' },
        selectedTags: ['小説'],
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
    });
  });

  describe('検索結果クリア機能', () => {
    test('検索結果がある場合にクリアボタンが表示される', () => {
      const mockResults = [{ id: '1', type: 'book', title: 'テスト本' }];
      
      useSearch.mockReturnValue({
        results: mockResults,
        loading: false,
        error: null,
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      expect(screen.getByText('検索結果をクリア')).toBeInTheDocument();
    });

    test('クリアボタンをクリックすると検索結果がクリアされる', () => {
      const mockResults = [{ id: '1', type: 'book', title: 'テスト本' }];
      
      useSearch.mockReturnValue({
        results: mockResults,
        loading: false,
        error: null,
        executeSearch: mockExecuteSearch,
        clearResults: mockClearResults
      });
      
      renderTagSearch();
      
      // 詳細検索タブに切り替え
      fireEvent.click(screen.getByTestId('advanced-search-tab'));
      
      fireEvent.click(screen.getByText('検索結果をクリア'));
      
      expect(mockClearResults).toHaveBeenCalled();
    });
  });
});
