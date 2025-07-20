import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoEditor from './MemoEditor';

// Firebaseのモック
jest.mock('../firebase', () => ({
  db: {},
}));

// Firestoreのモック
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'memo1' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ _seconds: 1234567890 })),
}));

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <ErrorDialogProvider>
        {component}
      </ErrorDialogProvider>
    </ThemeProvider>
  );
};

describe('MemoEditor', () => {
  const mockMemo = {
    id: 'memo1',
    text: 'テストメモの内容',
    comment: 'テストコメント',
    page: 123,
    tags: ['テスト', 'サンプル'],
    createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
  };

  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when memo is null', () => {
    const { container } = renderWithProviders(
      <MemoEditor 
        open={true}
        memo={null}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders memo details in view mode', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('メモ詳細')).toBeInTheDocument();
    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.getByText('テストコメント')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('サンプル')).toBeInTheDocument();
    expect(screen.getByText('p. 123')).toBeInTheDocument();
    expect(screen.getByText('2024/1/1 10:00:00')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    const editButton = screen.getByText('編集');
    fireEvent.click(editButton);

    expect(screen.getByText('引用・抜き書き')).toBeInTheDocument();
    expect(screen.getAllByText('感想・コメント')).toHaveLength(2); // ラベルとlegendの両方に存在
    expect(screen.getAllByText('ページ番号')).toHaveLength(2); // ラベルとlegendの両方に存在
  });

  it('shows delete confirmation when delete button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('このメモを削除すると、元に戻すことはできません。')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('閉じる');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles memo without optional fields', () => {
    const minimalMemo = {
      id: 'memo2',
      text: '最小限のメモ',
      createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={minimalMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('最小限のメモ')).toBeInTheDocument();
    expect(screen.queryByText('p.')).not.toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  it('handles memo with null createdAt', () => {
    const memoWithoutDate = {
      id: 'memo3',
      text: '日付なしメモ',
      createdAt: null
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={memoWithoutDate}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('日付なしメモ')).toBeInTheDocument();
    expect(screen.queryByText('1/1/2024')).not.toBeInTheDocument();
  });

  it('handles memo with null tags', () => {
    const memoWithNullTags = {
      id: 'memo4',
      text: 'タグなしメモ',
      tags: null,
      createdAt: { toDate: () => new Date('2024-01-01T10:00:00') }
    };

    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={memoWithNullTags}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('タグなしメモ')).toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  it('cancels edit mode when cancel button is clicked', () => {
    renderWithProviders(
      <MemoEditor 
        open={true}
        memo={mockMemo}
        bookId="book1"
        onClose={mockOnClose}
      />
    );

    // 編集モードに切り替え
    const editButton = screen.getByText('編集');
    fireEvent.click(editButton);

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    // 詳細表示モードに戻る
    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.queryByLabelText('引用・抜き書き')).not.toBeInTheDocument();
  });
}); 