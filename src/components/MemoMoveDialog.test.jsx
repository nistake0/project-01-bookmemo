import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemoMoveDialog from './MemoMoveDialog';

jest.mock('../hooks/useBookLookup', () => ({
  useBookLookup: jest.fn(),
}));

const { useBookLookup } = require('../hooks/useBookLookup');

const defaultMemo = {
  id: 'memo-1',
  text: '抜粋メモ本文',
  comment: 'コメント',
  createdAt: new Date('2024-01-01T10:00:00Z'),
};

const buildBooks = () => [
  {
    id: 'book-1',
    title: '最初の書籍',
    author: '著者A',
    status: 'reading',
  },
  {
    id: 'book-2',
    title: '次の書籍',
    author: '著者B',
    status: 'finished',
  },
];

const renderDialog = (props = {}) => {
  const onClose = jest.fn();
  const onMove = jest.fn().mockResolvedValue({});
  const onSuccess = jest.fn();

  const utils = render(
    <MemoMoveDialog
      open
      memo={defaultMemo}
      currentBookId="book-1"
      onClose={onClose}
      onMove={onMove}
      onSuccess={onSuccess}
      {...props}
    />
  );

  return { onClose, onMove, onSuccess, ...utils };
};

describe('MemoMoveDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBookLookup.mockReturnValue({
      books: buildBooks(),
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('renders memo summary, instruction text and book autocomplete', () => {
    renderDialog();

    expect(screen.getByTestId('memo-move-summary-label')).toBeInTheDocument();
    expect(screen.getByTestId('memo-move-summary')).toHaveTextContent(defaultMemo.text);
    expect(screen.getByTestId('memo-move-book-textfield')).toBeInTheDocument();
    expect(screen.getByTestId('memo-move-instruction')).toBeInTheDocument();
  });

  it('disables submit button when no book is selected', () => {
    renderDialog();
    expect(screen.getByTestId('memo-move-submit-button')).toBeDisabled();
  });

  it('shows validation error when submitting without selecting a book', async () => {
    renderDialog();

    fireEvent.submit(screen.getByTestId('memo-move-form'));

    await waitFor(() => {
      const helper = screen.getByTestId('memo-move-helper-text');
      expect(helper).toHaveAttribute('data-state', 'required');
    });
  });

  it('shows error when selecting the current book', async () => {
    renderDialog();

    const input = screen.getByTestId('memo-move-book-input');
    await userEvent.click(input);
    await userEvent.click(screen.getByTestId('memo-move-option-book-1'));

    const submit = screen.getByTestId('memo-move-submit-button');
    expect(submit).toBeDisabled();
    await waitFor(() =>
      expect(screen.getByTestId('memo-move-helper-text')).toHaveAttribute('data-state', 'same-book')
    );
  });

  it('calls onMove and onSuccess when submitting with a valid selection', async () => {
    const { onMove, onSuccess, onClose } = renderDialog();

    const input = screen.getByTestId('memo-move-book-input');
    await userEvent.click(input);
    await userEvent.click(screen.getByTestId('memo-move-option-book-2'));

    fireEvent.click(screen.getByTestId('memo-move-submit-button'));

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith({
        memoId: 'memo-1',
        targetBookId: 'book-2',
      });
    });
    expect(onSuccess).toHaveBeenCalledWith('book-2');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error message when onMove throws', async () => {
    const onMove = jest.fn().mockRejectedValue(new Error('failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderDialog({ onMove });

    const input = screen.getByTestId('memo-move-book-input');
    await userEvent.click(input);
    await userEvent.click(screen.getByTestId('memo-move-option-book-2'));

    fireEvent.click(screen.getByTestId('memo-move-submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('memo-move-helper-text')).toHaveAttribute('data-state', 'submit-error')
    );
    expect(screen.getByTestId('memo-move-submit-button')).not.toBeDisabled();
    consoleSpy.mockRestore();
  });

  it('disables autocomplete and submit when no books are available', () => {
    useBookLookup.mockReturnValue({
      books: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    renderDialog();

    expect(screen.getByTestId('memo-move-book-input')).toBeDisabled();
    expect(screen.getByTestId('memo-move-submit-button')).toBeDisabled();
  });

  it('shows error alert when lookup fails and allows refresh', () => {
    const mockRefresh = jest.fn();
    useBookLookup.mockReturnValue({
      books: [],
      loading: false,
      error: 'Error',
      refresh: mockRefresh,
    });

    renderDialog();

    expect(screen.getByTestId('memo-move-fetch-error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('memo-move-refresh-button'));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
