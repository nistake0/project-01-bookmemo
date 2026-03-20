import { getBackgroundPresets, BACKGROUND_PRESET_IDS } from './backgroundPresets';

const mockBuildPath = (path) => `https://example.com${path}`;

describe('backgroundPresets', () => {
  describe('BACKGROUND_PRESET_IDS', () => {
    it('none と bg-01〜bg-10 を含む', () => {
      expect(BACKGROUND_PRESET_IDS).toContain('none');
      expect(BACKGROUND_PRESET_IDS).toContain('bg-01');
      expect(BACKGROUND_PRESET_IDS).toContain('bg-04');
      expect(BACKGROUND_PRESET_IDS).toContain('bg-10');
      expect(BACKGROUND_PRESET_IDS).toHaveLength(11);
    });
  });

  describe('getBackgroundPresets', () => {
    it('すべてのプリセットを返す', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      expect(presets.none).toBeDefined();
      expect(presets['bg-01']).toBeDefined();
      expect(presets['bg-04']).toBeDefined();
      expect(presets['bg-10']).toBeDefined();
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

    it('bg-04 は type image で image を持つ', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      const bg04 = presets['bg-04'];
      expect(bg04.id).toBe('bg-04');
      expect(bg04.type).toBe('image');
      expect(bg04.image).toContain('backgrounds/bg-04.jpg');
      expect(bg04.image).toContain('https://example.com');
      expect(bg04.pattern).toBeNull();
    });

    it('bg-01 プリセットを含む', () => {
      const presets = getBackgroundPresets(mockBuildPath);
      expect(presets['bg-01']).toBeDefined();
      expect(presets['bg-01'].id).toBe('bg-01');
      expect(presets['bg-01'].image).toContain('backgrounds/bg-01.jpg');
    });
  });
});
