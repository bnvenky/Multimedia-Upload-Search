const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps the words that matched the search query in <mark>. */
const Highlight = ({ text, terms = [] }) => {
  const words = terms.filter((term) => term.length > 1);
  if (!text || words.length === 0) return text;

  // A capturing group makes split() keep the matches at the odd indexes.
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi'));
  // Unmatched parts stay plain text nodes, so spacing and accessible names are preserved.
  return parts.map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part));
};

export default Highlight;
