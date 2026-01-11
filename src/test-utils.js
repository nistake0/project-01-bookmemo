import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { ErrorDialogContext } from './components/CommonErrorDialog';
import { appTheme } from './theme/appTheme';

// 共通のモック関数
export const mockSetGlobalError = jest.fn();

// 共通のErrorDialogContextモック
export const mockErrorContext = {
  setGlobalError: mockSetGlobalError,
};

// テスト用のテーマ（appThemeを使用）
export const testTheme = appTheme;

/**
 * コンポーネントテスト用のレンダリング関数
 * ThemeProvider、ErrorDialogContext、BrowserRouterでラップ
 */
export const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={appTheme}>
      <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ErrorDialogContext.Provider>
    </ThemeProvider>
  );
};

/**
 * フックテスト用のレンダリング関数
 * ErrorDialogContextをモック化
 */
export const renderHookWithProviders = (hook, options = {}) => {
  const { errorContext = mockErrorContext, ...hookOptions } = options;

  const wrapper = ({ children }) => (
    <ErrorDialogContext.Provider value={errorContext}>
      {children}
    </ErrorDialogContext.Provider>
  );

  return renderHook(hook, { wrapper, ...hookOptions });
};

/**
 * モックをリセットする関数
 */
export const resetMocks = () => {
  jest.clearAllMocks();
  
  // useAuthのモックを確実にリセット
  const { useAuth } = require('./auth/AuthProvider');
  if (useAuth && useAuth.mockClear) {
    useAuth.mockClear();
  }
  
  // Firestoreのモックをリセット
  const { getDocs, collection, query, where, orderBy } = require('firebase/firestore');
  if (getDocs && getDocs.mockClear) getDocs.mockClear();
  if (collection && collection.mockClear) collection.mockClear();
  if (query && query.mockClear) query.mockClear();
  if (where && where.mockClear) where.mockClear();
  if (orderBy && orderBy.mockClear) orderBy.mockClear();
};

/**
 * 実用的なモック共有システム
 * Jestの制約に合わせて、静的なモック定義を使用
 */

// 共通のモック設定
export const setupCommonMocks = () => {
  // useTagHistory モック
  jest.mock('./hooks/useTagHistory', () => ({
    useTagHistory: () => ({
      tagOptions: ['テスト', 'サンプル', 'メモ'],
      loading: false,
      fetchTagHistory: jest.fn(),
      saveTagsToHistory: jest.fn(),
    }),
  }));

  // useMemo モック
  const mockUpdateMemo = jest.fn(() => Promise.resolve(true));
  const mockDeleteMemo = jest.fn(() => Promise.resolve(true));

  jest.mock('./hooks/useMemo', () => ({
    useMemo: (bookId) => ({
      memos: [],
      loading: false,
      error: null,
      addMemo: jest.fn(() => Promise.resolve('new-memo-id')),
      updateMemo: mockUpdateMemo,
      deleteMemo: mockDeleteMemo,
      fetchMemos: jest.fn(),
    }),
  }));

  // useBook モック
  jest.mock('./hooks/useBook', () => ({
    useBook: () => ({
      book: null,
      loading: false,
      error: null,
      updateBookStatus: jest.fn(),
      updateBookTags: jest.fn(),
    }),
  }));

  return { mockUpdateMemo, mockDeleteMemo };
};

/**
 * 共通モック: useTagHistory
 */
export const mockUseTagHistory = (overrides = {}) => {
  return {
    tagOptions: ['テスト', 'サンプル', 'メモ'],
    loading: false,
    fetchTagHistory: jest.fn(),
    saveTagsToHistory: jest.fn(),
    ...overrides,
  };
};

/**
 * 共通モック: useBook
 */
export const mockUseBook = (overrides = {}) => {
  return {
    book: null,
    loading: false,
    error: null,
    updateBookStatus: jest.fn(),
    updateBookTags: jest.fn(),
    ...overrides,
  };
};

/**
 * 共通モック: useMemo
 */
export const mockUseMemo = (overrides = {}) => {
  return {
    memos: [],
    loading: false,
    error: null,
    addMemo: jest.fn(() => Promise.resolve('new-memo-id')),
    updateMemo: jest.fn(() => Promise.resolve(true)),
    deleteMemo: jest.fn(() => Promise.resolve(true)),
    fetchMemos: jest.fn(),
    ...overrides,
  };
};

/**
 * 共通モック: useAuth
 */
export const mockUseAuth = (overrides = {}) => ({
  user: { uid: 'test-user-id' },
  loading: false,
  ...overrides,
});

/**
 * 共通のコンポーネントモック
 * 個別ファイルでの重複を削減
 */
export const createComponentMocks = () => {
  return {
    // BookInfo モック
    BookInfo: ({ book, onStatusChange }) => (
      <div data-testid="book-info">
        <h1>{book?.title || 'タイトルなし'}</h1>
        <button onClick={() => onStatusChange?.('reading')} data-testid="status-change">ステータス変更</button>
      </div>
    ),

    // BookTagEditor モック
    BookTagEditor: ({ book, onTagsChange }) => (
      <div data-testid="book-tag-editor">
        <button onClick={() => onTagsChange?.(['tag1', 'tag2'])} data-testid="tags-change">タグ変更</button>
      </div>
    ),

    // MemoList モック
    MemoList: ({ bookId, onMemoUpdated }) => (
      <div data-testid="memo-list">
        <button onClick={() => onMemoUpdated?.()} data-testid="memo-updated">メモ更新</button>
      </div>
    ),

    // MemoAdd モック
    MemoAdd: ({ bookId, onMemoAdded }) => (
      <div data-testid="memo-add">
        <button onClick={() => onMemoAdded?.()} data-testid="memo-added">メモ追加</button>
      </div>
    ),

    // MemoCard モック
    MemoCard: ({ memo, onEdit, onDelete }) => (
      <div data-testid={`memo-card-${memo.id}`}>
        <span>{memo.text}</span>
        <button onClick={() => onEdit?.(memo)} data-testid={`edit-${memo.id}`}>編集</button>
        <button onClick={() => onDelete?.(memo.id)} data-testid={`delete-${memo.id}`}>削除</button>
      </div>
    ),

    // MemoEditor モック
    MemoEditor: ({ open, memo, onUpdate, onClose }) => {
      if (!open) return null;
      return (
        <div data-testid="memo-editor">
          <button onClick={() => {
            onUpdate?.();
            onClose?.();
          }} data-testid="update-button">更新</button>
        </div>
      );
    },
  };
}; 