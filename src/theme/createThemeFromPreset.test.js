import { createThemeFromPreset } from './createThemeFromPreset';

const mockBuildPath = (path) => `https://example.com${path}`;

describe('createThemeFromPreset', () => {
  it('library-classic で theme を生成する', () => {
    const theme = createThemeFromPreset('library-classic', mockBuildPath);
    expect(theme).toBeDefined();
    expect(theme.palette).toBeDefined();
    expect(theme.custom).toBeDefined();
  });

  it('minimal-light で theme を生成する', () => {
    const theme = createThemeFromPreset('minimal-light', mockBuildPath);
    expect(theme).toBeDefined();
    expect(theme.custom).toBeDefined();
  });

  it('slim-compact で theme を生成し typography が縮小される', () => {
    const theme = createThemeFromPreset('slim-compact', mockBuildPath);
    expect(theme).toBeDefined();
    expect(theme.custom).toBeDefined();
    expect(theme.typography.h1.fontSize).toBe('1.58rem');
    expect(theme.typography.body1.fontSize).toBe('0.79rem');
  });

  it('slim-compact で layout が theme.custom に含まれる', () => {
    const theme = createThemeFromPreset('slim-compact', mockBuildPath);
    expect(theme.custom.layout).toBeDefined();
    expect(theme.custom.layout.bookListGrid).toMatchObject({
      gridTemplateColumns: expect.any(Object),
      gap: expect.any(Object),
    });
    expect(theme.custom.layout.searchResultsGrid?.gridTemplateColumns).toBeDefined();
  });

  describe('theme.custom', () => {
    it('cardAccent を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('cardAccent');
      expect(theme.custom.cardAccent).toBe('brown');
    });

    it('cardDecorations を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('cardDecorations');
      expect(theme.custom.cardDecorations).toMatchObject({
        corners: true,
        innerBorder: true,
        centerLine: true,
      });
    });

    it('glassEffect を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('glassEffect');
      expect(theme.custom.glassEffect).toMatchObject({
        opacity: 0.75,
        blur: '20px',
        saturate: '180%',
      });
    });

    it('pageHeader を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('pageHeader');
      expect(theme.custom.pageHeader).toHaveProperty('accentKey');
    });

    it('cardShadow と cardShadowHover を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('cardShadow');
      expect(theme.custom).toHaveProperty('cardShadowHover');
      expect(typeof theme.custom.cardShadow).toBe('string');
      expect(typeof theme.custom.cardShadowHover).toBe('string');
      expect(theme.custom.cardShadow).toContain('8px 32px');
      expect(theme.custom.cardShadowHover).toContain('12px 40px');
    });

    it('unknown presetId の場合はデフォルトプリセットを使用する', () => {
      const theme = createThemeFromPreset('unknown-preset', mockBuildPath);
      expect(theme).toBeDefined();
      expect(theme.custom.cardAccent).toBeDefined();
      expect(theme.custom.cardShadow).toBeDefined();
    });

    it('chartColors を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('chartColors');
      expect(theme.custom.chartColors).toHaveProperty('bar', '#42a5f5');
      expect(theme.custom.chartColors).toHaveProperty('memo', '#9c27b0');
    });

    it('motion.infoCardHover を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('motion');
      expect(theme.custom.motion).toHaveProperty('infoCardHover');
      expect(theme.custom.motion.infoCardHover).toMatchObject({
        transition: 'transform 0.2s ease-in-out',
        hoverTransform: 'translateY(-2px)',
      });
    });

    it('loadingIndicator を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom.loadingIndicator).toBeDefined();
      expect(theme.custom.loadingIndicator.accentKey).toBe('brown');
      expect(theme.custom.loadingIndicator.container.backgroundColor).toContain('255, 248, 240');
    });

    it('minimal-light の loadingIndicator は accentKey neutral', () => {
      const theme = createThemeFromPreset('minimal-light', mockBuildPath);
      expect(theme.custom.loadingIndicator.accentKey).toBe('neutral');
    });

    it('layout は library-classic では undefined', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom.layout).toBeUndefined();
    });

    it('mode: dark で palette.mode が dark になり custom.isDark が true', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath, 'dark');
      expect(theme.palette.mode).toBe('dark');
      expect(theme.custom.isDark).toBe(true);
      expect(theme.palette.text.primary).toBe('#ffffff');
    });

    it('mode: dark で effectivePreset の dark 値が適用される', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath, 'dark');
      expect(theme.palette.background.default).toBe('#1a1a24');
      expect(theme.custom.cardShadow).toContain('inset 0 1px 0 rgba(255, 255, 255, 0.06)');
    });

    it('typographyOverrides, sizes, spacing を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('typographyOverrides');
      expect(theme.custom.typographyOverrides).toHaveProperty('cardTitle');
      expect(theme.custom.typographyOverrides.cardTitle.fontSize).toBeDefined();
      expect(theme.custom).toHaveProperty('sizes');
      expect(theme.custom.sizes.bookCoverCard).toMatchObject({
        width: { xs: 50, sm: 60 },
        height: { xs: 70, sm: 80 },
      });
      expect(theme.custom.sizes.bookCard).toHaveProperty('minHeight');
      expect(theme.custom.sizes.memoCard).toHaveProperty('textArea');
      expect(theme.custom.sizes.memoCard).toHaveProperty('actionArea');
      expect(theme.custom).toHaveProperty('spacing');
      expect(theme.custom.spacing.cardPadding).toEqual({ xs: 1.5, sm: 2 });
    });

    it('pageHeader に titleFontSize, subtitleFontSize を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom.pageHeader).toHaveProperty('titleFontSize');
      expect(theme.custom.pageHeader).toHaveProperty('subtitleFontSize');
      expect(theme.custom.pageHeader.titleFontSize).toMatchObject({ xs: '1.5rem', sm: '2rem', md: '2.5rem' });
    });

    it('bookAccent, memoAccent, bookDecorations, memoDecorations を含む', () => {
      const theme = createThemeFromPreset('library-classic', mockBuildPath);
      expect(theme.custom).toHaveProperty('bookAccent', 'brown');
      expect(theme.custom).toHaveProperty('memoAccent', 'memo');
      expect(theme.custom.bookDecorations).toMatchObject({
        corners: true,
        innerBorder: true,
        centerLine: true,
      });
      expect(theme.custom.memoDecorations).toMatchObject({
        corners: false,
        innerBorder: false,
        centerLine: false,
        borderRadius: 0,
        foldedCorner: true,
        foldedCornerPosition: 'top-right',
      });
    });
  });

  describe('minimal-light の custom', () => {
    it('bookAccent, memoAccent が neutral である', () => {
      const theme = createThemeFromPreset('minimal-light', mockBuildPath);
      expect(theme.custom.bookAccent).toBe('neutral');
      expect(theme.custom.memoAccent).toBe('neutral');
    });

    it('cardAccent が neutral である', () => {
      const theme = createThemeFromPreset('minimal-light', mockBuildPath);
      expect(theme.custom.cardAccent).toBe('neutral');
    });

    it('cardDecorations, bookDecorations, memoDecorations がすべて false である', () => {
      const theme = createThemeFromPreset('minimal-light', mockBuildPath);
      expect(theme.custom.cardDecorations).toMatchObject({
        corners: false,
        innerBorder: false,
        centerLine: false,
      });
      expect(theme.custom.bookDecorations).toMatchObject({
        corners: false,
        innerBorder: false,
        centerLine: false,
      });
      expect(theme.custom.memoDecorations).toMatchObject({
        corners: false,
        innerBorder: false,
        centerLine: false,
      });
    });
  });
});
