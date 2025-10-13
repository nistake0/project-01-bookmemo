import {
  BOOK_STATUS,
  ACQUISITION_TYPE,
  BOOK_STATUS_LABELS,
  ACQUISITION_TYPE_LABELS,
  ALL_BOOK_STATUSES,
  ALL_ACQUISITION_TYPES,
  DEFAULT_BOOK_STATUS,
  getBookStatusLabel,
  getAcquisitionTypeLabel,
  getBookStatusColor,
  getNextBookStatus
} from './bookStatus';

describe('bookStatus constants', () => {
  describe('BOOK_STATUS', () => {
    it('should have correct status values', () => {
      expect(BOOK_STATUS.TSUNDOKU).toBe('tsundoku');
      expect(BOOK_STATUS.READING).toBe('reading');
      expect(BOOK_STATUS.SUSPENDED).toBe('suspended');
      expect(BOOK_STATUS.RE_READING).toBe('re-reading');
      expect(BOOK_STATUS.FINISHED).toBe('finished');
    });
  });

  describe('ACQUISITION_TYPE', () => {
    it('should have correct acquisition type values', () => {
      expect(ACQUISITION_TYPE.BOUGHT).toBe('bought');
      expect(ACQUISITION_TYPE.BORROWED).toBe('borrowed');
      expect(ACQUISITION_TYPE.GIFT).toBe('gift');
      expect(ACQUISITION_TYPE.UNKNOWN).toBe('unknown');
    });
  });

  describe('BOOK_STATUS_LABELS', () => {
    it('should have correct status labels', () => {
      expect(BOOK_STATUS_LABELS[BOOK_STATUS.TSUNDOKU]).toBe('積読');
      expect(BOOK_STATUS_LABELS[BOOK_STATUS.READING]).toBe('読書中');
      expect(BOOK_STATUS_LABELS[BOOK_STATUS.SUSPENDED]).toBe('中断');
      expect(BOOK_STATUS_LABELS[BOOK_STATUS.RE_READING]).toBe('再読中');
      expect(BOOK_STATUS_LABELS[BOOK_STATUS.FINISHED]).toBe('読了');
    });
  });

  describe('ACQUISITION_TYPE_LABELS', () => {
    it('should have correct acquisition type labels', () => {
      expect(ACQUISITION_TYPE_LABELS[ACQUISITION_TYPE.BOUGHT]).toBe('購入');
      expect(ACQUISITION_TYPE_LABELS[ACQUISITION_TYPE.BORROWED]).toBe('借り物');
      expect(ACQUISITION_TYPE_LABELS[ACQUISITION_TYPE.GIFT]).toBe('プレゼント');
      expect(ACQUISITION_TYPE_LABELS[ACQUISITION_TYPE.UNKNOWN]).toBe('不明');
    });
  });

  describe('ALL_BOOK_STATUSES', () => {
    it('should contain all status values', () => {
      expect(ALL_BOOK_STATUSES).toEqual([
        BOOK_STATUS.TSUNDOKU,
        BOOK_STATUS.READING,
        BOOK_STATUS.SUSPENDED,
        BOOK_STATUS.RE_READING,
        BOOK_STATUS.FINISHED
      ]);
    });
  });

  describe('ALL_ACQUISITION_TYPES', () => {
    it('should contain all acquisition type values', () => {
      expect(ALL_ACQUISITION_TYPES).toEqual([
        ACQUISITION_TYPE.BOUGHT,
        ACQUISITION_TYPE.BORROWED,
        ACQUISITION_TYPE.GIFT,
        ACQUISITION_TYPE.UNKNOWN
      ]);
    });
  });

  describe('DEFAULT_BOOK_STATUS', () => {
    it('should be TSUNDOKU', () => {
      expect(DEFAULT_BOOK_STATUS).toBe(BOOK_STATUS.TSUNDOKU);
    });
  });

  describe('getBookStatusLabel', () => {
    it('should return correct label for valid status', () => {
      expect(getBookStatusLabel(BOOK_STATUS.TSUNDOKU)).toBe('積読');
      expect(getBookStatusLabel(BOOK_STATUS.READING)).toBe('読書中');
    });

    it('should return default label for invalid status', () => {
      expect(getBookStatusLabel('invalid')).toBe('積読');
    });
  });

  describe('getAcquisitionTypeLabel', () => {
    it('should return correct label for valid acquisition type', () => {
      expect(getAcquisitionTypeLabel(ACQUISITION_TYPE.BOUGHT)).toBe('購入');
      expect(getAcquisitionTypeLabel(ACQUISITION_TYPE.BORROWED)).toBe('借り物');
    });

    it('should return unknown label for invalid acquisition type', () => {
      expect(getAcquisitionTypeLabel('invalid')).toBe('不明');
    });
  });

  describe('getBookStatusColor', () => {
    it('should return correct color for valid status', () => {
      expect(getBookStatusColor(BOOK_STATUS.TSUNDOKU)).toBe('default');
      expect(getBookStatusColor(BOOK_STATUS.READING)).toBe('primary');
      expect(getBookStatusColor(BOOK_STATUS.SUSPENDED)).toBe('warning');
      expect(getBookStatusColor(BOOK_STATUS.RE_READING)).toBe('secondary');
      expect(getBookStatusColor(BOOK_STATUS.FINISHED)).toBe('success');
    });

    it('should return default color for invalid status', () => {
      expect(getBookStatusColor('invalid')).toBe('default');
    });
  });

  describe('getNextBookStatus', () => {
    it('should return next status in cycle', () => {
      expect(getNextBookStatus(BOOK_STATUS.TSUNDOKU)).toBe(BOOK_STATUS.READING);
      expect(getNextBookStatus(BOOK_STATUS.READING)).toBe(BOOK_STATUS.SUSPENDED);
      expect(getNextBookStatus(BOOK_STATUS.SUSPENDED)).toBe(BOOK_STATUS.RE_READING);
      expect(getNextBookStatus(BOOK_STATUS.RE_READING)).toBe(BOOK_STATUS.FINISHED);
      expect(getNextBookStatus(BOOK_STATUS.FINISHED)).toBe(BOOK_STATUS.TSUNDOKU);
    });

    it('should return default status for invalid status', () => {
      expect(getNextBookStatus('invalid')).toBe(DEFAULT_BOOK_STATUS);
    });
  });
});
