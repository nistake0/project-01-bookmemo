import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import MemoList from './MemoList';

// Firebaseのモジュールをモック化
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

const mockMemos = [
  { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10 },
  { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20 },
];

const mockMemosWithTags = [
  { id: 'memo1', text: 'メモ1', comment: 'コメント1', page: 10, tags: ['名言', '感想'] },
  { id: 'memo2', text: 'メモ2', comment: 'コメント2', page: 20, tags: ['引用'] },
];

describe('MemoList', () => {
  beforeEach(() => {
    // onSnapshotのモック実装
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockMemos.map(memo => ({
          id: memo.id,
          data: () => memo,
        })),
      });
      return jest.fn(); // unsubscribe関数を返す
    });
    // 各テストの前にモックをリセット
    updateDoc.mockClear();
    deleteDoc.mockClear();
  });

  test('ページ番号付きでメモ一覧が表示される', () => {
    render(<MemoList bookId="test-book-id" />);
    
    expect(screen.getByText('メモ1')).toBeInTheDocument();
    expect(screen.getByText(/p. 10/)).toBeInTheDocument();
    expect(screen.getByText('メモ2')).toBeInTheDocument();
    expect(screen.getByText(/p. 20/)).toBeInTheDocument();
  });

  test('編集モーダルを開いてメモを更新する', async () => {
    const user = userEvent.setup();
    render(<MemoList bookId="test-book-id" />);

    // メモ1の編集ボタンをクリック
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // モーダルが表示され、値が正しいことを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /メモを編集/ })).toBeInTheDocument();
    });
    const textInput = screen.getByLabelText(/引用・抜き書き/);
    const pageInput = screen.getByLabelText(/ページ番号/);
    expect(textInput).toHaveValue('メモ1');
    expect(pageInput).toHaveValue(10);

    // 内容を編集して更新
    await user.clear(textInput);
    await user.type(textInput, '更新されたメモ1');
    await user.clear(pageInput);
    await user.type(pageInput, '15');
    await user.click(screen.getByRole('button', { name: '更新' }));

    // updateDocが正しい引数で呼ばれたことを確認
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        text: '更新されたメモ1',
        page: 15,
      })
    );
  });

  test('メモを削除する', async () => {
    window.confirm = jest.fn(() => true); // 確認ダイアログをモック
    const user = userEvent.setup();
    render(<MemoList bookId="test-book-id" />);

    // メモ2の削除ボタンをクリック
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]);

    expect(window.confirm).toHaveBeenCalledWith('本当にこのメモを削除しますか？');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  test('tagsが存在する場合にChipでタグが表示される', () => {
    // onSnapshotのモックをtags付きデータで上書き
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: mockMemosWithTags.map(memo => ({
          id: memo.id,
          data: () => memo,
        })),
      });
      return jest.fn();
    });
    render(<MemoList bookId="test-book-id" />);
    // タグがChipとして表示されているか確認
    expect(screen.getByText('名言')).toBeInTheDocument();
    expect(screen.getByText('感想')).toBeInTheDocument();
    expect(screen.getByText('引用')).toBeInTheDocument();
  });
}); 