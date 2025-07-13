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
    const page10s = screen.getAllByText((content, element) => {
      return element?.textContent?.replace(/\s/g, '') === 'p.10';
    });
    expect(page10s.length).toBeGreaterThan(0);
    expect(screen.getByText('メモ2')).toBeInTheDocument();
    const page20s = screen.getAllByText((content, element) => {
      return element?.textContent?.replace(/\s/g, '') === 'p.20';
    });
    expect(page20s.length).toBeGreaterThan(0);
  });

  test('編集モーダルを開いてメモを更新する', async () => {
    const user = userEvent.setup();
    render(<MemoList bookId="test-book-id" />);

    // メモ1の編集ボタンをクリック（詳細ダイアログを開く）
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // 詳細ダイアログが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /メモ詳細/ })).toBeInTheDocument();
    });
    // 「編集」ボタンをクリックして編集フォームを開く
    const editDialogButton = screen.getByRole('button', { name: '編集' });
    await user.click(editDialogButton);

    // 編集フォームのラベル名を「引用・抜き書き」に修正
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
    const user = userEvent.setup();
    render(<MemoList bookId="test-book-id" />);

    // メモ2の編集ボタンをクリック（詳細ダイアログを開く）
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[1]);

    // 詳細ダイアログが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /メモ詳細/ })).toBeInTheDocument();
    });
    // 「削除」ボタンをクリックして削除確認ダイアログを開く
    const deleteDialogButton = screen.getByRole('button', { name: '削除' });
    await user.click(deleteDialogButton);

    // 削除確認ダイアログが表示されることを確認（タイトルで判定）
    await waitFor(() => {
      expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument();
    });
    // 「削除」ボタンをクリック
    const confirmDeleteButton = screen.getAllByRole('button', { name: '削除' }).pop(); // 最後の「削除」ボタン
    await user.click(confirmDeleteButton);

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

  test('長文メモは2行で省略表示される', () => {
    const longText = '1行目\n2行目\n3行目\n4行目';
    const longMemo = [{ id: 'memo-long', text: longText, comment: '', page: 5 }];
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: longMemo.map(memo => ({ id: memo.id, data: () => memo })),
      });
      return jest.fn();
    });
    render(<MemoList bookId="test-book-id" />);
    // 条件に合う要素が1つ以上あることを検証
    const candidates = screen.getAllByText((content, element) => {
      const text = element?.textContent || '';
      return text.includes('1行目') && text.includes('2行目') && !text.includes('3行目');
    });
    expect(candidates.length).toBeGreaterThan(0);
  });

  test('各カードに編集・削除ボタンが存在する', () => {
    render(<MemoList bookId="test-book-id" />);
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test('メタ情報（ページ番号・日付・タグ）が表示される', () => {
    const now = new Date();
    const memoWithMeta = [{
      id: 'memo-meta',
      text: 'メモ',
      comment: 'コメント',
      page: 123,
      tags: ['名言', '感想'],
      createdAt: { toDate: () => now },
    }];
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: memoWithMeta.map(memo => ({ id: memo.id, data: () => memo })),
      });
      return jest.fn();
    });
    render(<MemoList bookId="test-book-id" />);
    expect(screen.getByText('p.123')).toBeInTheDocument();
    expect(screen.getByText(now.toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText('名言')).toBeInTheDocument();
    expect(screen.getByText('感想')).toBeInTheDocument();
  });
}); 