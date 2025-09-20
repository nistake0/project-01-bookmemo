/**
 * 日時変換ユーティリティ
 */

/**
 * FirestoreのTimestampオブジェクトをDateオブジェクトに変換する
 * @param {*} timestamp - 変換するタイムスタンプ（Firestore Timestamp、Date、文字列、数値など）
 * @returns {Date} 変換されたDateオブジェクト
 */
export const convertToDate = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    // FirestoreのTimestampオブジェクトの場合
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    // 既にDateオブジェクトの場合
    return timestamp;
  } else {
    // 文字列やその他の場合
    return new Date(timestamp);
  }
};
