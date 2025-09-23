// 検索用の純粋関数群（副作用なし）

export function filterByText(items, searchText) {
  if (!searchText) return items;
  const normalizedSearchText = String(searchText).toLowerCase();

  return (items || []).filter((item) => {
    if (item.type === 'book') {
      return (
        (item.title && String(item.title).toLowerCase().includes(normalizedSearchText)) ||
        (item.author && String(item.author).toLowerCase().includes(normalizedSearchText)) ||
        (item.tags && Array.isArray(item.tags) && item.tags.some((tag) => String(tag).toLowerCase().includes(normalizedSearchText)))
      );
    }
    if (item.type === 'memo') {
      return (
        (item.text && String(item.text).toLowerCase().includes(normalizedSearchText)) ||
        (item.comment && String(item.comment).toLowerCase().includes(normalizedSearchText)) ||
        (item.tags && Array.isArray(item.tags) && item.tags.some((tag) => String(tag).toLowerCase().includes(normalizedSearchText)))
      );
    }
    return false;
  });
}

export function filterByTags(items, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return items;

  const flattenAndNormalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    const flattened = [];
    const processTag = (tag) => {
      if (Array.isArray(tag)) {
        tag.forEach(processTag);
      } else if (typeof tag === 'string' && tag.trim()) {
        flattened.push(tag.toLowerCase().trim());
      }
    };
    tags.forEach(processTag);
    return flattened;
  };

  const normalizedSelectedTags = flattenAndNormalizeTags(selectedTags);

  return (items || []).filter((item) => {
    if (!item.tags || !Array.isArray(item.tags)) return false;
    const itemTags = flattenAndNormalizeTags(item.tags);
    return itemTags.some((tag) => normalizedSelectedTags.includes(tag));
  });
}

export function filterByMemoContent(memos, memoContent) {
  if (!memoContent) return memos;
  const normalized = String(memoContent).toLowerCase();
  return (memos || []).filter((memo) => {
    return (
      (memo.text && String(memo.text).toLowerCase().includes(normalized)) ||
      (memo.comment && String(memo.comment).toLowerCase().includes(normalized))
    );
  });
}

export function sortResults(results, sortBy = 'updatedAt', sortOrder = 'desc') {
  const copy = [...(results || [])];
  copy.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
      aValue = aValue?.toDate ? aValue.toDate() : (aValue ? new Date(aValue) : new Date(0));
      bValue = bValue?.toDate ? bValue.toDate() : (bValue ? new Date(bValue) : new Date(0));
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });
  return copy;
}

export default { filterByText, filterByTags, filterByMemoContent, sortResults };


