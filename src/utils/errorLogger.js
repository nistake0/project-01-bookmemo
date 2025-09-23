// エラーログの永続化とグローバルエラーハンドリング、デバッグ支援
import { PATHS } from '../config/paths';

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
    const errors = ErrorLogger.getErrors();
    if (errors.length > 0) {
      console.log('📋 Error logs available in localStorage: bookmemo_error_logs');
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
      console.log('✅ Error logs cleared');
    },
    showDebugInfo: () => {
      console.log('🔧 Current Debug Info:');
      console.log('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
      console.log('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
      console.log('- Current URL:', window.location.href);
      console.log('- User Agent:', navigator.userAgent);
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
      console.log('📍 Current Route Info:', info);
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
      console.log('💾 LocalStorage Data:', data);
      return data;
    },
    testErrorLogging: () => {
      console.log('🧪 Testing error logging...');
      ErrorLogger.saveError(new Error('Test error from debug command'), 'Debug Test');
      console.log('✅ Test error logged');
    }
  };

  console.log('🔧 Debug commands available:');
  console.log('- bookmemoDebug.getErrors() - Show error logs');
  console.log('- bookmemoDebug.clearErrors() - Clear error logs');
  console.log('- bookmemoDebug.showDebugInfo() - Show debug info');
  console.log('- bookmemoDebug.getCurrentRoute() - Show current route info');
  console.log('- bookmemoDebug.getLocalStorage() - Show localStorage data');
  console.log('- bookmemoDebug.testErrorLogging() - Test error logging');
};

export const showDebugInfo = () => {
  if (typeof window === 'undefined') return;
  if (PATHS.IS_DEVELOPMENT()) {
    console.log('🔧 Debug Info:');
    console.log('- Environment:', PATHS.IS_PRODUCTION() ? 'Production' : 'Development');
    console.log('- Base Path:', PATHS.IS_PRODUCTION() ? '/project-01-bookmemo' : '');
    console.log('- Current URL:', window.location.href);
    console.log('- User Agent:', navigator.userAgent);

    const errors = ErrorLogger.getErrors();
    if (errors.length > 0) {
      console.log('📋 Previous Error Logs:', errors);
    }
  }

  registerDebugCommands();
};

export default ErrorLogger;


