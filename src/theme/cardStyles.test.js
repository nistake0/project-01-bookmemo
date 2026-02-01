import { createThemeFromPreset } from './createThemeFromPreset';
import { getBookCardSx, getMemoCardSx, getBookAccent, getMemoAccent, getBookDecorations, getMemoDecorations } from './cardStyles';

const mockBuildPath = (path) => `https://example.com${path}`;

describe('cardStyles', () => {
  const themeWithCustom = createThemeFromPreset('library-classic', mockBuildPath);
  const themeMinimal = createThemeFromPreset('minimal-light', mockBuildPath);
  const themeEmpty = { custom: undefined, palette: undefined };

  describe('getBookCardSx', () => {
    it('theme を渡すと sx オブジェクトを返す', () => {
      const sx = getBookCardSx(themeWithCustom);
      expect(sx).toBeDefined();
      expect(typeof sx).toBe('object');
      expect(sx.backgroundColor).toBeDefined();
      expect(sx.border).toBeDefined();
      expect(sx.borderRadius).toBe(3);
      expect(sx.boxShadow).toBeDefined();
      expect(sx['&:hover']).toBeDefined();
    });

    it('theme.custom 未定義時もフォールバックで sx を返す', () => {
      const sx = getBookCardSx(themeEmpty);
      expect(sx).toBeDefined();
      expect(sx.border).toContain('rgba(139, 69, 19'); // FALLBACK_BROWN
    });

    it('hover: false でホバースタイルを含まない', () => {
      const sx = getBookCardSx(themeWithCustom, { hover: false });
      expect(sx['&:hover']).toBeUndefined();
    });

    it('hoverTransform: false で translateY を含まない', () => {
      const sx = getBookCardSx(themeWithCustom, { hoverTransform: false });
      expect(sx['&:hover']?.transform).toBeUndefined();
    });

    it('overrides で sx をマージする', () => {
      const sx = getBookCardSx(themeWithCustom, { overrides: { cursor: 'default' } });
      expect(sx.cursor).toBe('default');
    });

    it('library-classic と minimal-light で accent 色が異なる', () => {
      const sxClassic = getBookCardSx(themeWithCustom);
      const sxMinimal = getBookCardSx(themeMinimal);
      expect(sxClassic.border).toContain('139, 69, 19');
      expect(sxMinimal.border).toContain('100, 100, 100');
    });
  });

  describe('getMemoCardSx', () => {
    it('theme を渡すと sx オブジェクトを返す', () => {
      const sx = getMemoCardSx(themeWithCustom);
      expect(sx).toBeDefined();
      expect(sx.border).toContain('123, 104, 238'); // memo purple
    });

    it('デフォルトで hoverTransform を含まない', () => {
      const sx = getMemoCardSx(themeWithCustom);
      expect(sx['&:hover']?.transform).toBeUndefined();
    });

    it('theme.custom 未定義時もフォールバックで sx を返す', () => {
      const sx = getMemoCardSx(themeEmpty);
      expect(sx).toBeDefined();
      expect(sx.border).toContain('123, 104, 238');
    });

    it('useMemoAccentShadow で memo 用の影を使用する', () => {
      const sx = getMemoCardSx(themeWithCustom, { useMemoAccentShadow: true });
      expect(sx.boxShadow).toContain('6px 24px');
      expect(sx.boxShadow).toContain('123, 104, 238');
    });
  });

  describe('getBookAccent', () => {
    it('key と palette を返す', () => {
      const acc = getBookAccent(themeWithCustom);
      expect(acc.key).toBe('brown');
      expect(acc.palette).toHaveProperty('light');
      expect(acc.palette).toHaveProperty('lighter');
    });

    it('minimal-light では key が neutral', () => {
      const acc = getBookAccent(themeMinimal);
      expect(acc.key).toBe('neutral');
    });
  });

  describe('getMemoAccent', () => {
    it('library-classic では key が memo', () => {
      const acc = getMemoAccent(themeWithCustom);
      expect(acc.key).toBe('memo');
      expect(acc.palette).toHaveProperty('shadow');
    });

    it('minimal-light では key が neutral', () => {
      const acc = getMemoAccent(themeMinimal);
      expect(acc.key).toBe('neutral');
    });
  });

  describe('getBookDecorations', () => {
    it('library-classic では corners が true', () => {
      const dec = getBookDecorations(themeWithCustom);
      expect(dec.corners).toBe(true);
      expect(dec.innerBorder).toBe(true);
    });

    it('minimal-light では corners が false', () => {
      const dec = getBookDecorations(themeMinimal);
      expect(dec.corners).toBe(false);
    });
  });

  describe('getMemoDecorations', () => {
    it('library-classic では centerLine が false', () => {
      const dec = getMemoDecorations(themeWithCustom);
      expect(dec.centerLine).toBe(false);
    });

    it('library-classic では foldedCorner が true、borderRadius が 0', () => {
      const dec = getMemoDecorations(themeWithCustom);
      expect(dec.foldedCorner).toBe(true);
      expect(dec.borderRadius).toBe(0);
    });

    it('minimal-light では foldedCorner がない', () => {
      const dec = getMemoDecorations(themeMinimal);
      expect(dec.foldedCorner).toBeFalsy();
    });
  });

  describe('getMemoCardSx foldedCorner', () => {
    it('library-classic では borderRadius 0 と折り目用 ::after を含む', () => {
      const sx = getMemoCardSx(themeWithCustom);
      expect(sx.borderRadius).toBe(0);
      expect(sx['&::after']).toBeDefined();
      expect(sx['&::after'].borderStyle).toBe('solid');
      expect(sx['&::after'].borderWidth).toContain('20px');
    });

    it('minimal-light では borderRadius 3（デフォルト）で折り目なし', () => {
      const sx = getMemoCardSx(themeMinimal);
      expect(sx.borderRadius).toBe(3);
      expect(sx['&::after']).toBeUndefined();
    });
  });
});
