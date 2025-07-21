import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { ErrorDialogContext } from './components/CommonErrorDialog';

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
export const renderWithProviders = (component, options = {}) => {
  const {
    theme = testTheme,
    errorContext = mockErrorContext,
    ...renderOptions
  } = options;

  return render(
    <ThemeProvider theme={theme}>
      <ErrorDialogContext.Provider value={errorContext}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ErrorDialogContext.Provider>
    </ThemeProvider>,
    renderOptions
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