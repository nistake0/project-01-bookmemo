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
}));

describe('BookAdd', () => {
  test('fetches book info from openBD and fills the form', async () => {
    // userEventのセットアップ
    const user = userEvent.setup();

    // モックするAPIのレスポンスデータ
    const mockBookData = [{
      summary: {
        title: 'テスト駆動開発',
        author: 'Kent Beck／著 和田卓人／訳',
      },
    }];
    axios.get.mockResolvedValue({ data: mockBookData });

    render(<BookAdd />);

    // ISBN入力欄を取得
    const isbnInput = screen.getByLabelText(/ISBN/);
    // 「情報取得」ボタンを取得
    const fetchButton = screen.getByRole('button', { name: '情報取得' });

    // ユーザーがISBNを入力する
    await user.type(isbnInput, '9784873119485');
    // ユーザーがボタンをクリックする
    await user.click(fetchButton);

    // APIが呼ばれ、フォームが更新されるのを待つ
    await waitFor(() => {
      // タイトル欄の値が更新されたことを確認
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('テスト駆動開発');
      // 著者欄の値が更新されたことを確認
      expect(screen.getByLabelText(/著者/)).toHaveValue('Kent Beck／著 和田卓人／訳');
    });

    // axios.getが正しいURLで呼ばれたことを確認
    expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9784873119485');
  });
}); 