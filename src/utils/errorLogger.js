// エラーログの永続化とグローバルエラーハンドリング、デバッグ支援
import { PATHS } from '../config/paths';
import { devLog } from './logger';

export const ErrorLogger = {
  saveError: (error, context = '') => {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack || '',
        context,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };

      const existingLogs = JSON.parse(localStorage.getItem('bookmemo_error_logs') || '[]');
      existingLogs.push(errorLog);

      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }

      localStorage.setItem('bookmemo_error_logs', JSON.stringify(existingLogs));
      console.error('🔴 PERSISTENT ERROR LOG:', errorLog);
      return errorLog;
    } catch (e) {
      console.error('Error saving error log:', e);
    }
  },

  getErrors: () => {
    try {
      return JSON.parse(localStorage.getItem('bookmemo_error_logs') || '[]');
    } catch (e) {
      return [];
    }
  },

  clearErrors: () => {
    localStorage.removeItem('bookmemo_error_logs');
  }
};

export const setupGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    ErrorLogger.saveError(event.error, 'Global Error Handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.saveError(event.reason, 'Unhandled Promise Rejection');
  });

  window.addEventListener('beforeunload', () => {
    if (PATHS.IS_DEVELOPMENT()) {
      const errors = ErrorLogger.getErrors();
      if (errors.length > 0) {
        devLog('📋 Error logs available in localStorage: bookmemo_error_logs');
      }
    }
  });
};

const registerDebugCommands = () => {
  if (typeof window === 'undefined') return;

  window.bookmemoDebug = {
    getErrors: () => {
      const errors = ErrorLogger.getErrors();
      console.table(errors);
      return errors;
    },
    clearErrors: () => {
      ErrorLogger.clearErrors();
      devLog('✅ Error logs cleared');
    },
    showDebugInfo: () => {
      devLog('🔧 Current Debug Info:');
      devLog('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
      devLog('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
      devLog('- Current URL:', window.location.href);
      devLog('- User Agent:', navigator.userAgent);
    },
    getCurrentRoute: () => {
      const info = {
        pathname: window.location.pathname,
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      devLog('📍 Current Route Info:', info);
      return info;
    },
    getLocalStorage: () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      devLog('💾 LocalStorage Data:', data);
      return data;
    },
    testErrorLogging: () => {
      devLog('🧪 Testing error logging...');
      ErrorLogger.saveError(new Error('Test error from debug command'), 'Debug Test');
      devLog('✅ Test error logged');
    }
  };

  devLog('🔧 Debug commands available:');
  devLog('- bookmemoDebug.getErrors() - Show error logs');
  devLog('- bookmemoDebug.clearErrors() - Clear error logs');
  devLog('- bookmemoDebug.showDebugInfo() - Show debug info');
  devLog('- bookmemoDebug.getCurrentRoute() - Show current route info');
  devLog('- bookmemoDebug.getLocalStorage() - Show localStorage data');
  devLog('- bookmemoDebug.testErrorLogging() - Test error logging');
};

export const showDebugInfo = () => {
  if (typeof window === 'undefined') return;
  if (PATHS.IS_DEVELOPMENT()) {
    devLog('🔧 Debug Info:');
    devLog('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
    devLog('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
    devLog('- Current URL:', window.location.href);
    devLog('- User Agent:', navigator.userAgent);

    const errors = ErrorLogger.getErrors();
    if (errors.length > 0) {
      devLog('📋 Previous Error Logs:', errors);
    }
    // 本番環境ではデバッグコマンドを登録しない（localStorage など機密情報の露出防止）
    registerDebugCommands();
  }
};

export default ErrorLogger;


