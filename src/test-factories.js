/**
 * テストデータファクトリー
 * 一貫したテストデータを生成し、テストの保守性を向上させる
 */

/**
 * メモデータのファクトリー
 */
export const createMockMemo = (overrides = {}) => ({
  id: 'memo-1',
  text: 'テストメモ',
  comment: 'テストコメント',
  page: 123,
  tags: ['テスト'],
  createdAt: { toDate: () => new Date('2024-01-01T10:00:00') },
  updatedAt: { toDate: () => new Date('2024-01-01T10:00:00') },
  ...overrides
});

/**
 * 書籍データのファクトリー
 */
export const createMockBook = (overrides = {}) => ({
  id: 'book1',
  title: 'テスト本',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  publishDate: '2024-01-01',
  isbn: '978-4-1234-5678-9',
  status: 'reading',
  tags: ['小説', '技術書'],
  createdAt: { toDate: () => new Date('2024-01-01T10:00:00') },
  updatedAt: { toDate: () => new Date('2024-01-01T10:00:00') },
  ...overrides
});

/**
 * ユーザーデータのファクトリー
 */
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'テストユーザー',
  ...overrides
});

/**
 * テスト用のモックタグ
 */
export const createMockTag = (name = 'テスト') => ({
  name,
});

/**
 * Firestoreドキュメントのファクトリー
 */
export const createMockFirestoreDoc = (data, id = 'doc1') => ({
  id,
  data: () => data,
  exists: () => true,
});

/**
 * Firestoreクエリ結果のファクトリー
 */
export const createMockFirestoreQueryResult = (docs = []) => ({
  docs,
  forEach: (callback) => docs.forEach(callback),
  empty: docs.length === 0,
  size: docs.length,
});

/**
 * エラーオブジェクトのファクトリー
 */
export const createMockError = (message = 'テストエラー', code = 'TEST_ERROR') => ({
  message,
  code,
  name: 'TestError',
});

/**
 * テスト用のイベントファクトリー
 */
export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: {
    value: '',
    name: '',
  },
  ...overrides
});

/**
 * テスト用のモック関数ファクトリー
 */
export const createMockFunctions = () => ({
  mockOnClose: jest.fn(),
  mockOnUpdate: jest.fn(),
  mockOnDelete: jest.fn(),
  mockOnStatusChange: jest.fn(),
  mockOnTagsChange: jest.fn(),
  mockOnMemoAdded: jest.fn(),
  mockOnMemoUpdated: jest.fn(),
});

/**
 * テスト用のFirebase関数ファクトリー
 */
export const createMockFirebaseFunctions = () => ({
  mockUpdateMemo: jest.fn(() => Promise.resolve(true)),
  mockDeleteMemo: jest.fn(() => Promise.resolve(true)),
  mockAddMemo: jest.fn(() => Promise.resolve('new-memo-id')),
  mockFetchMemos: jest.fn(),
  mockUpdateBookStatus: jest.fn(() => Promise.resolve()),
  mockUpdateBookTags: jest.fn(() => Promise.resolve()),
}); 