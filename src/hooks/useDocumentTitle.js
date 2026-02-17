/**
 * M11: Per-page document title hook
 * Updates document.title based on the current page/section
 * Helps screen reader users and users with many tabs distinguish pages
 */

import { useEffect } from 'react';

const BASE_TITLE = 'Supplier Setup Form | Barts Health NHS Trust';

const useDocumentTitle = (pageTitle) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = pageTitle ? `${pageTitle} - ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
};

export default useDocumentTitle;
