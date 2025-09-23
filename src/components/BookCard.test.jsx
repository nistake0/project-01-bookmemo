import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BookCard from './BookCard';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('BookCard', () => {
  const mockBook = {
    id: 'book1',
    title: 'テスト書籍',
    author: 'テスト著者',
    publisher: 'テスト出版社',
    publishedDate: '2024-01-01',
    coverImageUrl: 'https://example.com/cover.jpg',
    tags: ['小説', '名作'],
    status: 'tsundoku'
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  test('基本的な書籍情報が表示される', () => {
    renderWithTheme(
      <BookCard book={mockBook} onClick={mockOnClick} />
    );

    expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    expect(screen.getByText('テスト著者')).toBeInTheDocument();
    expect(screen.getByText('テスト出版社 • 2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('小説')).toBeInTheDocument();
    expect(screen.getByText('名作')).toBeInTheDocument();
    expect(screen.getByText('ステータス: 積読')).toBeInTheDocument();
  });

  test('表紙画像が表示される', () => {
    renderWithTheme(
      <BookCard book={mockBook} onClick={mockOnClick} />
    );

    const coverImage = screen.getByAltText('テスト書籍');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  test('表紙画像がない場合でも表示される', () => {
    const bookWithoutCover = { ...mockBook, coverImageUrl: null };
    
    renderWithTheme(
      <BookCard book={bookWithoutCover} onClick={mockOnClick} />
    );

    expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    expect(screen.queryByAltText('テスト書籍')).not.toBeInTheDocument();
  });

  test('タグがない場合の表示', () => {
    const bookWithoutTags = { ...mockBook, tags: [] };
    
    renderWithTheme(
      <BookCard book={bookWithoutTags} onClick={mockOnClick} />
    );

    expect(screen.getByText('タグなし')).toBeInTheDocument();
  });

  test('タグが3つ以上ある場合、最初の3つだけ表示される', () => {
    const bookWithManyTags = { 
      ...mockBook, 
      tags: ['タグ1', 'タグ2', 'タグ3', 'タグ4', 'タグ5'] 
    };
    
    renderWithTheme(
      <BookCard book={bookWithManyTags} onClick={mockOnClick} />
    );

    expect(screen.getByText('タグ1')).toBeInTheDocument();
    expect(screen.getByText('タグ2')).toBeInTheDocument();
    expect(screen.getByText('タグ3')).toBeInTheDocument();
    expect(screen.queryByText('タグ4')).not.toBeInTheDocument();
    expect(screen.queryByText('タグ5')).not.toBeInTheDocument();
  });

  test('読了ステータスの表示', () => {
    const finishedBook = { ...mockBook, status: 'finished' };
    
    renderWithTheme(
      <BookCard book={finishedBook} onClick={mockOnClick} />
    );

    expect(screen.getByText('ステータス: 読了')).toBeInTheDocument();
  });

  test('未設定の情報の表示', () => {
    const incompleteBook = {
      id: 'book2',
      title: null,
      author: null,
      publisher: null,
      publishedDate: null,
      coverImageUrl: null,
      tags: null,
      status: null
    };
    
    renderWithTheme(
      <BookCard book={incompleteBook} onClick={mockOnClick} />
    );

    expect(screen.getByText('タイトル未設定')).toBeInTheDocument();
    expect(screen.getByText('著者未設定')).toBeInTheDocument();
    expect(screen.getByText('タグなし')).toBeInTheDocument();
    expect(screen.getByText('ステータス: 積読')).toBeInTheDocument();
  });

  test('クリック時にonClickが呼ばれる', () => {
    renderWithTheme(
      <BookCard book={mockBook} onClick={mockOnClick} />
    );

    const card = screen.getByTestId('book-card-book1');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('カスタムtestIdが使用される', () => {
    renderWithTheme(
      <BookCard book={mockBook} onClick={mockOnClick} testId="custom-test-id" />
    );

    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });

  test('onClickがない場合でもエラーにならない', () => {
    renderWithTheme(
      <BookCard book={mockBook} />
    );

    const card = screen.getByTestId('book-card-book1');
    expect(() => fireEvent.click(card)).not.toThrow();
  });
});
