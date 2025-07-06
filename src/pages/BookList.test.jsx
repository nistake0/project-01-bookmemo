import React from 'react';
import { render, screen } from '@testing-library/react';
import BookList from './BookList';
import { useAuth } from '../auth/AuthProvider';
import { getDocs } from 'firebase/firestore';

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));
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
    useAuth.mockReturnValue({ user: { uid: 'test-user-id' } });
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
        status: 'finished',
        userId: 'test-user-id',
        updatedAt: { seconds: 2 },
      },
    ];
    getDocs.mockResolvedValue({
      docs: mockBooks.map(book => ({ id: book.id, data: () => book })),
    });

    render(<BookList />);

    // タグがChipとして表示されているか確認
    expect(await screen.findByText('小説')).toBeInTheDocument();
    expect(screen.getByText('名作')).toBeInTheDocument();
    expect(screen.getByText('技術')).toBeInTheDocument();
  });
}); 