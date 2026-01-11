import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FullTextSearch from './FullTextSearch';
import { useFullTextSearch } from '../../hooks/useFullTextSearch';

// モック設定
jest.mock('../../hooks/useFullTextSearch');

// react-router-domのモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./SearchResults', () => {
  return function MockSearchResults({ results, onResultClick }) {
    return (
      <div data-testid="search-results">
        {results.map((result, index) => (
          <div 
            key={index} 
            data-testid={`result-${index}`}
            onClick={() => onResultClick && onResultClick(result.type, result.bookId || result.id, result.id)}
          >
            {result.title || result.content}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../MemoEditor', () => {
  return function MockMemoEditor({ open, memo, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="memo-editor-dialog">
        メモ詳細ダイアログ
        <button onClick={onClose} data-testid="close-memo-dialog">閉じる</button>
      </div>
    );
  };
});

describe('FullTextSearch', () => {
  const mockHandleSearch = jest.fn();
  const mockHandleSearchTextChange = jest.fn();
  const mockClearResults = jest.fn();
  const mockClearCache = jest.fn();
  const mockGetCacheStats = jest.fn();

  const renderFullTextSearch = () => {
    return render(
      <BrowserRouter>
        <FullTextSearch />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    mockGetCacheStats.mockReturnValue({
      totalItems: 0,
      validItems: 0,
      maxItems: 100,
      expiryMs: 86400000
    });
    
    useFullTextSearch.mockReturnValue({
      searchText: '',
      error: '',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: false
    });
  });

  test('コンポーネントが正しくレンダリングされる', () => {
    renderFullTextSearch();
    
    expect(screen.getByTestId('full-text-search')).toBeInTheDocument();
    expect(screen.getByTestId('full-text-search-description')).toBeInTheDocument();
    expect(screen.getByTestId('full-text-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('full-text-search-button')).toBeInTheDocument();
  });

  test('検索ボタンは初期状態で無効', () => {
    renderFullTextSearch();
    
    const searchButton = screen.getByTestId('full-text-search-button');
    expect(searchButton).toBeDisabled();
  });

  test('2文字以上入力すると検索ボタンが有効化', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true // 検索可能
    });
    
    renderFullTextSearch();
    
    const searchButton = screen.getByTestId('full-text-search-button');
    expect(searchButton).not.toBeDisabled();
  });

  test('検索テキストの変更が処理される', () => {
    renderFullTextSearch();
    
    // MUIのTextFieldは実際のinput要素を探す必要がある
    const input = screen.getByTestId('full-text-search-input').querySelector('input');
    fireEvent.change(input, { target: { value: 'テスト' } });
    
    expect(mockHandleSearchTextChange).toHaveBeenCalledWith('テスト');
  });

  test('検索ボタンをクリックすると検索が実行される', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    const searchButton = screen.getByTestId('full-text-search-button');
    fireEvent.click(searchButton);
    
    expect(mockHandleSearch).toHaveBeenCalled();
  });

  test('Enterキー押下で検索が実行される', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    const input = screen.getByTestId('full-text-search-input');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockHandleSearch).toHaveBeenCalled();
  });

  test('検索中はローディング表示される', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: true, // ローディング中
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: false
    });
    
    renderFullTextSearch();
    
    const searchButton = screen.getByTestId('full-text-search-button');
    expect(searchButton).toHaveTextContent('検索中...');
  });

  test('エラー時は入力フィールドにエラー表示', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'あ',
      error: '2文字以上入力してください',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: false
    });
    
    renderFullTextSearch();
    
    // エラーメッセージはTextFieldのhelperTextとして表示される
    // Material-UIのTextFieldのhelperTextはユーザー向けメッセージのため、getByTextで検証
    expect(screen.getByText('2文字以上入力してください')).toBeInTheDocument();
  });

  test('検索結果が表示される', () => {
    const mockResults = [
      { id: '1', type: 'book', title: 'テスト書籍1' },
      { id: '2', type: 'memo', content: 'テストメモ1' }
    ];
    
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: mockResults,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    expect(screen.getByTestId('full-text-search-results')).toBeInTheDocument();
    const resultCount = screen.getByTestId('full-text-search-result-count');
    expect(resultCount).toHaveTextContent('2 件の結果');
  });

  test('検索結果がない場合は結果なしメッセージが表示される', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: [],
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    expect(screen.getByTestId('full-text-search-no-results')).toBeInTheDocument();
    expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument();
  });

  test('初期状態では初期メッセージが表示される', () => {
    renderFullTextSearch();
    
    const initialAlert = screen.getByTestId('full-text-search-initial');
    expect(initialAlert).toBeInTheDocument();
    expect(initialAlert).toHaveTextContent('キーワードを入力して検索してください');
  });

  test('キャッシュ情報が表示される', () => {
    mockGetCacheStats.mockReturnValue({
      totalItems: 5,
      validItems: 4,
      maxItems: 100,
      expiryMs: 86400000
    });
    
    renderFullTextSearch();
    
    expect(screen.getByTestId('full-text-search-cache-info')).toBeInTheDocument();
    expect(screen.getByText('キャッシュ: 4/100 件')).toBeInTheDocument();
  });

  test('キャッシュクリアボタンをクリックするとキャッシュがクリアされる', () => {
    mockGetCacheStats.mockReturnValue({
      totalItems: 5,
      validItems: 4,
      maxItems: 100,
      expiryMs: 86400000
    });
    
    renderFullTextSearch();
    
    const clearCacheButton = screen.getByTestId('full-text-search-clear-cache');
    fireEvent.click(clearCacheButton);
    
    expect(mockClearCache).toHaveBeenCalled();
  });

  test('入力クリアボタンが表示され、クリックすると結果がクリアされる', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    const clearButton = screen.getByTestId('full-text-search-clear-input');
    fireEvent.click(clearButton);
    
    expect(mockClearResults).toHaveBeenCalled();
  });

  test('ローディング中は入力フィールドが無効化される', () => {
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: true,
      results: null,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: false
    });
    
    renderFullTextSearch();
    
    // MUIのTextFieldは実際のinput要素を確認
    const input = screen.getByTestId('full-text-search-input').querySelector('input');
    expect(input).toBeDisabled();
  });

  test('書籍クリック時は書籍詳細ページに遷移する', () => {
    const mockResults = [
      { id: 'book1', type: 'book', title: 'テスト書籍', bookId: 'book1' }
    ];
    
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: mockResults,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    // 書籍結果をクリック
    fireEvent.click(screen.getByTestId('result-0'));
    
    // 書籍詳細ページに遷移
    expect(mockNavigate).toHaveBeenCalledWith('/book/book1', expect.objectContaining({
      state: expect.objectContaining({
        returnPath: expect.any(String),
        searchState: expect.objectContaining({
          results: expect.any(Array)
        })
      })
    }));
  });

  test('メモクリック時はメモ詳細ダイアログが開く', () => {
    const mockResults = [
      { 
        id: 'memo1', 
        type: 'memo', 
        content: 'テストメモ', 
        bookId: 'book1',
        text: 'メモ本文',
        createdAt: new Date()
      }
    ];
    
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: mockResults,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    // メモ結果をクリック
    fireEvent.click(screen.getByTestId('result-0'));
    
    // メモ詳細ダイアログが開く
    expect(screen.getByTestId('memo-editor-dialog')).toBeInTheDocument();
    
    // 書籍詳細ページには遷移しない
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('メモダイアログを閉じることができる', () => {
    const mockResults = [
      { 
        id: 'memo1', 
        type: 'memo', 
        content: 'テストメモ', 
        bookId: 'book1',
        text: 'メモ本文',
        createdAt: new Date()
      }
    ];
    
    useFullTextSearch.mockReturnValue({
      searchText: 'テスト',
      error: '',
      loading: false,
      results: mockResults,
      handleSearch: mockHandleSearch,
      handleSearchTextChange: mockHandleSearchTextChange,
      clearResults: mockClearResults,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
      canSearch: true
    });
    
    renderFullTextSearch();
    
    // メモをクリックしてダイアログを開く
    fireEvent.click(screen.getByTestId('result-0'));
    expect(screen.getByTestId('memo-editor-dialog')).toBeInTheDocument();
    
    // 閉じるボタンをクリック
    fireEvent.click(screen.getByTestId('close-memo-dialog'));
    
    // ダイアログが閉じる
    expect(screen.queryByTestId('memo-editor-dialog')).not.toBeInTheDocument();
  });
});

