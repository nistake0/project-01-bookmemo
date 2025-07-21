import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { ErrorDialogContext } from './components/CommonErrorDialog';

// AuthProviderのモックを設定
jest.mock('./auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// 共通のモック関数
export const mockSetGlobalError = jest.fn();

// 共通のErrorDialogContextモック
export const mockErrorContext = {
  setGlobalError: mockSetGlobalError,
};

// テスト用のテーマ
export const testTheme = createTheme();

/**
 * コンポーネントテスト用のレンダリング関数
 * ThemeProvider、ErrorDialogContext、BrowserRouterでラップ
 */
export const renderWithProviders = (component) => {
  return render(
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ErrorDialogContext.Provider>
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
 * テスト前のモックリセット
 */
export const resetMocks = () => {
  jest.clearAllMocks();
  mockSetGlobalError.mockClear();
};

/**
 * 共通のモック設定
 */
export const setupCommonMocks = () => {
  // AuthProvider モック
  jest.mock('./auth/AuthProvider', () => ({
    useAuth: () => ({
      user: { uid: 'test-user-id' },
      loading: false,
    }),
  }));

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