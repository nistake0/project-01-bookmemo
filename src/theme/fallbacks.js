/**
 * テーマの decorative パレットが未定義の場合に使用するフォールバック値
 * design-implementation-plan.md Phase 0 で共通化
 */

/** 書籍カード用（茶系 brown） */
export const FALLBACK_BROWN = {
  light: 'rgba(139, 69, 19, 0.2)',
  lighter: 'rgba(139, 69, 19, 0.1)',
  borderHover: 'rgba(139, 69, 19, 0.3)',
};

/** メモカード用（紫系 memo） */
export const FALLBACK_MEMO = {
  light: 'rgba(123, 104, 238, 0.25)',
  lighter: 'rgba(123, 104, 238, 0.12)',
  borderHover: 'rgba(123, 104, 238, 0.4)',
  shadow: 'rgba(123, 104, 238, 0.08)',
  shadowHover: 'rgba(123, 104, 238, 0.12)',
};

/** FALLBACK_BROWN のエイリアス（既存の FALLBACK_ACCENT 互換） */
export const FALLBACK_ACCENT = FALLBACK_BROWN;
