import React from 'react';
import { render, screen } from '@testing-library/react';
import BookList from './BookList';
import { useAuth } from '../auth/AuthProvider';
import { getDocs } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetMocks } from '../test-utils';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe('BookList', () => {
  beforeEach(() => {
    // 完全なモックリセット
    jest.clearAllMocks();
    resetMocks();
    
    // デバッグログ（必要に応じて）
    console.log('=== BookList test beforeEach ===');
    console.log('useAuth mock:', useAuth);
    console.log('getDocs mock:', getDocs);
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    jest.clearAllMocks();
  });

  test('tagsが存在する場合にChipでタグが表示される', async () => {
    console.log('=== tagsが存在する場合にChipでタグが表示される START ===');
    
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
        status: 'finished',
        userId: 'test-user-id',
        updatedAt: { seconds: 2 },
      },
    ];
    
    console.log('=== getDocs mockResolvedValue START ===');
    getDocs.mockResolvedValue({
      docs: mockBooks.map(book => ({ id: book.id, data: () => book })),
    });
    console.log('=== getDocs mockResolvedValue END ===');
    
    console.log('=== render START ===');
    render(<BookList />);
    console.log('=== render END ===');
    
    console.log('=== タグ確認 START ===');
    // タグがテキストとして表示されているか確認
    expect(await screen.findByTestId('book-tags-book1')).toHaveTextContent('小説, 名作');
    expect(screen.getByTestId('book-tags-book2')).toHaveTextContent('技術');
    console.log('=== タグ確認 END ===');
  });

  test('検索欄でタイトル・著者・タグによるフィルタができる', async () => {
    console.log('=== 検索欄でタイトル・著者・タグによるフィルタができる START ===');
    
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
        status: 'finished',
        userId: 'test-user-id',
        updatedAt: { seconds: 2 },
      },
    ];
    
    console.log('=== getDocs mockResolvedValueOnce START ===');
    getDocs.mockResolvedValueOnce({
      docs: mockBooks.map(book => ({ id: book.id, data: () => book })),
    });
    console.log('=== getDocs mockResolvedValueOnce END ===');
    
    console.log('=== render START ===');
    render(<BookList />);
    console.log('=== render END ===');
    
    const user = userEvent.setup();
    
    console.log('=== 初期状態確認 START ===');
    // 初期状態で両方の本が表示されることを確認
    await screen.findByTestId('book-title-book1');
    expect(screen.getByTestId('book-title-book2')).toHaveTextContent('技術書');
    console.log('=== 初期状態確認 END ===');
    
    console.log('=== 検索フィールド確認 START ===');
    // 検索フィールドが表示されることを確認
    const searchInput = await screen.findByLabelText(/検索/);
    expect(searchInput).toBeInTheDocument();
    console.log('=== 検索フィールド確認 END ===');
    
    console.log('=== 検索機能テスト START ===');
    // 基本的な検索機能をテスト
    await user.type(searchInput, '技術');
    expect(screen.getByTestId('book-title-book2')).toBeInTheDocument();
    expect(screen.queryByTestId('book-title-book1')).not.toBeInTheDocument();
    console.log('=== 検索機能テスト END ===');
    
    console.log('=== 0件時テスト START ===');
    // 0件時のテスト
    await user.click(searchInput);
    await user.keyboard('{Control>}a{/Control}');
    await user.type(searchInput, '該当なし');
    expect(await screen.findByTestId('no-books')).toBeInTheDocument();
    console.log('=== 0件時テスト END ===');
  });
}); 