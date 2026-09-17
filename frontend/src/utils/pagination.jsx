/** Page numbers with gaps: 1 … 4 5 [6] 7 8 … 20 */
export const pageWindow = (current, total, radius = 2) => {
  const pages = new Set([1, total]);
  for (let page = current - radius; page <= current + radius; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ['gap', page] : [page]));
};
