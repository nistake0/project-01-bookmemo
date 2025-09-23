import { filterByText, filterByTags, filterByMemoContent, sortResults } from '../utils/searchFilters';

// 結果処理（フィルタ・ソート）を一か所に集約
export function processSearchResults(allResults, conditions = {}) {
  const { text, selectedTags, memoContent, sortBy = 'updatedAt', sortOrder = 'desc' } = conditions;

  // テキスト検索
  let filteredResults = filterByText(allResults, text);

  // タグフィルタ
  if (selectedTags && selectedTags.length > 0) {
    filteredResults = filterByTags(filteredResults, selectedTags);
  }

  // メモ内容フィルタ
  if (memoContent) {
    const books = filteredResults.filter((r) => r.type === 'book');
    const memos = filterByMemoContent(filteredResults.filter((r) => r.type === 'memo'), memoContent);
    filteredResults = [...books, ...memos];
  }

  // ソート
  return sortResults(filteredResults, sortBy, sortOrder);
}

export default { processSearchResults };


