import React from 'react';
import { render, screen } from '@testing-library/react';
import MemoAdd from './MemoAdd';

// Firebaseのモジュールをモックする
jest.mock('../firebase', () => ({
  db: jest.fn(),
}));

describe('MemoAdd', () => {
  test('renders memo add form correctly', () => {
    render(<MemoAdd bookId="test-book-id" />);

    // "引用・抜き書き" ラベルを持つテキストエリアが表示されることを確認
    expect(screen.getByLabelText(/引用・抜き書き/)).toBeInTheDocument();

    // "感想・コメント" ラベルを持つテキストエリアが表示されることを確認
    expect(screen.getByLabelText(/感想・コメント/)).toBeInTheDocument();

    // "メモを追加" ボタンが表示されることを確認
    expect(screen.getByRole('button', { name: 'メモを追加' })).toBeInTheDocument();
  });
}); 