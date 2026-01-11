import { renderHook, waitFor } from '@testing-library/react';
import { useBookLookup } from './useBookLookup';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...args) => args.join('/')),
  query: jest.fn((...args) => ({ args })),
  where: jest.fn((...args) => ({ whereArgs: args })),
  getDocs: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

describe('useBookLookup', () => {
  const firestore = require('firebase/firestore');
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('fetches books and sorts by title', async () => {
    firestore.getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'b1',
          data: () => ({
            title: 'ゼロ秒思考',
            author: '赤羽雄二',
            status: 'finished',
            updatedAt: { seconds: 200 },
          }),
        },
        {
          id: 'b2',
          data: () => ({
            title: 'Atomic Habits',
            author: 'James Clear',
            status: 'reading',
            updatedAt: { seconds: 300 },
          }),
        },
      ],
    });

    const { result } = renderHook(() => useBookLookup());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.books).toHaveLength(2);
    expect(result.current.books[0].title).toBe('Atomic Habits');
    expect(result.current.books[1].title).toBe('ゼロ秒思考');
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error gracefully', async () => {
    firestore.getDocs.mockRejectedValueOnce(new Error('firestore error'));

    const { result } = renderHook(() => useBookLookup());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.books).toEqual([]);
    expect(result.current.error).toBe('書籍リストの取得に失敗しました。');
  });
});
