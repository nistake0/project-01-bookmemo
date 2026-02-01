import { parseUrls, hasUrl } from './textUtils';

describe('textUtils', () => {
  describe('parseUrls', () => {
    it('空文字・null・undefined で空配列を返す', () => {
      expect(parseUrls('')).toEqual([]);
      expect(parseUrls(null)).toEqual([]);
      expect(parseUrls(undefined)).toEqual([]);
    });

    it('URLを含まないテキストをそのまま返す', () => {
      expect(parseUrls('ただのテキスト')).toEqual([{ text: 'ただのテキスト', isUrl: false }]);
      expect(parseUrls('Hello world')).toEqual([{ text: 'Hello world', isUrl: false }]);
    });

    it('単一のURLを検出する', () => {
      const result = parseUrls('https://example.com');
      expect(result).toEqual([{ text: 'https://example.com', isUrl: true }]);
    });

    it('httpのURLを検出する', () => {
      const result = parseUrls('http://example.com');
      expect(result).toEqual([{ text: 'http://example.com', isUrl: true }]);
    });

    it('テキスト中のURLを検出する', () => {
      const result = parseUrls('詳細は https://example.com を参照');
      expect(result).toEqual([
        { text: '詳細は ', isUrl: false },
        { text: 'https://example.com', isUrl: true },
        { text: ' を参照', isUrl: false },
      ]);
    });

    it('複数URLを検出する', () => {
      const result = parseUrls('a https://a.com b https://b.com c');
      expect(result).toEqual([
        { text: 'a ', isUrl: false },
        { text: 'https://a.com', isUrl: true },
        { text: ' b ', isUrl: false },
        { text: 'https://b.com', isUrl: true },
        { text: ' c', isUrl: false },
      ]);
    });

    it('括弧や改行でURLを終端する', () => {
      const result = parseUrls('(https://example.com)');
      expect(result).toEqual([
        { text: '(', isUrl: false },
        { text: 'https://example.com', isUrl: true },
        { text: ')', isUrl: false },
      ]);
    });

    it('スペースでURLを終端する', () => {
      const result = parseUrls('see https://example.com/page more');
      expect(result[1].text).toBe('https://example.com/page');
    });
  });

  describe('hasUrl', () => {
    it('URLを含む場合 true', () => {
      expect(hasUrl('https://example.com')).toBe(true);
      expect(hasUrl('text https://example.com')).toBe(true);
      expect(hasUrl('http://a.co')).toBe(true);
    });

    it('URLを含まない場合 false', () => {
      expect(hasUrl('')).toBe(false);
      expect(hasUrl('ただのテキスト')).toBe(false);
      expect(hasUrl(null)).toBe(false);
      expect(hasUrl(undefined)).toBe(false);
    });
  });
});
