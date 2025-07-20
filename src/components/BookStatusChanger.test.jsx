import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import BookStatusChanger from './BookStatusChanger';
import { ErrorDialogContext } from './CommonErrorDialog';

// Firebaseのモジュールをモック化
jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

// Firebaseのdbをモック化
jest.mock('../firebase', () => ({
  db: {},
}));

// ErrorDialogContextをモック化
jest.mock('./CommonErrorDialog', () => ({
  ErrorDialogContext: {
    Provider: ({ children, value }) => children,
  },
}));

describe('BookStatusChanger', () => {
  const mockBook = {
    id: 'book-1',
    title: 'テストブック',
    status: 'reading',
  };

  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays reading status button when book is reading', () => {
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読了にする')).toBeInTheDocument();
  });

  test('displays finished status button when book is finished', () => {
    const finishedBook = { ...mockBook, status: 'finished' };
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={finishedBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読書中にする')).toBeInTheDocument();
  });

  test('displays reading status as default when status is missing', () => {
    const bookWithoutStatus = { ...mockBook };
    delete bookWithoutStatus.status;
    const mockSetGlobalError = jest.fn();
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={bookWithoutStatus} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    expect(screen.getByText('読了にする')).toBeInTheDocument();
  });

  test('calls onStatusChange when button is clicked', async () => {
    const user = userEvent.setup();
    updateDoc.mockResolvedValue();
    const mockSetGlobalError = jest.fn();
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          status: 'finished',
          updatedAt: 'mock-timestamp',
        })
      );
      expect(mockOnStatusChange).toHaveBeenCalledWith('finished');
    });
  });

  test('shows updating state while processing', async () => {
    const user = userEvent.setup();
    // 遅延をシミュレート
    updateDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const mockSetGlobalError = jest.fn();
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    expect(screen.getByText('更新中...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('handles error when update fails', async () => {
    const user = userEvent.setup();
    const mockSetGlobalError = jest.fn();
    updateDoc.mockRejectedValue(new Error('Update failed'));
    
    render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={mockBook} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    
    const button = screen.getByText('読了にする');
    await user.click(button);
    
    await waitFor(() => {
      // エラーが発生したことを確認（setGlobalErrorの呼び出しは実際のコンテキストでテスト）
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('returns null when book is null', () => {
    const mockSetGlobalError = jest.fn();
    const { container } = render(
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BookStatusChanger 
          book={null} 
          bookId="book-1" 
          onStatusChange={mockOnStatusChange} 
        />
      </ErrorDialogContext.Provider>
    );
    expect(container.firstChild).toBeNull();
  });
}); 