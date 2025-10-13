import React from 'react';
import { render, screen } from '@testing-library/react';
import BookList from './BookList';
import { useBookList } from '../hooks/useBookList';
import userEvent from '@testing-library/user-event';

// useBookListフックをモック
jest.mock('../hooks/useBookList');

// PWA機能のサポートをモック
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {},
  },
  writable: true,
});

Object.defineProperty(window, 'PushManager', {
  value: {},
  writable: true,
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe('BookList', () => {
  const mockUseBookList = useBookList;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tagsが存在する場合にChipでタグが表示される', async () => {
    const mockBooks = [
      {
        id: 'book1',
        title: '本1',
        author: '著者1',
        tags: ['小説', '名作'],
        status: 'reading',
        userId: 'test-user-id',
        updatedAt: { seconds: 1 },
      },
      {
        id: 'book2',
        title: '本2',
        author: '著者2',
        tags: ['技術'],
        status: 'reading',
        userId: 'test-user-id',
        updatedAt: { seconds: 2 },
      },
    ];

    mockUseBookList.mockReturnValue({
      filteredBooks: mockBooks,
      loading: false,
      error: null,
      filter: 'reading-group',
      searchText: '',
      handleFilterChange: jest.fn(),
      handleSearchChange: jest.fn(),
    });

    render(<BookList />);

    // カード表示でタグがChipとして表示されているか確認
    expect(await screen.findByText('小説')).toBeInTheDocument();
    expect(screen.getByText('名作')).toBeInTheDocument();
    expect(screen.getByText('技術')).toBeInTheDocument();
  });

  test('検索欄でタイトル・著者・タグによるフィルタができる', async () => {
    const mockBooks = [
      {
        id: 'book1',
        title: '本1',
        author: '著者1',
        tags: ['小説', '名作'],
        status: 'reading',
        userId: 'test-user-id',
        updatedAt: { seconds: 1 },
      },
      {
        id: 'book2',
        title: '技術書',
        author: '技術太郎',
        tags: ['技術'],
        status: 'reading',
        userId: 'test-user-id',
        updatedAt: { seconds: 2 },
      },
    ];

    const mockHandleSearchChange = jest.fn();
    
    mockUseBookList.mockReturnValue({
      filteredBooks: mockBooks,
      loading: false,
      error: null,
      filter: 'reading-group',
      searchText: '',
      handleFilterChange: jest.fn(),
      handleSearchChange: mockHandleSearchChange,
    });

    render(<BookList />);

    const user = userEvent.setup();
    
    // 初期状態で両方の本が表示されることを確認
    await screen.findByText('本1');
    expect(screen.getByText('技術書')).toBeInTheDocument();
    
    // 検索フィールドが表示されることを確認
    const searchInput = await screen.findByLabelText(/検索/);
    expect(searchInput).toBeInTheDocument();
    
    // 検索機能をテスト
    await user.type(searchInput, '技術');
    expect(mockHandleSearchChange).toHaveBeenCalled();
  });

  test('タブコンテナにstickyスタイルが付与されている', async () => {
    mockUseBookList.mockReturnValue({
      filteredBooks: [],
      loading: false,
      error: null,
      filter: 'all',
      searchText: '',
      handleFilterChange: jest.fn(),
      handleSearchChange: jest.fn(),
    });

    render(<BookList />);

    const tabsContainer = await screen.findByTestId('book-list-tabs-container');
    expect(tabsContainer).toBeInTheDocument();
    // inline style フォールバックも含めチェック
    expect(tabsContainer.style.position).toBe('sticky');
  });
}); 