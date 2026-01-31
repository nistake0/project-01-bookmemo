import { getThemePresets, THEME_PRESET_IDS } from './themePresets';

const mockBuildPath = (path) => `https://example.com${path}`;

describe('themePresets', () => {
  describe('getThemePresets', () => {
    it('library-classic と minimal-light を返す', () => {
      const presets = getThemePresets(mockBuildPath);
      expect(presets['library-classic']).toBeDefined();
      expect(presets['minimal-light']).toBeDefined();
    });

    it('library-classic に bookAccent, memoAccent を含む', () => {
      const presets = getThemePresets(mockBuildPath);
      const classic = presets['library-classic'];
      expect(classic.bookAccent).toBe('brown');
      expect(classic.memoAccent).toBe('memo');
    });

    it('minimal-light に bookAccent, memoAccent を含む', () => {
      const presets = getThemePresets(mockBuildPath);
      const minimal = presets['minimal-light'];
      expect(minimal.bookAccent).toBe('neutral');
      expect(minimal.memoAccent).toBe('neutral');
    });

    it('library-classic と minimal-light で bookAccent が異なる', () => {
      const presets = getThemePresets(mockBuildPath);
      expect(presets['library-classic'].bookAccent).not.toBe(presets['minimal-light'].bookAccent);
    });

    it('library-classic と minimal-light で memoAccent が異なる', () => {
      const presets = getThemePresets(mockBuildPath);
      expect(presets['library-classic'].memoAccent).not.toBe(presets['minimal-light'].memoAccent);
    });

    it('bookDecorations, memoDecorations を含む', () => {
      const presets = getThemePresets(mockBuildPath);
      const classic = presets['library-classic'];
      expect(classic.bookDecorations).toBeDefined();
      expect(classic.memoDecorations).toBeDefined();
      expect(classic.bookDecorations.corners).toBe(true);
      expect(classic.memoDecorations.centerLine).toBe(false);
    });

    it('buildPath を使って背景画像の URL を構築する', () => {
      const presets = getThemePresets(mockBuildPath);
      const classic = presets['library-classic'];
      expect(classic.background.image).toContain('https://example.com');
      expect(classic.background.image).toContain('library-background.jpg');
    });
  });

  describe('THEME_PRESET_IDS', () => {
    it('library-classic と minimal-light を含む', () => {
      expect(THEME_PRESET_IDS).toContain('library-classic');
      expect(THEME_PRESET_IDS).toContain('minimal-light');
    });
  });
});
