// 日付範囲フィルタの純粋関数

export function getDateRangeFilter(dateRange) {
  const now = new Date();
  let startDate = null;
  let endDate = null;
  if (!dateRange || !dateRange.type || dateRange.type === 'none') {
    return { startDate, endDate };
  }

  switch (dateRange.type) {
    case 'year':
      if (dateRange.year) {
        startDate = new Date(dateRange.year, 0, 1);
        endDate = new Date(dateRange.year, 11, 31, 23, 59, 59);
      }
      break;
    case 'month':
      if (dateRange.year && dateRange.month) {
        startDate = new Date(dateRange.year, dateRange.month - 1, 1);
        endDate = new Date(dateRange.year, dateRange.month, 0, 23, 59, 59);
      }
      break;
    case 'quarter':
      if (dateRange.year && dateRange.quarter) {
        const quarterStart = (dateRange.quarter - 1) * 3;
        startDate = new Date(dateRange.year, quarterStart, 1);
        endDate = new Date(dateRange.year, quarterStart + 3, 0, 23, 59, 59);
      }
      break;
    case 'custom':
      if (dateRange.startDate) {
        startDate = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59);
      }
      break;
    case 'recent':
      if (dateRange.months) {
        startDate = new Date(now.getFullYear(), now.getMonth() - dateRange.months, now.getDate());
        endDate = now;
      }
      break;
  }

  return { startDate, endDate };
}

export default { getDateRangeFilter };


