import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · MediaVault` : 'MediaVault · Multimedia Upload & Search';
  }, [title]);
};
