import { getBackgroundPresets, BACKGROUND_PRESET_IDS } from './backgroundPresets';

const mockBuildPath = (path) => `https://example.com${path}`;

describe('backgroundPresets', () => {
  describe('BACKGROUND_PRESET_IDS', () => {
    it('none, library, library-patterned, bookshelf を含む', () => {
      expect(BACKGROUND_PRESET_IDS).toContain('none');
      expect(BACKGROUND_PRESET_IDS).toContain('library');
      expect(BACKGROUND_PRESET_IDS).toContain('library-patterned');
      expect(BACKGROUND_PRESET_IDS).toContain('bookshelf');
    });
  });

  describe('getBackgroundPresets', () => {
    it('すべてのプリセットを返す', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      expect(presets.none).toBeDefined();
      expect(presets.library).toBeDefined();
      expect(presets['library-patterned']).toBeDefined();
    });

    it('none は type solid で image/pattern が null', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      const none = presets.none;
      expect(none.id).toBe('none');
      expect(none.type).toBe('solid');
      expect(none.image).toBeNull();
      expect(none.pattern).toBeNull();
      expect(none.thumbnail).toBeNull();
    });

    it('library は type image で image を持つ', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      const library = presets.library;
      expect(library.id).toBe('library');
      expect(library.type).toBe('image');
      expect(library.image).toContain('backgrounds/library.jpg');
      expect(library.image).toContain('https://example.com');
      expect(library.pattern).toBeNull();
    });

    it('library-patterned は image と pattern を持つ', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      const lp = presets['library-patterned'];
      expect(lp.id).toBe('library-patterned');
      expect(lp.type).toBe('image');
      expect(lp.image).toContain('backgrounds/library.jpg');
      expect(lp.pattern).toContain('backgrounds/library-pattern.svg');
    });

    it('bookshelf プリセットを含む', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      expect(presets.bookshelf).toBeDefined();
      expect(presets.bookshelf.id).toBe('bookshelf');
      expect(presets.bookshelf.image).toContain('backgrounds/bookshelf.jpg');
    });
  });
});
