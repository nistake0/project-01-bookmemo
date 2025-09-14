/**
 * memoRating定数のユニットテスト
 */

import {
  MEMO_RATING,
  MEMO_RATING_LABELS,
  MEMO_RATING_COLORS,
  DEFAULT_MEMO_RATING,
  ALL_MEMO_RATINGS,
  VALID_MEMO_RATINGS,
  isValidMemoRating,
  getMemoRatingLabel,
  getMemoRatingColor,
  isMemoRated,
  getMemoRatingValue,
  getMemoRatingSortOrder,
  getMemoRatingDescription
} from './memoRating';

describe('memoRating constants and utilities', () => {
  describe('MEMO_RATING constants', () => {
    test('should have correct rating values', () => {
      expect(MEMO_RATING.NONE).toBe(0);
      expect(MEMO_RATING.ONE).toBe(1);
      expect(MEMO_RATING.TWO).toBe(2);
      expect(MEMO_RATING.THREE).toBe(3);
      expect(MEMO_RATING.FOUR).toBe(4);
      expect(MEMO_RATING.FIVE).toBe(5);
    });
  });

  describe('MEMO_RATING_LABELS', () => {
    test('should have correct labels for all ratings', () => {
      expect(MEMO_RATING_LABELS[MEMO_RATING.NONE]).toBe('未評価');
      expect(MEMO_RATING_LABELS[MEMO_RATING.ONE]).toBe('★☆☆☆☆');
      expect(MEMO_RATING_LABELS[MEMO_RATING.TWO]).toBe('★★☆☆☆');
      expect(MEMO_RATING_LABELS[MEMO_RATING.THREE]).toBe('★★★☆☆');
      expect(MEMO_RATING_LABELS[MEMO_RATING.FOUR]).toBe('★★★★☆');
      expect(MEMO_RATING_LABELS[MEMO_RATING.FIVE]).toBe('★★★★★');
    });
  });

  describe('MEMO_RATING_COLORS', () => {
    test('should have correct colors for all ratings', () => {
      expect(MEMO_RATING_COLORS[MEMO_RATING.NONE]).toBe('default');
      expect(MEMO_RATING_COLORS[MEMO_RATING.ONE]).toBe('error');
      expect(MEMO_RATING_COLORS[MEMO_RATING.TWO]).toBe('warning');
      expect(MEMO_RATING_COLORS[MEMO_RATING.THREE]).toBe('info');
      expect(MEMO_RATING_COLORS[MEMO_RATING.FOUR]).toBe('primary');
      expect(MEMO_RATING_COLORS[MEMO_RATING.FIVE]).toBe('success');
    });
  });

  describe('DEFAULT_MEMO_RATING', () => {
    test('should be NONE (0)', () => {
      expect(DEFAULT_MEMO_RATING).toBe(MEMO_RATING.NONE);
      expect(DEFAULT_MEMO_RATING).toBe(0);
    });
  });

  describe('ALL_MEMO_RATINGS', () => {
    test('should contain all ratings except NONE', () => {
      expect(ALL_MEMO_RATINGS).toEqual([
        MEMO_RATING.ONE,
        MEMO_RATING.TWO,
        MEMO_RATING.THREE,
        MEMO_RATING.FOUR,
        MEMO_RATING.FIVE
      ]);
      expect(ALL_MEMO_RATINGS).not.toContain(MEMO_RATING.NONE);
    });
  });

  describe('VALID_MEMO_RATINGS', () => {
    test('should contain all ratings including NONE', () => {
      expect(VALID_MEMO_RATINGS).toEqual([
        MEMO_RATING.NONE,
        MEMO_RATING.ONE,
        MEMO_RATING.TWO,
        MEMO_RATING.THREE,
        MEMO_RATING.FOUR,
        MEMO_RATING.FIVE
      ]);
    });
  });

  describe('isValidMemoRating', () => {
    test('should return true for valid ratings', () => {
      expect(isValidMemoRating(MEMO_RATING.NONE)).toBe(true);
      expect(isValidMemoRating(MEMO_RATING.ONE)).toBe(true);
      expect(isValidMemoRating(MEMO_RATING.THREE)).toBe(true);
      expect(isValidMemoRating(MEMO_RATING.FIVE)).toBe(true);
    });

    test('should return false for invalid ratings', () => {
      expect(isValidMemoRating(-1)).toBe(false);
      expect(isValidMemoRating(6)).toBe(false);
      expect(isValidMemoRating(null)).toBe(false);
      expect(isValidMemoRating(undefined)).toBe(false);
    });
  });

  describe('getMemoRatingLabel', () => {
    test('should return correct label for valid ratings', () => {
      expect(getMemoRatingLabel(MEMO_RATING.ONE)).toBe('★☆☆☆☆');
      expect(getMemoRatingLabel(MEMO_RATING.FIVE)).toBe('★★★★★');
    });

    test('should return default label for invalid ratings', () => {
      expect(getMemoRatingLabel(999)).toBe('未評価');
      expect(getMemoRatingLabel(null)).toBe('未評価');
    });
  });

  describe('getMemoRatingColor', () => {
    test('should return correct color for valid ratings', () => {
      expect(getMemoRatingColor(MEMO_RATING.ONE)).toBe('error');
      expect(getMemoRatingColor(MEMO_RATING.FIVE)).toBe('success');
    });

    test('should return default color for invalid ratings', () => {
      expect(getMemoRatingColor(999)).toBe('default');
      expect(getMemoRatingColor(null)).toBe('default');
    });
  });

  describe('isMemoRated', () => {
    test('should return true for rated memos', () => {
      expect(isMemoRated(MEMO_RATING.ONE)).toBe(true);
      expect(isMemoRated(MEMO_RATING.FIVE)).toBe(true);
    });

    test('should return false for unrated memos', () => {
      expect(isMemoRated(MEMO_RATING.NONE)).toBe(false);
      expect(isMemoRated(0)).toBe(false);
    });

    test('should return false for invalid values', () => {
      expect(isMemoRated(null)).toBe(false);
      expect(isMemoRated(undefined)).toBe(false);
    });
  });

  describe('getMemoRatingValue', () => {
    test('should return rating value from memo object', () => {
      const memo = { rating: MEMO_RATING.THREE };
      expect(getMemoRatingValue(memo)).toBe(MEMO_RATING.THREE);
    });

    test('should return default rating for memo without rating', () => {
      const memo = {};
      expect(getMemoRatingValue(memo)).toBe(DEFAULT_MEMO_RATING);
    });

    test('should return default rating for null/undefined memo', () => {
      expect(getMemoRatingValue(null)).toBe(DEFAULT_MEMO_RATING);
      expect(getMemoRatingValue(undefined)).toBe(DEFAULT_MEMO_RATING);
    });
  });

  describe('getMemoRatingSortOrder', () => {
    test('should return rating value for rated memos', () => {
      expect(getMemoRatingSortOrder(MEMO_RATING.ONE)).toBe(1);
      expect(getMemoRatingSortOrder(MEMO_RATING.FIVE)).toBe(5);
    });

    test('should return 0 for unrated memos', () => {
      expect(getMemoRatingSortOrder(MEMO_RATING.NONE)).toBe(0);
    });

    test('should return 0 for invalid ratings', () => {
      expect(getMemoRatingSortOrder(null)).toBe(0);
      expect(getMemoRatingSortOrder(undefined)).toBe(0);
    });
  });

  describe('getMemoRatingDescription', () => {
    test('should return correct descriptions for all ratings', () => {
      expect(getMemoRatingDescription(MEMO_RATING.NONE)).toBe('ランク未設定');
      expect(getMemoRatingDescription(MEMO_RATING.ONE)).toBe('あまり面白くなかった');
      expect(getMemoRatingDescription(MEMO_RATING.TWO)).toBe('普通');
      expect(getMemoRatingDescription(MEMO_RATING.THREE)).toBe('まあまあ面白かった');
      expect(getMemoRatingDescription(MEMO_RATING.FOUR)).toBe('面白かった');
      expect(getMemoRatingDescription(MEMO_RATING.FIVE)).toBe('とても面白かった');
    });

    test('should return default description for invalid ratings', () => {
      expect(getMemoRatingDescription(999)).toBe('ランク未設定');
      expect(getMemoRatingDescription(null)).toBe('ランク未設定');
    });
  });
});
