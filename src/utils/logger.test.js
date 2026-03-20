import { logger, LOG_LEVELS, LOG_CATEGORIES, devLog, getAppEnv } from './logger';

/**
 * ログ管理システムのユニットテスト
 */

// console.log, console.error, console.warn, console.infoをモック
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// 元のconsoleを保存
const originalConsole = global.console;

// consoleをモック
beforeAll(() => {
  global.console = mockConsole;
});

afterAll(() => {
  global.console = originalConsole;
});

describe('devLog / getAppEnv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAppEnv がオブジェクトを返す', () => {
    const env = getAppEnv();
    expect(env).toMatchObject({
      DEV: expect.any(Boolean),
      PROD: expect.any(Boolean),
      MODE: expect.any(String),
    });
  });

  it('テスト環境では devLog が console.log を呼ぶ', () => {
    devLog('hello', { x: 1 });
    expect(mockConsole.log).toHaveBeenCalledWith('hello', { x: 1 });
  });
});

describe('logger', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
  });

  describe('基本ログ機能', () => {
    it('errorログが正しく出力される', () => {
      logger.error(LOG_CATEGORIES.ERROR, 'Test error message', { test: 'data' });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('warnログが正しく出力される', () => {
      logger.warn(LOG_CATEGORIES.BOOK, 'Test warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('BOOK')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('infoログが正しく出力される', () => {
      logger.info(LOG_CATEGORIES.MEMO, 'Test info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('MEMO')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('debugログが正しく出力される', () => {
      logger.debug(LOG_CATEGORIES.STATUS, 'Test debug message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('STATUS')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });
  });

  describe('カテゴリ別ヘルパー関数', () => {
    it('authカテゴリのログが正しく出力される', () => {
      logger.auth.error('Auth error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('🔐 AUTH')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Auth error message')
      );
    });

    it('bookカテゴリのログが正しく出力される', () => {
      logger.book.info('Book info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('📖 BOOK')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Book info message')
      );
    });

    it('memoカテゴリのログが正しく出力される', () => {
      logger.memo.debug('Memo debug message');
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('📝 MEMO')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Memo debug message')
      );
    });

    it('statusカテゴリのログが正しく出力される', () => {
      logger.status.warn('Status warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('📊 STATUS')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Status warning message')
      );
    });

    it('firebaseカテゴリのログが正しく出力される', () => {
      logger.firebase.error('Firebase error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('🔥 FIREBASE')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Firebase error message')
      );
    });
  });

  describe('データ付きログ', () => {
    it('データ付きログが正しく出力される', () => {
      const testData = { userId: '123', bookId: '456' };
      logger.info(LOG_CATEGORIES.BOOK, 'Test message', testData);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Data:')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId": "123"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"bookId": "456"')
      );
    });

    it('nullデータでもエラーにならない', () => {
      expect(() => {
        logger.info(LOG_CATEGORIES.BOOK, 'Test message', null);
      }).not.toThrow();
    });

    it('undefinedデータでもエラーにならない', () => {
      expect(() => {
        logger.info(LOG_CATEGORIES.BOOK, 'Test message', undefined);
      }).not.toThrow();
    });
  });

  describe('タイムスタンプ', () => {
    it('ログにタイムスタンプが含まれる', () => {
      logger.info(LOG_CATEGORIES.BOOK, 'Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });
});
