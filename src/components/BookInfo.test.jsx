import React from 'react';
import { render, screen } from '@testing-library/react';
import BookInfo from './BookInfo';

describe('BookInfo', () => {
  const mockBook = {
    id: 'book-1',
    title: 'テストブック',
    author: '著者A',
    publisher: 'テスト出版社',
    publishedDate: '2024-01-01',
    coverImageUrl: 'http://example.com/cover.jpg',
    status: 'reading',
    tags: ['小説', '名作']
  };

  test('displays book information correctly', () => {
    render(<BookInfo book={mockBook} />);
    
    expect(screen.getByText('テストブック')).toBeInTheDocument();
    expect(screen.getByText('著者A')).toBeInTheDocument();
    expect(screen.getByText(/出版社: テスト出版社/)).toBeInTheDocument();
    expect(screen.getByText(/出版日: 2024-01-01/)).toBeInTheDocument();
    expect(screen.getByText('読書中')).toBeInTheDocument();
  });

  test('displays cover image when available', () => {
    render(<BookInfo book={mockBook} />);
    
    const coverImage = screen.getByAltText('テストブックの表紙');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'http://example.com/cover.jpg');
  });

  test('displays placeholder when cover image is missing', () => {
    const bookWithoutCover = { ...mockBook, coverImageUrl: '' };
    render(<BookInfo book={bookWithoutCover} />);
    
    expect(screen.getByText('書影なし')).toBeInTheDocument();
    expect(screen.queryByAltText('テストブックの表紙')).not.toBeInTheDocument();
  });

  test('displays finished status correctly', () => {
    const finishedBook = { ...mockBook, status: 'finished' };
    render(<BookInfo book={finishedBook} />);
    
    expect(screen.getByText('読了')).toBeInTheDocument();
  });

  test('displays reading status as default when status is missing', () => {
    const bookWithoutStatus = { ...mockBook };
    delete bookWithoutStatus.status;
    render(<BookInfo book={bookWithoutStatus} />);
    
    expect(screen.getByText('読書中')).toBeInTheDocument();
  });

  test('handles missing optional fields gracefully', () => {
    const minimalBook = {
      id: 'book-1',
      title: 'テストブック',
      author: '著者A'
    };
    render(<BookInfo book={minimalBook} />);
    
    expect(screen.getByText('テストブック')).toBeInTheDocument();
    expect(screen.getByText('著者A')).toBeInTheDocument();
    expect(screen.queryByText(/出版社:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/出版日:/)).not.toBeInTheDocument();
  });

  test('returns null when book is null', () => {
    const { container } = render(<BookInfo book={null} />);
    expect(container.firstChild).toBeNull();
  });
}); 