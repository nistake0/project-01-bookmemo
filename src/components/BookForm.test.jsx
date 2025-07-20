import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookForm from './BookForm';
import { ErrorDialogContext } from './CommonErrorDialog';

// Firebase モック
jest.mock('../firebase', () => ({
  db: {},
}));

// Firestore モック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

// Auth モック
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
  }),
}));

// axios モック
jest.mock('axios', () => ({
  get: jest.fn(),
}));

const mockSetGlobalError = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
  );
};

describe('BookForm', () => {
  const mockOnBookAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Firestore モックの設定
    const { getDocs, query, orderBy } = require('firebase/firestore');
    getDocs.mockResolvedValue({
      docs: [
        { data: () => ({ tag: '小説' }) },
        { data: () => ({ tag: '技術書' }) },
      ],
    });
    query.mockReturnValue({});
    orderBy.mockReturnValue({});
  });

  it('renders form fields', () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    expect(screen.getByLabelText(/ISBN/)).toBeInTheDocument();
    expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
    expect(screen.getByLabelText(/著者/)).toBeInTheDocument();
    expect(screen.getByLabelText(/出版社/)).toBeInTheDocument();
    expect(screen.getByLabelText(/出版日/)).toBeInTheDocument();
    expect(screen.getByLabelText(/タグ/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ISBNで書籍情報取得/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /本を追加/ })).toBeInTheDocument();
  });

  it('shows error when submitting without title', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    const submitButton = screen.getByRole('button', { name: /本を追加/ });
    
    // フォームの送信をシミュレート
    fireEvent.submit(screen.getByRole('form'));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls onBookAdded when form is submitted successfully', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-book-id' });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // タイトルを入力
    const titleInput = screen.getByLabelText(/タイトル/);
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // フォームを送信
    const submitButton = screen.getByRole('button', { name: /本を追加/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          title: 'テスト本',
          status: 'reading',
        })
      );
      expect(mockOnBookAdded).toHaveBeenCalledWith('test-book-id');
    }, { timeout: 3000 });
  });

  it('shows error when ISBN is empty and fetch button is clicked', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText('ISBNを入力してください')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('fetches book info when ISBN is provided', async () => {
    const axios = require('axios');
    const mockBookData = {
      summary: {
        title: 'テスト本',
        author: 'テスト著者',
        publisher: 'テスト出版社',
        pubdate: '2023',
        cover: 'http://example.com/cover.jpg',
      },
    };
    axios.get.mockResolvedValue({ data: [mockBookData] });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // ISBNを入力
    const isbnInput = screen.getByLabelText(/ISBN/);
    fireEvent.change(isbnInput, { target: { value: '9784873119485' } });

    // 取得ボタンをクリック
    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.openbd.jp/v1/get?isbn=9784873119485'
      );
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByDisplayValue('テスト本')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト著者')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト出版社')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 