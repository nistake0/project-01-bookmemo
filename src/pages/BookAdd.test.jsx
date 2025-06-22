import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import BookAdd from './BookAdd';

// 依存するモジュールをモック化
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // 他の機能はそのまま使う
  useNavigate: () => jest.fn(), // useNavigateだけモック
}));
jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user-id' } }),
}));
jest.mock('../firebase', () => ({
  db: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe('BookAdd', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    axios.get.mockClear();
  });

  test('fetches all book info from openBD and fills the form', async () => {
    const user = userEvent.setup();
    const mockBookData = [{
      summary: {
        title: 'テスト駆動開発',
        author: 'Kent Beck／著 和田卓人／訳',
        publisher: 'オーム社',
        pubdate: '2017-08-25',
        cover: 'https://cover.openbd.jp/9784873119485.jpg',
      },
    }];
    axios.get.mockResolvedValue({ data: mockBookData });

    render(<BookAdd />);

    const isbnInput = screen.getByLabelText(/ISBN/);
    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });

    await user.type(isbnInput, '9784873119485');
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('テスト駆動開発');
      expect(screen.getByLabelText(/著者/)).toHaveValue('Kent Beck／著 和田卓人／訳');
      expect(screen.getByLabelText(/出版社/)).toHaveValue('オーム社');
      expect(screen.getByLabelText(/出版日/)).toHaveValue('2017-08-25');
      expect(screen.getByAltText('表紙')).toHaveAttribute('src', 'https://cover.openbd.jp/9784873119485.jpg');
    });

    expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9784873119485');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('falls back to Google Books API if openBD has no cover', async () => {
    const user = userEvent.setup();
    const openBdMockData = [{
      summary: {
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        pubdate: '2017-09-20',
        cover: '', // openBDには書影がない
      },
    }];
    const googleBooksMockData = {
      items: [{
        volumeInfo: {
          imageLinks: {
            thumbnail: 'https://books.google.com/images/cleancode.jpg',
          },
        },
      }],
    };

    // URLに応じて異なるレスポンスを返すように設定
    axios.get.mockImplementation((url) => {
      if (url.includes('openbd')) {
        return Promise.resolve({ data: openBdMockData });
      }
      if (url.includes('google')) {
        return Promise.resolve({ data: googleBooksMockData });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<BookAdd />);

    const isbnInput = screen.getByLabelText(/ISBN/);
    const fetchButton = screen.getByRole('button', { name: /ISBNで書籍情報取得/ });

    await user.type(isbnInput, '9780132350884');
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('Clean Architecture');
      expect(screen.getByAltText('表紙')).toHaveAttribute('src', 'https://books.google.com/images/cleancode.jpg');
    });

    // openBDとGoogle Books APIの両方が呼ばれたことを確認
    expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9780132350884');
    expect(axios.get).toHaveBeenCalledWith('https://www.googleapis.com/books/v1/volumes?q=isbn:9780132350884');
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
}); 