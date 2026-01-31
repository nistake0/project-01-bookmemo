import { FALLBACK_BROWN, FALLBACK_MEMO, FALLBACK_ACCENT } from './fallbacks';

describe('fallbacks', () => {
  describe('FALLBACK_BROWN', () => {
    it('light, lighter, borderHover をエクスポートする', () => {
      expect(FALLBACK_BROWN).toHaveProperty('light');
      expect(FALLBACK_BROWN).toHaveProperty('lighter');
      expect(FALLBACK_BROWN).toHaveProperty('borderHover');
    });

    it('各値が rgba 形式の文字列である', () => {
      expect(typeof FALLBACK_BROWN.light).toBe('string');
      expect(FALLBACK_BROWN.light).toMatch(/^rgba?\(/);
      expect(typeof FALLBACK_BROWN.lighter).toBe('string');
      expect(typeof FALLBACK_BROWN.borderHover).toBe('string');
    });

    it('茶系（brown）の値である', () => {
      expect(FALLBACK_BROWN.light).toContain('139, 69, 19');
    });
  });

  describe('FALLBACK_MEMO', () => {
    it('light, lighter, borderHover, shadow, shadowHover をエクスポートする', () => {
      expect(FALLBACK_MEMO).toHaveProperty('light');
      expect(FALLBACK_MEMO).toHaveProperty('lighter');
      expect(FALLBACK_MEMO).toHaveProperty('borderHover');
      expect(FALLBACK_MEMO).toHaveProperty('shadow');
      expect(FALLBACK_MEMO).toHaveProperty('shadowHover');
    });

    it('各値が rgba 形式の文字列である', () => {
      expect(typeof FALLBACK_MEMO.light).toBe('string');
      expect(FALLBACK_MEMO.light).toMatch(/^rgba?\(/);
    });

    it('紫系（memo）の値である', () => {
      expect(FALLBACK_MEMO.light).toContain('123, 104, 238');
    });
  });

  describe('FALLBACK_ACCENT', () => {
    it('FALLBACK_BROWN と同一の参照である', () => {
      expect(FALLBACK_ACCENT).toBe(FALLBACK_BROWN);
    });
  });
});
