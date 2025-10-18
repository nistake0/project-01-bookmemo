import { FULL_TEXT_SEARCH_CONFIG, validateConfig } from './fullTextSearchConfig';

describe('fullTextSearchConfig', () => {
  describe('FULL_TEXT_SEARCH_CONFIG', () => {
    test('最小検索文字数が定義されている', () => {
      expect(FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH).toBe('number');
      expect(FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH).toBeGreaterThan(0);
    });

    test('キャッシュ設定が定義されている', () => {
      expect(FULL_TEXT_SEARCH_CONFIG.CACHE_KEY).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.CACHE_KEY).toBe('string');
      
      expect(FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS).toBe('number');
      expect(FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS).toBeGreaterThan(0);
      
      expect(FULL_TEXT_SEARCH_CONFIG.CACHE_EXPIRY_MS).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.CACHE_EXPIRY_MS).toBe('number');
      expect(FULL_TEXT_SEARCH_CONFIG.CACHE_EXPIRY_MS).toBeGreaterThan(0);
    });

    test('レート制限設定が定義されている', () => {
      expect(FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS).toBe('number');
      expect(FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS).toBeGreaterThanOrEqual(0);
    });

    test('エラーメッセージが定義されている', () => {
      expect(FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES.TOO_SHORT).toBe('function');
      expect(typeof FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES.RATE_LIMITED).toBe('function');
      expect(typeof FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES.SEARCH_FAILED).toBe('string');
    });

    test('エラーメッセージ関数が正しく動作する', () => {
      const tooShortMsg = FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES.TOO_SHORT(2);
      expect(tooShortMsg).toContain('2');
      expect(tooShortMsg).toContain('文字');
      
      const rateLimitMsg = FULL_TEXT_SEARCH_CONFIG.ERROR_MESSAGES.RATE_LIMITED(5);
      expect(rateLimitMsg).toContain('5');
      expect(rateLimitMsg).toContain('秒');
    });

    test('UI設定が定義されている', () => {
      expect(FULL_TEXT_SEARCH_CONFIG.PLACEHOLDER).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.PLACEHOLDER).toBe('string');
      
      expect(FULL_TEXT_SEARCH_CONFIG.DESCRIPTION).toBeDefined();
      expect(typeof FULL_TEXT_SEARCH_CONFIG.DESCRIPTION).toBe('string');
    });
  });

  describe('validateConfig', () => {
    test('デフォルト設定が有効である', () => {
      expect(() => validateConfig()).not.toThrow();
      expect(validateConfig()).toBe(true);
    });

    test('MIN_SEARCH_LENGTHが1未満の場合はエラー', () => {
      const originalValue = FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH;
      FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH = 0;
      
      expect(() => validateConfig()).toThrow('MIN_SEARCH_LENGTH must be at least 1');
      
      FULL_TEXT_SEARCH_CONFIG.MIN_SEARCH_LENGTH = originalValue;
    });

    test('CACHE_MAX_ITEMSが1未満の場合はエラー', () => {
      const originalValue = FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS;
      FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS = 0;
      
      expect(() => validateConfig()).toThrow('CACHE_MAX_ITEMS must be at least 1');
      
      FULL_TEXT_SEARCH_CONFIG.CACHE_MAX_ITEMS = originalValue;
    });

    test('RATE_LIMIT_MSが負の場合はエラー', () => {
      const originalValue = FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS;
      FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS = -1;
      
      expect(() => validateConfig()).toThrow('RATE_LIMIT_MS must be non-negative');
      
      FULL_TEXT_SEARCH_CONFIG.RATE_LIMIT_MS = originalValue;
    });
  });
});

