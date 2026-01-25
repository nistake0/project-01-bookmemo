import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TagStats from './TagStats';
import { useTagStats } from '../../hooks/useTagStats';
import { useAuth } from '../../auth/AuthProvider';

// フックのモック
jest.mock('../../hooks/useTagStats');
jest.mock('../../auth/AuthProvider');

const mockUseTagStats = useTagStats;

describe('TagStats', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockOnTagClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // useAuthはグローバルモックで処理されるため、ここでは設定しない
  });

  test('ローディング状態を正しく表示する', () => {
    mockUseTagStats.mockReturnValue({
      tagStats: {},
      loading: true,
      error: null,
      getSortedTagStats: jest.fn()
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    expect(screen.getByTestId('tag-stats-loading')).toBeInTheDocument();
    expect(screen.getByText('タグ統計を読み込み中...')).toBeInTheDocument();
  });

  test('エラー状態を正しく表示する', () => {
    const mockError = new Error('Test error');
    mockUseTagStats.mockReturnValue({
      tagStats: {},
      loading: false,
      error: mockError,
      getSortedTagStats: jest.fn()
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    expect(screen.getByText(/タグ統計の取得に失敗しました/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  test('タグが存在しない場合のメッセージを表示する', () => {
    mockUseTagStats.mockReturnValue({
      tagStats: {},
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue([])
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    expect(screen.getByText(/タグがまだ登録されていません/)).toBeInTheDocument();
  });

  test('タグ統計を正しく表示する', () => {
    const mockTagStats = {
      '小説': { bookCount: 2, memoCount: 1, lastUsed: new Date('2024-01-01') },
      '技術書': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-02-01') }
    };

    const mockSortedStats = [
      {
        tag: '小説',
        bookCount: 2,
        memoCount: 1,
        totalCount: 3,
        type: 'both',
        lastUsed: new Date('2024-01-01')
      },
      {
        tag: '技術書',
        bookCount: 1,
        memoCount: 0,
        totalCount: 1,
        type: 'book',
        lastUsed: new Date('2024-02-01')
      }
    ];

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue(mockSortedStats)
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    // 統計サマリーの確認
    expect(screen.getByText('2')).toBeInTheDocument(); // 総タグ数
    expect(screen.getByText('3')).toBeInTheDocument(); // 本の総件数
    expect(screen.getByText('1')).toBeInTheDocument(); // メモの総件数
    
    // タグカードの確認
    expect(screen.getByText('小説')).toBeInTheDocument();
    expect(screen.getByText('技術書')).toBeInTheDocument();
    expect(screen.getByText('本: 2件')).toBeInTheDocument();
    expect(screen.getByText('メモ: 1件')).toBeInTheDocument();
    expect(screen.getByText('合計: 3件')).toBeInTheDocument();
  });

  test('タグクリック時にコールバックが呼ばれる', () => {
    const mockTagStats = {
      '小説': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-01-01') }
    };

    const mockSortedStats = [
      {
        tag: '小説',
        bookCount: 1,
        memoCount: 0,
        totalCount: 1,
        type: 'book',
        lastUsed: new Date('2024-01-01')
      }
    ];

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue(mockSortedStats)
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    const tagCard = screen.getByTestId('tag-stat-card-小説');
    fireEvent.click(tagCard);
    
    expect(mockOnTagClick).toHaveBeenCalledWith('小説');
  });

  test('ソート設定が正しく動作する', () => {
    const mockTagStats = {
      '小説': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-01-01') },
      '技術書': { bookCount: 2, memoCount: 0, lastUsed: new Date('2024-02-01') }
    };

    const mockGetSortedTagStats = jest.fn().mockReturnValue([]);

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: mockGetSortedTagStats
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    // ソート基準の変更（comboboxロールを使用）
    const sortBySelect = screen.getAllByRole('combobox')[0];
    fireEvent.mouseDown(sortBySelect);
    
    const nameOption = screen.getByText('名前順');
    fireEvent.click(nameOption);
    
    expect(mockGetSortedTagStats).toHaveBeenCalledWith('name', 'desc');
    
    // ソート順序の変更
    const sortOrderSelect = screen.getAllByRole('combobox')[1];
    fireEvent.mouseDown(sortOrderSelect);
    
    const ascOption = screen.getByText('昇順');
    fireEvent.click(ascOption);
    
    expect(mockGetSortedTagStats).toHaveBeenCalledWith('name', 'asc');
  });

  test('タグの種類に応じてチップの色が変わる', () => {
    const mockTagStats = {
      '小説': { bookCount: 1, memoCount: 1, lastUsed: new Date('2024-01-01') },
      '技術書': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-02-01') },
      '感想': { bookCount: 0, memoCount: 1, lastUsed: new Date('2024-03-01') }
    };

    const mockSortedStats = [
      {
        tag: '小説',
        bookCount: 1,
        memoCount: 1,
        totalCount: 2,
        type: 'both',
        lastUsed: new Date('2024-01-01')
      },
      {
        tag: '技術書',
        bookCount: 1,
        memoCount: 0,
        totalCount: 1,
        type: 'book',
        lastUsed: new Date('2024-02-01')
      },
      {
        tag: '感想',
        bookCount: 0,
        memoCount: 1,
        totalCount: 1,
        type: 'memo',
        lastUsed: new Date('2024-03-01')
      }
    ];

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue(mockSortedStats)
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    // タグの種類チップが表示されることを確認
    expect(screen.getByText('both')).toBeInTheDocument();
    expect(screen.getByText('book')).toBeInTheDocument();
    expect(screen.getByText('memo')).toBeInTheDocument();
  });

  test('最終使用日が正しく表示される', () => {
    const mockTagStats = {
      '小説': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-01-15') }
    };

    const mockSortedStats = [
      {
        tag: '小説',
        bookCount: 1,
        memoCount: 0,
        totalCount: 1,
        type: 'book',
        lastUsed: new Date('2024-01-15')
      }
    ];

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue(mockSortedStats)
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    expect(screen.getByText(/最終使用: 2024\/1\/15/)).toBeInTheDocument();
  });

  test('レスポンシブデザインのテスト', () => {
    const mockTagStats = {
      '小説': { bookCount: 1, memoCount: 0, lastUsed: new Date('2024-01-01') }
    };

    const mockSortedStats = [
      {
        tag: '小説',
        bookCount: 1,
        memoCount: 0,
        totalCount: 1,
        type: 'book',
        lastUsed: new Date('2024-01-01')
      }
    ];

    mockUseTagStats.mockReturnValue({
      tagStats: mockTagStats,
      loading: false,
      error: null,
      getSortedTagStats: jest.fn().mockReturnValue(mockSortedStats)
    });

    render(<TagStats onTagClick={mockOnTagClick} />);
    
    // Gridコンポーネントが正しくレンダリングされることを確認
    const tagCard = screen.getByTestId('tag-stat-card-小説');
    expect(tagCard).toBeInTheDocument();
  });
}); 