import { useEffect } from "react";

const SUFFIX = "Field Report";

/** Set document.title menjadi "<page> — Field Report". */
export function useDocumentTitle(page: string): void {
  useEffect(() => {
    document.title = `${page} — ${SUFFIX}`;
  }, [page]);
}
