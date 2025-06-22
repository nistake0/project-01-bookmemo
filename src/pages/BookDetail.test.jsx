import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getDoc } from 'firebase/firestore';
import BookDetail from './BookDetail';

// 依存するモジュールをモック化
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: jest.fn(),
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));
jest.mock('../components/MemoList', () => () => <div>MemoList Mock</div>);
jest.mock('../components/MemoAdd', () => () => <div>MemoAdd Mock</div>);

describe('BookDetail', () => {
  const renderComponent = (bookId) => {
    return render(
      <MemoryRouter initialEntries={[`/book/${bookId}`]}>
        <Routes>
          <Route path="/book/:id" element={<BookDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('displays book details with cover image', async () => {
    const mockBook = {
      id: 'book-1',
      userId: 'test-user-id',
      title: '詳細テストブック',
      author: '著者A',
      publisher: 'テスト出版社',
      publishedDate: '2024-01-01',
      coverImageUrl: 'http://example.com/cover.jpg',
    };
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockBook,
      id: 'book-1'
    });

    renderComponent('book-1');

    await waitFor(() => {
      expect(screen.getByText('詳細テストブック')).toBeInTheDocument();
      expect(screen.getByText('著者A')).toBeInTheDocument();
      expect(screen.getByText(/出版社: テスト出版社/)).toBeInTheDocument();
      expect(screen.getByText(/出版日: 2024-01-01/)).toBeInTheDocument();
      const coverImage = screen.getByAltText('詳細テストブックの表紙');
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute('src', 'http://example.com/cover.jpg');
    });
  });

  test('displays placeholder when cover image is missing', async () => {
    const mockBook = {
        id: 'book-2',
        userId: 'test-user-id',
        title: '書影なしブック',
        author: '著者B',
        publisher: 'サンプル社',
        publishedDate: '2024-02-02',
        coverImageUrl: '', // 書影なし
      };
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBook,
        id: 'book-2'
      });
  
      renderComponent('book-2');
  
      await waitFor(() => {
        expect(screen.getByText('書影なしブック')).toBeInTheDocument();
        expect(screen.getByText('著者B')).toBeInTheDocument();
        // 書影なしのプレースホルダーが表示されることを確認
        expect(screen.getByText('書影なし')).toBeInTheDocument();
        // img要素が存在しないことを確認
        expect(screen.queryByAltText('書影なしブックの表紙')).not.toBeInTheDocument();
      });
  });
}); 