/**
 * 日時変換ユーティリティのテスト
 */

import { convertToDate } from './dateUtils';

// FirestoreのTimestampオブジェクトをモック
const mockFirestoreTimestamp = {
  toDate: jest.fn(() => new Date('2024-01-01T12:00:00Z'))
};

describe('convertToDate', () => {

  it('FirestoreのTimestampオブジェクトを正しくDateオブジェクトに変換する', () => {
    const result = convertToDate(mockFirestoreTimestamp);
    expect(result).toBeInstanceOf(Date);
    expect(mockFirestoreTimestamp.toDate).toHaveBeenCalled();
  });

  it('既にDateオブジェクトの場合はそのまま返す', () => {
    const originalDate = new Date('2024-01-01T12:00:00Z');
    const result = convertToDate(originalDate);
    expect(result).toBe(originalDate);
  });

  it('文字列の場合は新しいDateオブジェクトを作成する', () => {
    const dateString = '2024-01-01T12:00:00Z';
    const result = convertToDate(dateString);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(new Date(dateString).getTime());
  });

  it('nullやundefinedの場合は新しいDateオブジェクトを作成する', () => {
    const resultNull = convertToDate(null);
    const resultUndefined = convertToDate(undefined);
    
    expect(resultNull).toBeInstanceOf(Date);
    expect(resultUndefined).toBeInstanceOf(Date);
  });

  it('数値の場合は新しいDateオブジェクトを作成する', () => {
    const timestamp = 1704110400000; // 2024-01-01T12:00:00Z のミリ秒
    const result = convertToDate(timestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(timestamp);
  });
});
