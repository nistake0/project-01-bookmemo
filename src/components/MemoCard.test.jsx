import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoCard from './MemoCard';

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

describe('MemoCard', () => {
  const mockMemo = {
    id: 'memo1',
    text: 'テストメモの内容',
    comment: 'テストコメント',
    page: 123,
    tags: ['テスト', 'サンプル'],
    createdAt: { toDate: () => new Date('2024-01-01') }
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders memo card with all information', () => {
    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.getByText('テストコメント')).toBeInTheDocument();
    expect(screen.getByText('p.123')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('サンプル')).toBeInTheDocument();
    expect(screen.getByText('2024/1/1')).toBeInTheDocument();
  });

  it('renders memo card with minimal information', () => {
    const minimalMemo = {
      id: 'memo2',
      text: '最小限のメモ',
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={minimalMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('最小限のメモ')).toBeInTheDocument();
    expect(screen.queryByText('p.')).not.toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const editButton = screen.getByLabelText('edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockMemo);
  });

  it('calls onDelete when delete button is clicked', () => {
    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('memo1');
  });

  it('handles memo without createdAt.toDate method', () => {
    const memoWithoutDate = {
      id: 'memo3',
      text: '日付なしメモ',
      createdAt: null
    };

    renderWithProviders(
      <MemoCard 
        memo={memoWithoutDate} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('日付なしメモ')).toBeInTheDocument();
    expect(screen.queryByText('1/1/2024')).not.toBeInTheDocument();
  });

  it('handles memo with empty text', () => {
    const emptyMemo = {
      id: 'memo4',
      text: '',
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={emptyMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByTestId('memo-card')).toBeInTheDocument();
  });

  it('handles memo with null tags', () => {
    const memoWithNullTags = {
      id: 'memo5',
      text: 'タグなしメモ',
      tags: null,
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={memoWithNullTags} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('タグなしメモ')).toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });
}); 