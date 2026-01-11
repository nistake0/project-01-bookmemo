import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookEditDialog from './BookEditDialog';

const baseBook = {
  id: 'book-1',
  title: '既存タイトル',
  author: '既存著者',
  publisher: '既存出版社',
  publishedDate: '2024-01-01',
  coverImageUrl: 'https://example.com/cover.jpg',
  isbn: '9781234567890',
};

const originalImage = global.Image;
let imageShouldSucceed = true;

beforeEach(() => {
  imageShouldSucceed = true;
  global.Image = class {
    constructor() {
      setTimeout(() => {
        if (imageShouldSucceed && this.onload) {
          this.onload();
        } else if (!imageShouldSucceed && this.onerror) {
          this.onerror(new Error('not found'));
        }
      }, 0);
    }

    set src(value) {
      this._src = value;
    }
  };
});

afterAll(() => {
  global.Image = originalImage;
});

describe('BookEditDialog', () => {
  const renderDialog = (props = {}) => {
    const defaultProps = {
      open: true,
      book: baseBook,
      onClose: jest.fn(),
      onSave: jest.fn().mockResolvedValue(undefined),
    };

    return render(<BookEditDialog {...defaultProps} {...props} />);
  };

  it('prefills fields with book data', () => {
    renderDialog();

    expect(screen.getByTestId('book-edit-title-input')).toHaveValue('既存タイトル');
    expect(screen.getByTestId('book-edit-author-input')).toHaveValue('既存著者');
    expect(screen.getByTestId('book-edit-publisher-input')).toHaveValue('既存出版社');
    expect(screen.getByTestId('book-edit-published-date-input')).toHaveValue('2024-01-01');
    expect(screen.getByTestId('book-edit-cover-url-input')).toHaveValue('https://example.com/cover.jpg');
    expect(screen.getByTestId('book-edit-cover-preview')).toBeInTheDocument();
  });

  it('validates title is required', async () => {
    const onSave = jest.fn();
    renderDialog({ onSave });

    const titleInput = screen.getByTestId('book-edit-title-input');
    fireEvent.change(titleInput, { target: { value: '' } });

    fireEvent.click(screen.getByTestId('book-edit-save'));

    expect(await screen.findByTestId('book-edit-error')).toHaveTextContent('タイトルは必須です。');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed values and closes dialog', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    renderDialog({ onSave, onClose });

    fireEvent.change(screen.getByTestId('book-edit-title-input'), { target: { value: ' 新しいタイトル ' } });
    fireEvent.change(screen.getByTestId('book-edit-author-input'), { target: { value: ' 著者B ' } });
    fireEvent.change(screen.getByTestId('book-edit-cover-url-input'), { target: { value: ' https://example.com/new.jpg ' } });

    fireEvent.click(screen.getByTestId('book-edit-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: '新しいタイトル',
        author: '著者B',
        publisher: '既存出版社',
        publishedDate: '2024-01-01',
        coverImageUrl: 'https://example.com/new.jpg',
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when onSave throws', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderDialog({ onSave });

    fireEvent.click(screen.getByTestId('book-edit-save'));

    expect(await screen.findByTestId('book-edit-error')).toHaveTextContent('書籍情報の更新に失敗しました。');
    consoleSpy.mockRestore();
  });

  it('fetches openBD cover when button clicked', async () => {
    renderDialog();

    fireEvent.click(screen.getByTestId('book-edit-fetch-cover-button'));

    await waitFor(() => {
      expect(screen.getByTestId('book-edit-cover-url-input')).toHaveValue('https://cover.openbd.jp/9781234567890.jpg');
    });
  });

  it('shows error when openBD cover is not found', async () => {
    imageShouldSucceed = false;
    renderDialog();

    fireEvent.click(screen.getByTestId('book-edit-fetch-cover-button'));

    expect(await screen.findByTestId('book-edit-error')).toHaveTextContent('openBDの書影が見つかりませんでした。');
  });

  it('disables fetch button when ISBN is missing', () => {
    renderDialog({ book: { ...baseBook, isbn: '' } });

    expect(screen.getByTestId('book-edit-fetch-cover-button')).toBeDisabled();
  });

  it('clears cover url when clear button clicked', () => {
    renderDialog();

    fireEvent.click(screen.getByTestId('book-edit-clear-cover-button'));

    expect(screen.getByTestId('book-edit-cover-url-input')).toHaveValue('');
  });

  it('does not render when dialog is closed', () => {
    const { queryByTestId } = renderDialog({ open: false });
    expect(queryByTestId('book-edit-dialog')).toBeNull();
  });
});
